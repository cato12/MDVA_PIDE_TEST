// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { Pool } from 'pg';
// import { sendEmail } from './utils/mailer.js';
// import { recordFailedAttempt, resetAttempts } from './utils/loginAttempts.js';
// import bcrypt from 'bcrypt';
// import PasswordValidator from 'password-validator';
// import schema from './utils/passwordPolicy.js';

// schema
//   .is().min(8)
//   .is().max(100)
//   .has().uppercase()
//   .has().lowercase()
//   .has().digits(1)
//   .has().symbols()
//   .has().not().spaces()

// dotenv.config();
// const app = express();
// const port = process.env.PORT || 4000;
// app.use(cors());
// app.use(express.json());
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
// import userStatusRoutes from './routes/userStatus.js';
// app.use(userStatusRoutes(pool));
// app.post('/login', async (req, res) => {
//   const { emailOrDni, password } = req.body;
//   if (!emailOrDni || !password) {
//     return res.status(400).json({ error: 'Faltan credenciales' });
//   }
//   try {
//     const userRes = await pool.query(
//       `SELECT u.id, u.nombres, u.apellidos, u.dni, u.email, u.telefono,
//               u.password,
//               c.nombre AS cargo_nombre,
//               a.nombre AS area_nombre,
//               LOWER(r.nombre) AS rol
//        FROM users u
//        LEFT JOIN cargos c ON u.cargo_id = c.id
//        LEFT JOIN areas a ON u.area_id = a.id
//        LEFT JOIN roles r ON u.rol_id = r.id
//        WHERE u.email = $1 OR u.dni = $1`,
//       [emailOrDni]
//     );
//     const user = userRes.rows[0];
//     const match = await bcrypt.compare(password, user.password);
//     if (!user || !match) {
//       const fails = await recordFailedAttempt(emailOrDni);
//       console.log(`🛑 Intento fallido para ${emailOrDni} — Total en 15min: ${fails}`);
//       if (fails >= 3 && user) {
//         await sendEmail({
//           to: user.email,
//           subject: 'Alerta: Intentos fallidos de acceso',
//           html: `
//             <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
//               <div style="background-color:rgb(255, 202, 195); padding: 20px; text-align: center;">
//                 <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height: 50px;" />
//               </div>
//               <div style="padding: 20px;">
//                 <h2 style="color: #C01702;">Alerta de Seguridad</h2>
//                 <p>Hola <strong>${user.nombres}</strong>,</p>
//                 <p>Se han registrado <strong>${fails}</strong> intentos fallidos de inicio de sesión en tu cuenta en los últimos 15 minutos.</p>
//                 <p>Si no reconoces estos accesos, puedes contactar con la Oficina de Transformación Digital.</p>
//                 <p style="font-size: 12px; color: #666;">Este mensaje es automático, por favor no lo respondas.</p>
//               </div>
//               <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
//                 Municipalidad Distrital de Vista Alegre — MDVA Sistema de Usuarios
//               </div>
//             </div>
//           `
//         });
//         console.log(`📧 Alerta enviada a ${user.email}`);
//       }
//       return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
//     }
//     resetAttempts(emailOrDni);
//     res.json({
//       success: true,
//       user: {
//         id: user.id,
//         nombres: user.nombres,
//         apellidos: user.apellidos,
//         dni: user.dni,
//         email: user.email,
//         telefono: user.telefono,
//         cargo_nombre: user.cargo_nombre || '',
//         area_nombre: user.area_nombre || '',
//         rol: user.rol
//       }
//     });
//   } catch (err) {
//     console.error('Error en /login:', err);
//     res.status(500).json({ error: 'Error en el servidor' });
//   }
// });

// // Endpoint para obtener áreas
// app.get('/areas', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, nombre FROM areas ORDER BY id');
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Error al obtener áreas' });
//   }
// });

// // Endpoint para obtener roles
// app.get('/roles', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, nombre FROM roles ORDER BY id');
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Error al obtener roles' });
//   }
// });

