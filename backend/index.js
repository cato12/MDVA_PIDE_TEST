import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import PasswordValidator from 'password-validator';
import { sendEmail } from './utils/mailer.js';
import { recordFailedAttempt, markWarned, resetAttempts } from './utils/loginAttempts.js';
import schema from './utils/passwordPolicy.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// MODIFICACION 18/07/2025 | CORRECCIÓN DE DUPLICIDAD userId/userIdSource | INICIO
app.locals.pool = pool;
// MODIFICACION 18/07/2025 | CORRECCIÓN DE DUPLICIDAD userId/userIdSource | FIN

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return next();

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
  } catch (err) {
    console.warn('[AuthMiddleware] Token inválido');
  }
  next();
}

//Modificacion - Implementacion de API Factiliza 14/07/2025 | INICIO
// Importar router de consulta DNI y RUC y montar endpoints después de inicializar app
import { router as dniApiRouter } from './api/dniApi.js';
import { router as auditLogsApiRouter } from './api/auditLogsApi.js';
import { router as rucApiRouter } from './api/rucApi.js';
app.use(authMiddleware);
app.use('/api/dni', dniApiRouter);
app.use('/api/ruc', rucApiRouter);
app.use('/api/audit-logs', auditLogsApiRouter);
//Modificacion - Implementacion de API Factiliza 14/07/2025 | FIN

// Routes de estado de usuario
import userStatusRoutes from './routes/userStatus.js';
app.use(userStatusRoutes(pool));

// Regex simple para validar emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/login', async (req, res) => {
  const { emailOrDni, password } = req.body;
  //const sessionToken = uuidv4();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '';
  const userKey = emailOrDni.toLowerCase();
  const MAX_ATTEMPTS = 3;

  if (!emailOrDni || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  //await db.usuario.update({ where: { id: user.id }, data: { sessionToken } });

  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.nombres, u.apellidos, u.dni, u.email, u.telefono,
            u.password, u.estado_id, c.nombre AS cargo_nombre, a.nombre AS area_nombre,
            LOWER(r.nombre) AS rol
      FROM users u
      LEFT JOIN cargos c ON u.cargo_id = c.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1 OR u.dni = $1
    `, [emailOrDni]);

    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, 'login', 'autenticacion', 'Intento fallido de login', $2, 'fallido', 'Credenciales incorrectas')
      `, [emailOrDni, ip]);
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const { count, warned } = recordFailedAttempt(userKey);
      if (count >= MAX_ATTEMPTS && !warned) {
        await pool.query(`
          INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
          VALUES ($1, 'login_bloqueado', 'autenticacion', 'Superó el máximo de intentos', $2, 'advertencia', 'Revisar actividad sospechosa')
        `, [emailOrDni, ip]);
        markWarned(userKey);
        return res.status(401).json({
          success: false,
          error: 'Credenciales incorrectas',
          warning: 'max_attempts_reached'
        });
      }
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }

    if (user.estado_id === 2) {
      return res.status(403).json({ success: false, error: 'Cuenta suspendida' });
    }

    const sessionToken = uuidv4();
    await pool.query('UPDATE users SET session_token = $1, ultimo_acceso = NOW() WHERE id = $2', [sessionToken, user.id]);
    //await pool.query('UPDATE users SET ultimo_acceso = NOW() WHERE id = $1', [user.id]);

    const { password: _, ...userData } = user;
    userData.id = user.id;

    // Mapear rol para frontend
    userData.rol = user.rol === 'usuario' ? 'trabajador' : 'administrador';
    await pool.query(`
      INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
      VALUES ($1, 'login', 'autenticacion', 'Inicio de sesión exitoso', $2, 'exitoso', null)
    `, [user.email || user.dni, ip]);
    resetAttempts(userKey);
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: userData.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    //return res.json({ success: true, user: userData, token });
    return res.json({ success: true, user: userData, token, sessionToken });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});


