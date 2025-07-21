// Integración con Express para exponer la consulta DNI como endpoint REST

import express from 'express';
export const router = express.Router();
import { verifyAuth } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';

const dniLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // Máx 5 solicitudes por IP por minuto
  message: { error: 'Demasiadas consultas. Intente en unos segundos.' }
});

//router.get('/:dni', async (req, res) => {

// GET /api/dni/:dni
router.get('/:dni', verifyAuth, dniLimiter, async (req, res) => {
 const { dni } = req.params;

  //Determinar el origen del userId (solo una vez)
  let userId = null;
  let userIdSource = null;
  if (req.user && req.user.id) {
    userId = req.user.id;
    userIdSource = 'req.user.id';
  } else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    userIdSource = 'header x-user-id';
  } else if (req.query.userId) {
    userId = req.query.userId;
    userIdSource = 'query userId';
  }
  //MODIFICACION 18/07/2025 | CORRECCIÓN DE DUPLICIDAD userId/userIdSource | INICIO
  let usuario = req.user?.email || req.headers['x-user-email'] || req.headers['x-user-id'] || req.query.userId || 'desconocido';
  //Si userId es numérico, buscar el email o dni en la base de datos
  if (/^\d+$/.test(String(userId))) {
    try {
      const pool = req.app.locals.pool;
      const { rows } = await pool.query('SELECT email, dni FROM users WHERE id = $1', [userId]);
      if (rows.length > 0) {
        usuario = rows[0].email || rows[0].dni || usuario;
      }
    } catch (e) {
      console.error('Error obteniendo email/dni para audit log:', e);
    }
  }
  
  let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  //MODIFICACION 18/07/2025 | CORRECCIÓN DE DUPLICIDAD userId/userIdSource | FIN
  console.log(`[DNI API] userId recibido:`, userId, 'origen:', userIdSource);
  if (!userId) {
    //MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
    //Registrar búsqueda fallida en audit_logs
    try {
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, 'busqueda_dni', 'consulta_dni', 'Búsqueda fallida de DNI', $2, 'fallido', $3)` ,
        [usuario, ip, JSON.stringify({ motivo: 'No se recibió userId', dni })]
      );
    } catch (e) { console.error('Error audit_logs búsqueda DNI fallida (sin userId):', e); }
    //MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | FIN
    return res.status(400).json({ error: 'No se recibió userId. Asegúrate de enviarlo en la sesión, header x-user-id o query param userId.' });
  }

  try {
    const data = await consultarDNI(dni);
    // Log de depuración para ver la estructura real de la respuesta

    //console.log('Respuesta cruda API externa:', JSON.stringify(data, null, 2));
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DNI] Consulta respuesta:', JSON.stringify(data, null, 2));
    }

    if (data.error) {

      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
      // Registrar búsqueda fallida en audit_logs
      try {
        await req.app.locals.pool.query(
          `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
           VALUES ($1, 'busqueda_dni', 'consulta_dni', 'Búsqueda fallida de DNI', $2, 'fallido', $3)` ,
          [usuario, ip, JSON.stringify({ motivo: data.error, dni })]
        );
      } catch (e) { console.error('Error audit_logs búsqueda DNI fallida:', e); }
      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | FIN

      return res.status(400).json({ error: data.error });
    }
    // Si la respuesta tiene un campo "data" anidado, usarlo
    const d = data.data || data;
    // Normalización robusta de campos para el frontend
    const nombres = d.nombres || d.nombres_completos || d.nombres_completo || '';
    const apellidoPaterno = d.apellidoPaterno || d.apellido_paterno || '';
    const apellidoMaterno = d.apellidoMaterno || d.apellido_materno || '';
    let nombreCompleto = d.nombreCompleto || d.nombre_completo || '';
    if (!nombreCompleto && (apellidoPaterno || apellidoMaterno || nombres)) {
      nombreCompleto = `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`.trim();
    }
    const fechaNacimiento = d.fechaNacimiento || d.fecha_nacimiento || '';
    const sexo = d.sexo || d.genero || '';
    const estadoCivil = d.estadoCivil || d.estado_civil || '';
    const ubigeoNacimiento = d.ubigeoNacimiento || d.ubigeo_nacimiento || d.ubigeo_reniec || '';
    // Lugar de nacimiento anidado
    const lugarNacimiento = {
      departamento: d.departamento || d.departamentoNacimiento || d.departamento_nacimiento || '',
      provincia: d.provincia || d.provinciaNacimiento || d.provincia_nacimiento || '',
      distrito: d.distrito || d.distritoNacimiento || d.distrito_nacimiento || ''
    };
    // Dirección anidada
    let direccion = undefined;
    if (d.direccion || d.direccion_completa) {
      direccion = {
        departamento: d.departamento || '',
        provincia: d.provincia || '',
        distrito: d.distrito || '',
        direccionCompleta: d.direccion_completa || d.direccion || ''
      };
    }
    // Restricciones y votación (no existen en esta API, pero se deja por compatibilidad)
    const restricciones = d.restricciones || [];
    const votacion = d.votacion || undefined;
    const normalizado = {
      dni: d.numero || d.dni || dni,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      nombreCompleto,
      fechaNacimiento,
      sexo,
      estadoCivil,
      ubigeoNacimiento,
      lugarNacimiento,
      direccion,
      restricciones,
      votacion
    };

    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
    // Registrar búsqueda exitosa en audit_logs SOLO CON RESUMEN
    try {
      const resumenAuditoria = {
        dni: normalizado.dni,
        nombreCompleto: normalizado.nombreCompleto,
        fechaNacimiento: normalizado.fechaNacimiento,
        sexo: normalizado.sexo
      };
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
         VALUES ($1, 'busqueda_dni', 'consulta_dni', 'Búsqueda exitosa de DNI', $2, 'exitoso', $3)` ,
        [usuario, ip, JSON.stringify(resumenAuditoria)]
      );
      // NUEVO: Registrar también en audit_logs_users para mostrar en consultas recientes del usuario
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs_user (user_id, usuario, accion, modulo, descripcion, ip, resultado, detalles, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          userId,
          usuario,
          'busqueda_dni',
          'consulta_dni',
          'Búsqueda exitosa de DNI',
          ip,
          'exitoso',
          JSON.stringify({ dni: normalizado.dni, sexo: normalizado.sexo, nombreCompleto: normalizado.nombreCompleto, fechaNacimiento: normalizado.fechaNacimiento })
        ]
      );
    } catch (e) { console.error('Error audit_logs búsqueda DNI exitosa:', e); }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | FIN

    return res.json(normalizado);
  } catch (err) {

    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | INICIO
    // Registrar error inesperado en audit_logs
    try {
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
        VALUES ($1, 'busqueda_dni', 'consulta_dni', 'Error inesperado en búsqueda de DNI', $2, 'fallido', $3)` ,
        [usuario, ip, JSON.stringify({ error: err.message, dni })]
      );
    } catch (e) { console.error('Error audit_logs búsqueda DNI error inesperado:', e); }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES POR PARTE DEL USUARIO | FIN

    return res.status(500).json({ error: err.message });
  }
});


// MODIFICACION 18/07/2025 | ENDPOINT EXPORTACION DNI | INICIO
// Endpoint: GET /api/dni/:dni/exportar
router.get('/:dni/exportar', async (req, res) => {
  const { dni } = req.params;
  let userId = null;
  let usuario = null;
  if (req.user && req.user.id) {
    userId = req.user.id;
    usuario = req.user.email || req.user.dni || null;
  } else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    usuario = req.headers['x-user-email'] || req.headers['x-user-id'] || null;
  } else if (req.query.userId) {
    userId = req.query.userId;
    usuario = req.query.userEmail || req.query.userId || null;
  }
  if (/^\d+$/.test(String(userId))) {
    try {
      const pool = req.app.locals.pool;
      const { rows } = await pool.query('SELECT email, dni FROM users WHERE id = $1', [userId]);
      if (rows.length > 0) {
        usuario = rows[0].email || rows[0].dni || usuario;
      }
    } catch (e) { console.error('Error obteniendo email/dni para audit log DNI:', e); }
  }
  if (!usuario) usuario = 'desconocido';
  let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  if (!dni || !/^\d{8}$/.test(dni)) {
    return res.status(400).json({ error: 'DNI inválido' });
  }
  // MODIFICACION 18/07/2025 | ENVIO DE USUARIO EN CONSULTA RUC | INICIO
  // No se devuelven datos inventados, solo se registra la auditoría

  try {
    const resumen = `Exportación de PDF de DNI ${dni} realizada por ${usuario}`;
    await req.app.locals.pool.query(
      `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
       VALUES ($1, 'exportacion', 'exportacion_dni', 'Exportación de consulta DNI', $2, 'exitoso', $3)` ,
      [usuario, ip, resumen]
    );
  } catch (e) { console.error('Error audit_logs exportación DNI:', e); }

  return res.json({ success: true });
  // MODIFICACION 18/07/2025 | ENVIO DE USUARIO EN CONSULTA RUC | FIN
});
// MODIFICACION 18/07/2025 | ENDPOINT EXPORTACION DNI | FIN



//  integración con API externa de consulta DNI
/**
 * Consulta datos de una persona por DNI usando una API externa.
 * @param {string} dni - Número de DNI a consultar
 * @returns {Promise<object>} - Datos de la persona o error
 */
export async function consultarDNI(dni) {
  if (!dni || typeof dni !== 'string') throw new Error('DNI inválido');
  // API real: https://api.factiliza.com/v1/dni/info/{dni}
  const API_URL = process.env.DNI_API_URL || 'https://api.factiliza.com/v1/dni/info';
  const API_TOKEN = process.env.DNI_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTA5NyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.Iv4ECVdNNnx2toxI1foldUEvVqp5HerJRxbtrfh6NAA';
  try {
    const res = await fetch(`${API_URL}/${dni}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`Error consultando DNI: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

router.post('/:dni/exportar', async (req, res) => {
  const { dni } = req.params;
  // lógica para leer usuario similar a rucApi
  await pool.query(
    `INSERT INTO audit_logs_user (user_id, usuario, accion, modulo, descripcion, ip, resultado, detalles, fecha)
    VALUES ($1, $2, 'exportacion', 'exportacion_dni', 'Exportación de PDF DNI', $3, 'exitoso', $4, NOW())`,
    [userId, usuario, ip, JSON.stringify({ dni })]
  );
  res.json({ success: true });
});