// // Endpoint para obtener cargos, opcionalmente filtrados por area_id
// app.get('/cargos', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id, nombre FROM cargos ORDER BY id');
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Error al obtener cargos' });
//   }
// });

// app.put('/users/:id', async (req, res) => {
//   const { id } = req.params;
//   const {
//     nombres, apellidos, email, telefono,
//     dni, cargo_id, rol_id, area_id, password, estado
//   } = req.body;
//   try {
//     const prevRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
//     if (!prevRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
//     const prev = prevRes.rows[0];
//     let hashedPwd = prev.password;
//     let pwdChanged = false;
//     if (password && password !== prev.password) {
//       if (!schema.validate(password)) {
//         return res.status(400).json({
//           error: 'La contraseña no cumple con los requisitos de seguridad. Debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y no contener espacios.'
//         });
//       }
//       hashedPwd = await bcrypt.hash(password, 10);
//       pwdChanged = true;
//     }
//     const fields = [
//       nombres, apellidos, email, telefono, dni,
//       cargo_id, rol_id, area_id, hashedPwd
//     ];
//     const placeholders = ['$1','$2','$3','$4','$5','$6','$7','$8','$9'];
//     let idx = 10;
//     let query = `UPDATE users SET
//       nombres=$1, apellidos=$2, email=$3, telefono=$4,
//       dni=$5, cargo_id=$6, rol_id=$7, area_id=$8, password=$9`;
//     if (estado) {
//       query += `, estado_id = (SELECT id_estado FROM estado WHERE LOWER(nombre_estado) = LOWER($${idx}))`;
//       fields.push(estado);
//     }
//     fields.push(id);
//     query += ` WHERE id = $${fields.length} RETURNING *`;
//     const updateRes = await pool.query(query, fields);
//     const updated = updateRes.rows[0];
//     res.json({ success: true, user: updated });
//     const tasks = [];
//     // Estado cambiado
//     if (estado && prev.estado_id !== updated.estado_id) {
//       const es = estado.toLowerCase();
//       const subj = es === 'suspendido' ? 'Cuenta suspendida' : 'Cuenta reactivada';
//       const label = es === 'suspendido' ? 'Suspendida' : 'Reactivada';
//       const html = `
//         <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border:1px solid #ddd; border-radius: 8px;">
//           <div style="background:#FCCCCC; text-align:center; padding:20px;">
//             <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg"
//                 alt="MDVA Logo" style="height:50px;">
//           </div>
//           <div style="padding:20px;">
//             <h2 style="color:#C01702;">Cuenta ${label}</h2>
//             <p>Hola <strong>${updated.nombres}</strong>,</p>
//             <p>Tu cuenta ha sido <strong>${label.toLowerCase()}</strong>.</p>
//             <p>Si crees que fue un error, contacta al administrador.</p>
//             <hr style="border-top:1px solid #eee;" />
//             <p style="font-size:12px;color:#666;">Mensaje automático – MDVA</p>
//           </div>
//         </div>`;
//       tasks.push(sendEmail({ to: updated.email, subject: subj, html }));
//     }

//     // Contraseña cambiada
//     if (pwdChanged) {
//       const html = `
//         <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border:1px solid #ddd; border-radius: 8px;">
//           <div style="background:#FCCCCC; text-align:center; padding:20px;">
//             <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg"
//                 alt="MDVA Logo" style="height:50px;">
//           </div>
//           <div style="padding:20px;">
//             <h2 style="color:#C01702;">Contraseña actualizada</h2>
//             <p>Hola <strong>${updated.nombres}</strong>,</p>
//             <p>Tu contraseña ha sido actualizada exitosamente.</p>
//             <p>Si no reconoces este cambio, contacta al administrador.</p>
//             <hr style="border-top:1px solid #eee;" />
//             <p style="font-size:12px;color:#666;">Mensaje automático – MDVA</p>
//           </div>
//         </div>`;
//       tasks.push(sendEmail({ to: updated.email, subject: 'Contraseña actualizada', html }));
//     }
//     await Promise.all(tasks);
//     console.log(`📧 Notificaciones enviadas a ${updated.email}`);
//   } catch (err) {
//     console.error('Error al actualizar usuario:', err);
//     res.status(500).json({ error: 'Error al actualizar usuario' });
//   }
// });