async function sendSecurityAlert(user, fails) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid#ddd;border-radius:8px;">
      <div style="background:#FFD2D0;padding:20px;text-align:center;">
        <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height:50px;">
      </div>
      <div style="padding:20px;">
        <h2 style="color:#C01702;">Alerta de Seguridad</h2>
        <p>Hola <strong>${user.nombres}</strong>,</p>
        <p>Se han registrado <strong>${fails}</strong> intentos fallidos de inicio de sesión en tu cuenta.</p>
        <p>Si no fuiste tú, por favor contacta con la Oficina de Transformación Digital.</p>
        <hr style="border-top:1px solid #eee;">
        <p style="font-size:12px;color:#666;">Mensaje automático – MDVA Sistema de Usuarios</p>
      </div>
    </div>`;
  await sendEmail({ to: user.email, subject: 'Alerta: intentos fallidos de acceso', html });
}

// --- CREAR USUARIO con password-policy y correo de bienvenida ---
app.post('/users', async (req, res) => {
  const { nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, password } = req.body;
  
    if (!nombres || !apellidos || !email || !telefono || !dni || !cargo_id || !rol_id || !area_id || !password) {
   
//Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ INICIO-----   
    // Registrar en audit_logs el intento fallido por validación
    try {
      let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
      if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
      let safeEmail = (typeof email === 'string' ? email : (email ? String(email) : '')).slice(0, 100);
      if (!safeEmail) safeEmail = 'no_proporcionado';
      await pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
        [
          safeEmail,
          'crear_usuario',
          'usuarios',
          'Intento fallido: faltan campos obligatorios',
          ip,
          'fallido',
          JSON.stringify({ nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, password })
        ]
      );
    } catch (e) {
      console.error('Error al registrar log de error de validación de usuario:', e);
    }
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  //Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----
  
  if (![nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, password].every(v => v))
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  if (!emailRegex.test(email))
    return res.status(400).json({ error: 'Formato de correo inválido' });
  if (!schema.validate(password))
    return res.status(400).json({ error: 'Contraseña insegura' });
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      `INSERT INTO users(nombres,apellidos,email,telefono,dni,cargo_id,rol_id,area_id,password,estado_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,1) RETURNING *`,
      [nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, hashedPwd]
    );
    const newUser = insert.rows[0];
    const info = await pool.query(
      `SELECT c.nombre AS cargo_nombre, a.nombre AS area_nombre
      FROM cargos c JOIN areas a ON a.id = $2
      WHERE c.id = $1`, [cargo_id, area_id]
    );
    const { cargo_nombre, area_nombre } = info.rows[0];
    await sendWelcomeEmail(newUser, cargo_nombre, area_nombre);
    console.log(`📧 Correo bienvenido enviado a ${newUser.email}`);
    
  
  //Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ INICIO-----    
    // Registrar en audit_logs (éxito)
    try {
      let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
      if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
      await pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
        [
          email || '',
          'crear_usuario',
          'usuarios',
          `Registro de nuevo usuario (${nombres || ''} ${apellidos || ''}, DNI: ${dni || ''})`,
          ip,
          'exitoso',
          null
        ]
      );
    } catch (e) {
      console.error('Error al registrar log de creación de usuario:', e);
    }
    res.status(201).json({ success: true, user: newUser });
    //res.status(201).json({ success: true, user: result.rows[0] });
  //Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    //Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ INICIO-----
    // Registrar en audit_logs (fallido)
    // Registrar log de error de usuario en una conexión separada para evitar rollback
    (async () => {
      try {
        let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
        if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
        let safeEmail = (typeof email === 'string' ? email : (email ? String(email) : '')).slice(0, 100);
        if (!safeEmail) safeEmail = 'no_proporcionado';
        const safeNombres = (typeof nombres === 'string' ? nombres : (nombres ? String(nombres) : '')).slice(0, 100);
        const safeApellidos = (typeof apellidos === 'string' ? apellidos : (apellidos ? String(apellidos) : '')).slice(0, 100);
        const safeDni = (typeof dni === 'string' ? dni : (dni ? String(dni) : '')).slice(0, 20);
        const safeAccion = 'crear_usuario'.slice(0, 100);
        const safeModulo = 'usuarios'.slice(0, 100);
        const safeDescripcion = (`Error al registrar usuario (${safeNombres} ${safeApellidos}, DNI: ${safeDni})`).slice(0, 1000);
        const safeIp = (ip || '').toString().slice(0, 45);
        const safeResultado = 'fallido'.slice(0, 50);
        let detalles = err && err.message ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
        detalles = detalles ? detalles.toString().slice(0, 1000) : '';
        console.log('Intentando registrar log de error de creación de usuario en audit_logs con:', {
          safeEmail,
          accion: safeAccion,
          modulo: safeModulo,
          descripcion: safeDescripcion,
          ip: safeIp,
          resultado: safeResultado,
          detalles
        });
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
            VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
            [
              safeEmail,
              safeAccion,
              safeModulo,
              safeDescripcion,
              safeIp,
              safeResultado,
              detalles
            ]
          );
          console.log('Log de error de creación de usuario registrado en audit_logs (conexión separada)');
        } finally {
          client.release();
        }
      } catch (e) {
        console.error('Error al registrar log de error de creación de usuario (conexión separada):', e, 'Datos:', { email, nombres, apellidos, dni });
      }
    })();
    //res.status(500).json({ error: 'Error al registrar usuario' });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
});

//Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----
   // res.status(500).json({ error: 'Error al registrar usuario' });
 // }
//});

async function sendWelcomeEmail(user, cargo, area) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid#ddd;border-radius:8px;">
      <div style="background:#FFD2D0;padding:20px;text-align:center;">
        <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height:50px;">
      </div>
      <div style="padding:20px;">
        <h2 style="color:#C01702;">¡Bienvenido/a al sistema MDVA!</h2>
        <p>Hola <strong>${user.nombres}</strong>, tu cuenta ha sido creada exitosamente.</p>
        <p><strong>Usuario:</strong> ${user.dni}<br>
          <strong>Teléfono:</strong> ${user.telefono}<br>
          <strong>Área:</strong> ${area}<br>
          <strong>Cargo:</strong> ${cargo}</p>
        <p>Ya puedes iniciar sesión haciendo clic en el botón:</p>
        <p style="text-align:center;margin:30px 0">
          <a href="http://localhost:5173/login" style="background-color:#C01702;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;">
            Iniciar Sesión
          </a>
        </p>
        <hr style="border-top:1px solid #eee;">
        <p style="font-size:12px;color:#666;">Mensaje automático – MDVA Sistema de Usuarios</p>
      </div>
    </div>`;
  await sendEmail({ to: user.email, subject: '¡Bienvenido al sistema MDVA!', html });
}