// // Endpoint para obtener todos los estados
// app.get('/estado', async (req, res) => {
//   try {
//     const result = await pool.query('SELECT id_estado AS id, nombre_estado AS nombre FROM estado ORDER BY id_estado');
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Error al obtener estados' });
//   }
// });

// // Endpoint para eliminar un usuario físicamente
// app.delete('/users/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const result = await pool.query(
//       'DELETE FROM users WHERE id = $1 RETURNING *',
//       [id]
//     );
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Usuario no encontrado' });
//     }
//     const deletedUser = result.rows[0];
//     res.json({ success: true, user: deletedUser });
//     try {
//       await sendEmail({
//         to: deletedUser.email,
//         subject: 'Cuenta eliminada',
//         html: `
//           <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
//             <div style="background-color:rgb(255, 202, 195); padding: 20px; text-align: center;">
//               <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height: 50px;" />
//             </div>
//             <div style="padding: 20px;">
//               <h2 style="color: #C01702;">Cuenta Eliminada</h2>
//               <p>Hola <strong>${deletedUser.nombres}</strong>,</p>
//               <p>Tu cuenta ha sido <strong>eliminada permanentemente</strong> del sistema MDVA.</p>
//               <p>Si crees que fue un error, contacta con la Oficina de Transformación Digital.</p>
// 		          <hr style="border:none;border-top:1px solid #eee;" />
//               <p style="font-size: 12px; color: #666;">Este mensaje es automático, por favor no lo respondas.</p>
//             </div>
//             <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
//                 Municipalidad Distrital de Vista Alegre — MDVA Sistema de Usuarios
//             </div>
//           </div>
//         `
//       });
//       console.log('📧 Correo de eliminación enviado a', deletedUser.email);
//     } catch (emailErr) {
//       console.error('❌ Error al enviar correo de eliminación:', emailErr);
//     }
//   } catch (err) {
//     console.error('Error al eliminar usuario:', err);
//     res.status(500).json({ error: 'Error al eliminar usuario' });
//   }
// });

// // Endpoint para registrar un nuevo usuario
// app.post('/users', async (req, res) => {
//   const {
//     nombres, apellidos, email, telefono, dni,
//     cargo_id, rol_id, area_id, password
//   } = req.body;
//   if (!nombres || !apellidos || !email || !telefono || !dni || !cargo_id || !rol_id || !area_id || !password) {
//     return res.status(400).json({ error: 'Faltan campos obligatorios' });
//   }
//   // Validar políticas de contraseña
//   if (!schema.validate(password)) {
//     return res.status(400).json({ error: 'Contraseña insegura' });
//   }
//   try {
//     const hashedPwd = await bcrypt.hash(password, 10);
//     const insertResult = await pool.query(
//       `INSERT INTO users (nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, password, estado_id)
//        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
//       [nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, hashedPwd, 1]
//     );
//     const newUser = insertResult.rows[0];
//     // Obtener nombres descriptivos de cargo y área
//     const infoResult = await pool.query(`
//       SELECT c.nombre AS cargo_nombre, a.nombre AS area_nombre
//       FROM cargos c, areas a
//       WHERE c.id = $1 AND a.id = $2
//     `, [cargo_id, area_id]);
//     const { cargo_nombre, area_nombre } = infoResult.rows[0];
//     // Correo de bienvenida
//     const html = `
//       <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border:1px solid #ddd; border-radius: 8px;">
//         <div style="background-color:rgb(255, 202, 195); padding: 20px; text-align: center;">
//           <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height: 50px;" />
//         </div>
//         <div style="padding: 20px;">
//           <h2 style="color: #C01702;">¡Bienvenido/a al Sistema MDVA!</h2>
//           <p>Hola <strong>${newUser.nombres}</strong>,</p>
//           <p>Tu cuenta ha sido creada exitosamente en el <strong>sistema de usuarios de la Municipalidad Distrital de Vista Alegre</strong>.</p>
//           <p><strong>Usuario:</strong> ${newUser.dni}</p>
//           <p><strong>Teléfono:</strong> ${newUser.telefono}</p>
//           <p><strong>Área:</strong> ${area_nombre}</p>
//           <p><strong>Cargo:</strong> ${cargo_nombre}</p>
//           <p>Puedes ingresar con tu contraseña asignada. Si deseas cambiarla, comunícate con la Oficina de Transformación Digital.</p>
//           <p>¡Gracias por formar parte de nuestra comunidad digital!</p>
//           <p style="text-align: center; margin: 30px 0;">
//             <a href="http://localhost:5173/login" style="background-color: #C01702; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;">
//               Iniciar Sesión en MDVA
//             </a>
//           </p>
//           <hr style="border:none;border-top:1px solid #eee;" />
//           <p style="font-size: 12px; color: #666;">Este mensaje es automático, por favor no lo respondas.</p>
//         </div>
//         <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
//           Municipalidad Distrital de Vista Alegre — MDVA Sistema de Usuarios
//         </div>
//       </div>`;
//     await sendEmail({
//       to: newUser.email,
//       subject: '¡Bienvenido al Sistema MDVA!',
//       html
//     });
//     console.log(`📧 Correo de bienvenida enviado a ${newUser.email}`);
//     res.status(201).json({ success: true, user: newUser });
//   } catch (err) {
//     console.error('Error al registrar usuario:', err);
//     res.status(500).json({ error: 'Error al registrar usuario' });
//   }
// });

// // Endpoint para obtener todos los usuarios con nombre de cargo y área
// app.get('/users', async (req, res) => {
//   try {
//     const result = await pool.query(`
//       SELECT u.id, u.nombres, u.apellidos, u.email, u.telefono, u.dni,
//             c.nombre AS cargo, a.nombre AS area, u.rol_id, u.ultimo_acceso,
//             u.estado_id, est.nombre_estado AS estado, u.password
//       FROM users u
//       LEFT JOIN cargos c ON u.cargo_id = c.id
//       LEFT JOIN areas a ON u.area_id = a.id
//       LEFT JOIN estado est ON u.estado_id = est.id_estado
//       ORDER BY u.id
//     `);
//     res.json(result.rows);
//   } catch (err) {
//     console.error('Error al obtener usuarios:', err);
//     res.status(500).json({ error: 'Error al obtener usuarios' });
//   }
// });

// app.listen(port, () => {
//   console.log(`Servidor backend escuchando en puerto ${port}`);
// });

// // Endpoint para estadísticas del dashboard admin
// app.get('/admin-stats', async (req, res) => {
//   try {
//     const totalResult = await pool.query('SELECT COUNT(*) FROM users');
//     const adminResult = await pool.query(`
//       SELECT COUNT(*) FROM users u
//       JOIN roles r ON u.rol_id = r.id
//       WHERE LOWER(r.nombre) = 'administrador'
//     `);
//     const jefeAreaResult = await pool.query(`
//       SELECT COUNT(*) FROM users u
//       JOIN cargos c ON u.cargo_id = c.id
//       WHERE LOWER(c.nombre) = 'jefe de area'
//     `);
//     const trabajadoresResult = await pool.query(`
//       SELECT COUNT(*) FROM users u
//       JOIN cargos c ON u.cargo_id = c.id
//       WHERE LOWER(c.nombre) = 'trabajador'
//     `);
//     // Contar usuarios suspendidos (estado_id = 2)
//     const suspendidosResult = await pool.query(`
//       SELECT COUNT(*) FROM users WHERE estado_id = 2
//     `);
//     res.json({
//       total: parseInt(totalResult.rows[0].count),
//       admins: parseInt(adminResult.rows[0].count),
//       areaHeads: parseInt(jefeAreaResult.rows[0].count),
//       trabajadores: parseInt(trabajadoresResult.rows[0].count),
//       suspendidos: parseInt(suspendidosResult.rows[0].count)
//       //recientes: recientes.rows
//     });
//   } catch (err) {
//     console.error('Error en /admin-stats:', err);
//     res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
//   }
// });