// --- ACTUALIZAR USUARIO con gestión de estado y cambio de contraseña ---
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nombres, apellidos, email, telefono, dni,
    cargo_id, rol_id, area_id, password, estado,
    solicitante
  } = req.body;

  if (!solicitante) {
    return res.status(400).json({ error: 'Campo "solicitante" requerido' });
  }
  try {
    const prevRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!prevRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    const prev = prevRes.rows[0];
    // Validaciones
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Formato de correo inválido' });

    let hashedPwd = prev.password;
    let pwdChanged = false;
    if (typeof password === 'string' && password.trim()) {
      if (!schema.validate(password)) {
        return res.status(400).json({ error: 'Contraseña insegura' });
      }
      const isSame = await bcrypt.compare(password, prev.password);
      if (!isSame) {
        hashedPwd = await bcrypt.hash(password, 10);
        pwdChanged = true;
      }
    }

    if (String(id) === String(solicitante) && String(prev.rol_id) !== String(rol_id)) {
      return res.status(403).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const fields = [nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, hashedPwd];
    let query = `
      UPDATE users SET nombres=$1,apellidos=$2,email=$3,telefono=$4,
        dni=$5,cargo_id=$6,rol_id=$7,area_id=$8,password=$9`;
    if (estado) {
      fields.push(estado);
      query += `,estado_id = (SELECT id_estado FROM estado WHERE LOWER(nombre_estado)=LOWER($10))`;
    }
    fields.push(id);
    query += ` WHERE id = $${fields.length} RETURNING *`;
    const updated = (await pool.query(query, fields)).rows[0];
    //res.json({ success: true, user: updated });
    const tasks = [];
    if (estado && prev.estado_id !== updated.estado_id) {
      tasks.push(sendStateChangeEmail(updated, estado));
    }
    if (pwdChanged) {
      tasks.push(sendPasswordChangeEmail(updated));
    }
    //await Promise.all(tasks);
    console.log(`📧 Notificaciones enviadas a ${updated.email}`);
  
    //Modificacion Logs de Auditoria - Registro de edicion de usuario (09/07/2025) ------ INICIO -----
    // Comparar campos y registrar log de auditoría
    const cambios = [];
    if (prev.nombres !== nombres) cambios.push('nombres');
    if (prev.apellidos !== apellidos) cambios.push('apellidos');
    if (prev.email !== email) cambios.push('email');
    if (prev.telefono !== telefono) cambios.push('telefono');
    if (prev.dni !== dni) cambios.push('dni');
    if (String(prev.cargo_id) !== String(cargo_id)) cambios.push('cargo_id');
    if (String(prev.rol_id) !== String(rol_id)) cambios.push('rol_id');
    if (String(prev.area_id) !== String(area_id)) cambios.push('area_id');
    //if (prev.password !== password) cambios.push('password');
    if (pwdChanged) cambios.push('password');

    // Registrar log solo si hubo cambios
    if (cambios.length > 0) {
      let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
      if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
      await pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
        [
          email || prev.email || '',
          'editar_usuario',
          'usuarios',
          `Usuario editado (ID: ${id}). Campos modificados: ${cambios.join(', ')}`,
          ip,
          'exitoso',
          JSON.stringify({ antes: prev, despues: updated, campos_modificados: cambios })
        ]
      );
    }

    //res.json({ success: true, user: updated });
    //Modificacion Logs de Auditoria - Registro de edicion de usuario (09/07/2025) ------ FIN -----  
    // Ejecución de tareas asíncronas sin bloquear la respuesta
    Promise.all(tasks).catch(e =>
      console.error('Error al enviar notificaciones de edición:', e)
    );

    const { password: _, ...userWithoutPassword } = updated;
    res.json({ success: true, user: userWithoutPassword });

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
});

async function sendStateChangeEmail(user, estado) {
  const label = estado.toLowerCase() === 'suspendido' ? 'Suspendida' : 'Reactivada';
  const subj = `Cuenta ${label}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid#ddd;border-radius:8px;">
      <div style="background:#FFD2D0;padding:20px;text-align:center;">
        <img src="https://i.pinimg
.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height:50px;">
      </div>
      <div style="padding:20px;">
        <h2 style="color:#C01702;">Cuenta ${label}</h2>
        <p>Hola <strong>${user.nombres}</strong>, tu cuenta ha sido ${label.toLowerCase()}.</p>
        <p>Si crees que fue un error, contacta al administrador.</p>
        <hr style="border-top:1px solid #eee;">
        <p style="font-size:12px;color:#666;">Mensaje automático – MDVA Sistema de Usuarios</p>
      </div>
    </div>`;
  await sendEmail({ to: user.email, subject: subj, html });
}

async function sendPasswordChangeEmail(user) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid#ddd;border-radius:8px;">
      <div style="background:#FFD2D0;padding:20px;text-align:center;">
        <img src="https://i.pinimg
.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height:50px;">
      </div>
      <div style="padding:20px;">
        <h2 style="color:#C01702;">Contraseña actualizada</h2>
        <p>Hola <strong>${user.nombres}</strong>, tu contraseña ha sido actualizada correctamente.</p>
        <p>Si no reconoces este cambio, contacta al administrador.</p>
        <hr style="border-top:1px solid #eee;">
        <p style="font-size:12px;color:#666;">Mensaje automático – MDVA Sistema de Usuarios</p>
      </div>
    </div>`;
  await sendEmail({ to: user.email, subject: 'Contraseña actualizada', html });
}

// MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
// Endpoint para registrar cierre de sesión de usuario
app.post('/logout', async (req, res) => {
  // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
  const { usuario } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip || '';
  if (!usuario) {
    return res.status(400).json({ error: 'Usuario no especificado' });
  }
  try {
    await pool.query(
      `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
       VALUES ($1, 'logout', 'autenticacion', 'Cierre de sesión', $2, 'exitoso', null)`,
      [usuario, ip]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error registrando logout en audit_logs:', err);
    return res.status(500).json({ error: 'Error registrando logout' });
  }

});

  // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | FIN

// Endpoint para eliminar un usuario físicamente
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
/*   try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const deletedUser = result.rows[0];
    res.json({ success: true, user: deletedUser }); */

  // Modificacion Logs de Auditoria 11/07/2025 15:31 - Registro en audit_logs, eliminacion de usuarios | INICIO
  try {
    // Obtener usuario antes de eliminar
    const prevResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (prevResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const prev = prevResult.rows[0];

    // Eliminar usuario
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const deletedUser = result.rows[0];

    // Registrar en audit_logs con depuración
    let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
    const accion = 'Usuario Eliminado';
    const descripcion = `Usuario eliminado del sistema`;
    const auditLogParams = [
      prev.email || prev.dni || '',
      accion,
      'usuarios',
      descripcion,
      ip,
      'exitoso',
      JSON.stringify({ usuario: prev })
    ];
    console.log('[AUDIT-DEBUG] Intentando registrar en audit_logs (eliminación):', {
      usuario: auditLogParams[0],
      accion: auditLogParams[1],
      modulo: auditLogParams[2],
      descripcion: auditLogParams[3],
      ip: auditLogParams[4],
      resultado: auditLogParams[5],
      detalles: auditLogParams[6]
    });
    try {
      const auditResult = await pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
         VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
        auditLogParams
      );
      console.log('[AUDIT-DEBUG] Registro en audit_logs (eliminación) exitoso:', auditResult.rowCount);
    } catch (auditErr) {
      console.error('[AUDIT-DEBUG] Error al registrar en audit_logs (eliminación):', auditErr);
    }

    res.json({ success: true, user: deletedUser });

// Modificacion Logs de Auditoria 11/07/2025 15:31 - Registro en audit_logs, eliminacion de usuarios | FIN  
    
    try {
      await sendEmail({
        to: deletedUser.email,
        subject: 'Cuenta eliminada',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color:rgb(255, 202, 195); padding: 20px; text-align: center;">
              <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height: 50px;" />
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #C01702;">Cuenta Eliminada</h2>
              <p>Hola <strong>${deletedUser.nombres}</strong>,</p>
              <p>Tu cuenta ha sido <strong>eliminada permanentemente</strong> del sistema MDVA.</p>
              <p>Si crees que fue un error, contacta con la Oficina de Transformación Digital.</p>
		          <hr style="border:none;border-top:1px solid #eee;" />
              <p style="font-size: 12px; color: #666;">Este mensaje es automático, por favor no lo respondas.</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
                Municipalidad Distrital de Vista Alegre — MDVA Sistema de Usuarios
            </div>
          </div>
        `
      });
      console.log('📧 Correo de eliminación enviado a', deletedUser.email);
    } catch (emailErr) {
      console.error('❌ Error al enviar correo de eliminación:', emailErr);
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Endpoint para obtener áreas
app.get('/areas', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM areas ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
});