// app.put('/users/:id/estado', async (req, res) => {
//   const { id } = req.params;
//   const { estado } = req.body;
//   try {
//     const result = await pool.query(
//       'UPDATE users SET estado_id = (SELECT id_estado FROM estado WHERE LOWER(nombre_estado) = LOWER($1)) WHERE id = $2 RETURNING *',
//       [estado, id]
//     );
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Usuario no encontrado' });
//     }
//     const updatedUser = result.rows[0];
//     res.json({ success: true, user: updatedUser });
//   } catch (err) {
//     console.error('Error al cambiar estado:', err);
//     res.status(500).json({ error: 'Error al cambiar estado del usuario' });
//   }
// });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import PasswordValidator from 'password-validator';
import { sendEmail } from './utils/mailer.js';
import { recordFailedAttempt, resetAttempts } from './utils/loginAttempts.js';
import schema from './utils/passwordPolicy.js'; // esquema correcto

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Routes de estado de usuario
import userStatusRoutes from './routes/userStatus.js';
app.use(userStatusRoutes(pool));

// Regex simple para validar emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- LOGIN endpoint mejorado ---
app.post('/login', async (req, res) => {
  const { emailOrDni, password } = req.body;
  if (!emailOrDni || !password)
    return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombres, u.apellidos, u.dni, u.email, u.telefono,
      u.password, u.estado_id, c.nombre AS cargo_nombre, a.nombre AS area_nombre,
      LOWER(r.nombre) AS rol
      FROM users u
      LEFT JOIN cargos c ON u.cargo_id = c.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1 OR u.dni = $1`,
      [emailOrDni]
    );

    const user = rows[0];
    const valid = user && await bcrypt.compare(password, user.password);
    if (!valid) {
      const fails = recordFailedAttempt(emailOrDni);
      console.log(`🛑 Intento fallido para ${emailOrDni} — Total en 15min: ${fails}`);
      if (fails >= 3 && user) {
        await sendSecurityAlert(user, fails);
      }
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
    if (user.estado_id === 2) {
      return res.status(403).json({ success: false, error: 'Cuenta suspendida' });
    }

    resetAttempts(emailOrDni);
    return res.json({
      success: true,
      user: {
        id: user.id, nombres: user.nombres, apellidos: user.apellidos,
        dni: user.dni, email: user.email, telefono: user.telefono,
        cargo: user.cargo_nombre, area: user.area_nombre, rol: user.rol
      }
    });
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).json({ error: 'Error en el servidor' });
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
    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

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
  const { nombres, apellidos, email, telefono, dni, cargo_id, rol_id, area_id, password, estado } = req.body;
  try {
    const prevRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!prevRes.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    const prev = prevRes.rows[0];
    // Validaciones
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Formato de correo inválido' });
    let hashedPwd = prev.password;
    let pwdChanged = false;
    if (password && !(await bcrypt.compare(password, prev.password))) {
      if (!schema.validate(password))
        return res.status(400).json({ error: 'Contraseña insegura' });
      hashedPwd = await bcrypt.hash(password, 10);
      pwdChanged = true;
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
    res.json({ success: true, user: updated });
    const tasks = [];
    if (estado && prev.estado_id !== updated.estado_id) {
      tasks.push(sendStateChangeEmail(updated, estado));
    }
    if (pwdChanged) {
      tasks.push(sendPasswordChangeEmail(updated));
    }
    await Promise.all(tasks);
    console.log(`📧 Notificaciones enviadas a ${updated.email}`);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
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

// Endpoint para eliminar un usuario físicamente
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const deletedUser = result.rows[0];
    res.json({ success: true, user: deletedUser });
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