//OBTENER USUARIO AL EXPORTAR PDF | 21/07/2025 | INICIO

// Endpoint para obtener un usuario por id
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, nombres, apellidos, email FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

//OBTENER USUARIO AL EXPORTAR PDF | 21/07/2025 | FIN


// Endpoint para limpiar logs de auditoría (solo admin)
app.post('/audit-logs/clear', async (req, res) => {
  const { usuario } = req.body;
  if (!usuario) {
    return res.status(400).json({ error: 'Usuario requerido' });
  }
  try {
    // Verificar si el usuario es administrador
    const userResult = await pool.query(
      `SELECT r.nombre FROM users u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1 OR u.dni = $1`,
      [usuario]
    );
    if (userResult.rows.length === 0 || userResult.rows[0].nombre.toLowerCase() !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden limpiar los logs' });
    }
    // Registrar acción en logs (autolog) DESPUÉS de eliminar
    await pool.query('DELETE FROM audit_logs');
    let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
    await pool.query(
      `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
       VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
      [usuario, 'limpiar_logs', 'auditoria', 'Limpieza de logs de auditoría', ip, 'exitoso', null]
    );
    res.json({ success: true, message: 'Logs de auditoría limpiados' });
  } catch (err) {
    console.error('Error al limpiar logs de auditoría:', err);
    res.status(500).json({ error: 'Error al limpiar logs de auditoría' });
  }
});

// Endpoint para obtener logs de auditoría
app.get('/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, timestamp, usuario, accion, modulo, descripcion, ip, resultado, detalles
      FROM audit_logs
      ORDER BY timestamp DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener logs de auditoría:', err);
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

//Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ INICIO -----

// Endpoint para obtener valores únicos de filtros de audit_logs
app.get('/audit-logs/filters', async (req, res) => {
  try {
    const [modulos, acciones, usuarios, resultados] = await Promise.all([
      pool.query('SELECT DISTINCT modulo FROM audit_logs ORDER BY modulo'),
      pool.query('SELECT DISTINCT accion FROM audit_logs ORDER BY accion'),
      pool.query('SELECT DISTINCT usuario FROM audit_logs ORDER BY usuario'),
      pool.query('SELECT DISTINCT resultado FROM audit_logs ORDER BY resultado')
    ]);
    res.json({
      modulos: modulos.rows.map(r => r.modulo),
      acciones: acciones.rows.map(r => r.accion),
      usuarios: usuarios.rows.map(r => r.usuario),
      resultados: resultados.rows.map(r => r.resultado)
    });
  } catch (err) {
    console.error('Error al obtener filtros de audit_logs:', err);
    res.status(500).json({ error: 'Error al obtener filtros de audit_logs' });
  }
});

//Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ FIN -----
// Endpoint para obtener roles
app.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// Endpoint para obtener cargos, opcionalmente filtrados por area_id
app.get('/cargos', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM cargos ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cargos' });
  }
});

// Endpoint para obtener todos los usuarios con nombre de cargo y área
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono, u.dni,
            c.nombre AS cargo, a.nombre AS area, u.rol_id, u.ultimo_acceso,
            u.estado_id, est.nombre_estado AS estado, u.password
      FROM users u
      LEFT JOIN cargos c ON u.cargo_id = c.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN estado est ON u.estado_id = est.id_estado
      ORDER BY u.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ INICIO -----


// Endpoint para registrar advertencias de validación del frontend en audit_logs
app.post('/audit-logs/frontend-warning', async (req, res) => {
  const { usuario, accion, modulo, descripcion, detalles } = req.body;
  let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  // Si la acción es exportar PDF, registrar como exitoso
  let resultado = 'advertencia';
  if (
    accion && accion.toLowerCase().includes('exportar') &&
    descripcion && descripcion.toLowerCase().includes('pdf')
  ) {
    resultado = 'exitoso';
  }
  try {
    await pool.query(
      `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
       VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
      [
        usuario || 'no_proporcionado',
        accion || 'validacion_frontend',
        modulo || 'usuarios',
        descripcion || 'Advertencia de validación en frontend',
        ip,
        resultado,
        detalles ? (typeof detalles === 'string' ? detalles : JSON.stringify(detalles)) : null
      ]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('Error al registrar advertencia frontend en audit_logs:', e);
    res.status(500).json({ error: 'Error al registrar advertencia' });
  }
});
// Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ FIN -----

// Endpoint para estadísticas del dashboard admin
app.get('/admin-stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM users');
    const adminResult = await pool.query(`
      SELECT COUNT(*) FROM users u
      JOIN roles r ON u.rol_id = r.id
      WHERE LOWER(r.nombre) = 'administrador'
    `);
    const jefeAreaResult = await pool.query(`
      SELECT COUNT(*) FROM users u
      JOIN cargos c ON u.cargo_id = c.id
      WHERE LOWER(c.nombre) = 'jefe de area'
    `);
    const trabajadoresResult = await pool.query(`
      SELECT COUNT(*) FROM users u
      JOIN cargos c ON u.cargo_id = c.id
      WHERE LOWER(c.nombre) = 'trabajador'
    `);
    // Contar usuarios suspendidos (estado_id = 2)
    const suspendidosResult = await pool.query(`
      SELECT COUNT(*) FROM users WHERE estado_id = 2
    `);
    res.json({
      total: parseInt(totalResult.rows[0].count),
      admins: parseInt(adminResult.rows[0].count),
      areaHeads: parseInt(jefeAreaResult.rows[0].count),
      trabajadores: parseInt(trabajadoresResult.rows[0].count),
      suspendidos: parseInt(suspendidosResult.rows[0].count)
      //recientes: recientes.rows
    });
  } catch (err) {
    console.error('Error en /admin-stats:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
});

app.put('/users/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET estado_id = (SELECT id_estado FROM estado WHERE LOWER(nombre_estado) = LOWER($1)) WHERE id = $2 RETURNING *',
      [estado, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const updatedUser = result.rows[0];
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Error al cambiar estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

// Endpoint para obtener todos los estados
app.get('/estado', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_estado AS id, nombre_estado AS nombre FROM estado ORDER BY id_estado');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estados' });
  }
});

// /users, /admin-stats, etc.
app.listen(port, () =>
  console.log(`Servidor escuchando en http://localhost:${port}`)
);

// backend/index.js o index.ts
app.get('/status', (req, res) => {
  res.status(200).send('OK');
});

app.post('/validate-session', async (req, res) => {
  const { userId, sessionToken } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT session_token FROM users WHERE id = $1',
      [userId]
    );

    const user = rows[0];

    if (!user || user.session_token !== sessionToken) {
      return res.status(401).json({ valid: false });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error('Error en /validate-session:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
  
  console.log('Token del usuario en DB:', user.session_token);
  console.log('Token recibido en body:', sessionToken);
});