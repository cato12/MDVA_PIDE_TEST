/* import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Endpoint: GET /api/ruc/:ruc
router.get('/:ruc', async (req, res) => {
  const { ruc } = req.params;
  if (!ruc || !/^\d{11}$/.test(ruc)) {
    return res.status(400).json({ error: 'RUC inválido' });
  }
  const API_URL = `https://api.factiliza.com/v1/ruc/info/${ruc}`;
  const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTA5NyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.Iv4ECVdNNnx2toxI1foldUEvVqp5HerJRxbtrfh6NAA';
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    const data = await response.json();
    // Log de depuración para ver la estructura real de la respuesta
    console.log('Respuesta cruda API externa RUC:', JSON.stringify(data, null, 2));
    if (data.error) {
      return res.status(400).json({ error: data.error });
    }
    // Adaptación para campos reales de la API externa
    const d = data.data || data;
    const razonSocial = d.razonSocial || d.razon_social || d.nombre_o_razon_social || '';
    const nombreComercial = d.nombreComercial || d.nombre_comercial || '';
    const estado = (d.estado || '').toLowerCase();
    const condicion = (d.condicion || '').toLowerCase();
    const tipoContribuyente = d.tipoContribuyente || d.tipo_contribuyente || '';
    const fechaInscripcion = d.fechaInscripcion || d.fecha_inscripcion || '';
    const fechaInicioActividades = d.fechaInicioActividades || d.fecha_inicio_actividades || '';
    const actividadEconomica = d.actividadEconomica || d.actividad_economica || '';
    const sistemaEmision = d.sistemaEmision || d.sistema_emision || '';
    const sistemaContabilidad = d.sistemaContabilidad || d.sistema_contabilidad || '';
    // Dirección: si existe direccion_completa, usarla como string, si no, armar objeto
    let direccion = null;
    if (d.direccion_completa) {
      direccion = {
        direccionCompleta: d.direccion_completa,
        departamento: d.departamento || '',
        provincia: d.provincia || '',
        distrito: d.distrito || '',
        ubigeo: d.ubigeo_sunat || (Array.isArray(d.ubigeo) ? d.ubigeo[d.ubigeo.length-1] : ''),
      };
    } else if (d.direccion) {
      direccion = { direccion: d.direccion };
    }
    // Representante legal (no existe en ejemplo, mantener lógica)
    let representanteLegal = undefined;
    if (d.representanteLegal || d.representante_legal) {
      const rep = d.representanteLegal || d.representante_legal;
      representanteLegal = {
        tipoDocumento: rep.tipoDocumento || rep.tipo_documento || '',
        numeroDocumento: rep.numeroDocumento || rep.numero_documento || '',
        nombre: rep.nombre || ''
      };
    }
    // Actividades económicas, comprobantes, padrones (no existen en ejemplo, mantener lógica)
    const actividadesEconomicas = Array.isArray(d.actividadesEconomicas || d.actividades_economicas)
      ? (d.actividadesEconomicas || d.actividades_economicas).map(a => ({
          codigo: a.codigo || '',
          descripcion: a.descripcion || '',
          principal: !!a.principal
        }))
      : [];
    const comprobantes = Array.isArray(d.comprobantes)
      ? d.comprobantes.map(c => ({
          codigo: c.codigo || '',
          descripcion: c.descripcion || ''
        }))
      : [];
    const padrones = Array.isArray(d.padrones)
      ? d.padrones.map(p => ({
          codigo: p.codigo || '',
          descripcion: p.descripcion || '',
          desde: p.desde || '',
          hasta: p.hasta || ''
        }))
      : [];
    const normalizado = {
      ruc: d.numero || d.ruc || ruc,
      razonSocial,
      nombreComercial,
      estado,
      condicion,
      tipoContribuyente,
      fechaInscripcion,
      fechaInicioActividades,
      actividadEconomica,
      sistemaEmision,
      sistemaContabilidad,
      direccion,
      representanteLegal,
      actividadesEconomicas,
      comprobantes,
      padrones
    };
    return res.json(normalizado);
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando RUC' });
  }
});

export { router }; */


import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Endpoint: GET /api/ruc/:ruc
router.get('/:ruc', async (req, res) => {

  //const userId = req.user?.id;
  // Depuración detallada de fuentes de usuario
  console.log('[RUC API][Depuración][fuentes] req.user:', req.user);
  console.log('[RUC API][Depuración][fuentes] req.headers["x-user-id"]:', req.headers['x-user-id']);
  console.log('[RUC API][Depuración][fuentes] req.headers["x-user-email"]:', req.headers['x-user-email']);
  console.log('[RUC API][Depuración][fuentes] req.query.userId:', req.query.userId);
  console.log('[RUC API][Depuración][fuentes] req.query.userEmail:', req.query.userEmail);
  // MODIFICACION 18/07/2025 | RESOLUCIÓN CORRECTA DE USUARIO PARA AUDITORÍA RUC | INICIO
  let userId = null;
  let userIdSource = null;
  let usuario = null;
  if (req.user && req.user.id) {
    userId = req.user.id;
    userIdSource = 'req.user.id';
    usuario = req.user.email || req.user.dni || null;
  } else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
    userIdSource = 'header x-user-id';
    usuario = req.headers['x-user-email'] || req.headers['x-user-id'] || null;
    console.log('[Audit Debug] userId recibido:', userId);
  } else if (req.query.userId) {
    userId = req.query.userId;
    userIdSource = 'query userId';
    usuario = req.query.userEmail || req.query.userId || null;
  }
  // Si userId es numérico, buscar el email o dni en la base de datos
  if (/^\d+$/.test(String(userId))) {
    try {
      const pool = req.app.locals.pool;
      const { rows } = await pool.query('SELECT email, dni FROM users WHERE id = $1', [userId]);
      if (rows.length > 0) {
        usuario = rows[0].email || rows[0].dni || usuario;
      }
    } catch (e) {
      console.error('Error obteniendo email/dni para audit log RUC:', e);
    }
  }
  if (!usuario) usuario = 'desconocido';
  let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  // Depuración para saber cómo se resuelve el usuario
  console.log('[RUC API][Depuración] userId:', userId, '| userIdSource:', userIdSource, '| usuario:', usuario);
  // MODIFICACION 18/07/2025 | RESOLUCIÓN CORRECTA DE USUARIO PARA AUDITORÍA RUC | FIN
  const { ruc } = req.params;
  if (!ruc || !/^\d{11}$/.test(ruc)) {
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
    // Registrar búsqueda fallida en audit_logs
    try {
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
         VALUES ($1, 'busqueda_ruc', 'consulta_ruc', 'Búsqueda fallida de RUC', $2, 'fallido', $3)` ,
        [usuario, ip, JSON.stringify({ motivo: 'RUC inválido', ruc })]
      );
    } catch (e) { console.error('Error audit_logs búsqueda RUC fallida (RUC inválido):', e); }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
    return res.status(400).json({ error: 'RUC inválido' });
  }
  const API_URL = `https://api.factiliza.com/v1/ruc/info/${ruc}`;
  const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTA5NyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.Iv4ECVdNNnx2toxI1foldUEvVqp5HerJRxbtrfh6NAA';
  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    const data = await response.json();
    // MODIFICACION 18/07/2025 | DEPURACION REGISTRO USUARIO AUDIT_LOGS RUC | INICIO
    // Log de depuración para ver la estructura real de la respuesta
    console.log('Respuesta cruda API externa RUC:', JSON.stringify(data, null, 2));
    // Depuración para saber cómo se registra el usuario en audit_logs
    console.log('[RUC API][Depuración][audit_logs] usuario:', usuario, '| ip:', ip);
    // MODIFICACION 18/07/2025 | DEPURACION REGISTRO USUARIO AUDIT_LOGS RUC | FIN
    if (data.error) {
      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
      // Registrar búsqueda fallida en audit_logs
      try {
        await req.app.locals.pool.query(
          `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
           VALUES ($1, 'busqueda_ruc', 'consulta_ruc', 'Búsqueda fallida de RUC', $2, 'fallido', $3)` ,
          [usuario, ip, JSON.stringify({ motivo: data.error, ruc })]
        );
      } catch (e) { console.error('Error audit_logs búsqueda RUC fallida:', e); }
      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
      return res.status(400).json({ error: data.error });
    }
    // Adaptación para campos reales de la API externa
    const d = data.data || data;
    const razonSocial = d.razonSocial || d.razon_social || d.nombre_o_razon_social || '';
    const nombreComercial = d.nombreComercial || d.nombre_comercial || '';
    const estado = (d.estado || '').toLowerCase();
    const condicion = (d.condicion || '').toLowerCase();
    const tipoContribuyente = d.tipoContribuyente || d.tipo_contribuyente || '';
    const fechaInscripcion = d.fechaInscripcion || d.fecha_inscripcion || '';
    const fechaInicioActividades = d.fechaInicioActividades || d.fecha_inicio_actividades || '';
    const actividadEconomica = d.actividadEconomica || d.actividad_economica || '';
    const sistemaEmision = d.sistemaEmision || d.sistema_emision || '';
    const sistemaContabilidad = d.sistemaContabilidad || d.sistema_contabilidad || '';
    // Dirección: si existe direccion_completa, usarla como string, si no, armar objeto
    let direccion = null;
    if (d.direccion_completa) {
      direccion = {
        direccionCompleta: d.direccion_completa,
        departamento: d.departamento || '',
        provincia: d.provincia || '',
        distrito: d.distrito || '',
        ubigeo: d.ubigeo_sunat || (Array.isArray(d.ubigeo) ? d.ubigeo[d.ubigeo.length-1] : ''),
      };
    } else if (d.direccion) {
      direccion = { direccion: d.direccion };
    }
    // Representante legal (no existe en ejemplo, mantener lógica)
    let representanteLegal = undefined;
    if (d.representanteLegal || d.representante_legal) {
      const rep = d.representanteLegal || d.representante_legal;
      representanteLegal = {
        tipoDocumento: rep.tipoDocumento || rep.tipo_documento || '',
        numeroDocumento: rep.numeroDocumento || rep.numero_documento || '',
        nombre: rep.nombre || ''
      };
    }
    // Actividades económicas, comprobantes, padrones (no existen en ejemplo, mantener lógica)
    const actividadesEconomicas = Array.isArray(d.actividadesEconomicas || d.actividades_economicas)
      ? (d.actividadesEconomicas || d.actividades_economicas).map(a => ({
          codigo: a.codigo || '',
          descripcion: a.descripcion || '',
          principal: !!a.principal
        }))
      : [];
    const comprobantes = Array.isArray(d.comprobantes)
      ? d.comprobantes.map(c => ({
          codigo: c.codigo || '',
          descripcion: c.descripcion || ''
        }))
      : [];
    const padrones = Array.isArray(d.padrones)
      ? d.padrones.map(p => ({
          codigo: p.codigo || '',
          descripcion: p.descripcion || '',
          desde: p.desde || '',
          hasta: p.hasta || ''
        }))
      : [];
      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
    // --- AJUSTE: Mapeo robusto y validación de RUC ---
    let rucNormalizado = d.numeroDocumento || d.numero_documento || d.numero || d.ruc || ruc;
    if (typeof rucNormalizado === 'number') rucNormalizado = String(rucNormalizado);
    const normalizado = {
      ruc: rucNormalizado,
      // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
      razonSocial,
      nombreComercial,
      estado,
      condicion,
      tipoContribuyente,
      fechaInscripcion,
      fechaInicioActividades,
      actividadEconomica,
      sistemaEmision,
      sistemaContabilidad,
      direccion,
      representanteLegal,
      actividadesEconomicas,
      comprobantes,
      padrones
    };
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
    // Validar que el RUC normalizado sea un string de 11 dígitos
    if (!rucNormalizado || !/^\d{11}$/.test(rucNormalizado)) {
      // Registrar búsqueda fallida en audit_logs
      try {
        await req.app.locals.pool.query(
          `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
           VALUES ($1, 'busqueda_ruc', 'consulta_ruc', 'Búsqueda fallida de RUC', $2, 'fallido', $3)` ,
          [usuario, ip, JSON.stringify({ motivo: 'RUC inválido en respuesta externa', ruc: rucNormalizado })]
        );
      } catch (e) { console.error('Error audit_logs búsqueda RUC fallida (RUC inválido en respuesta externa):', e); }
      return res.status(400).json({ error: 'RUC inválido en respuesta externa' });
    }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
    // Registrar búsqueda exitosa en audit_logs SOLO CON RESUMEN
    try {
      const resumenAuditoria = {
        ruc: rucNormalizado,
        razonSocial,
        estado,
        condicion
      };
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
         VALUES ($1, 'busqueda_ruc', 'consulta_ruc', 'Búsqueda exitosa de RUC', $2, 'exitoso', $3)` ,
        [usuario, ip, JSON.stringify(resumenAuditoria)]
      );
      // También registrar en audit_logs_user para consultas recientes
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs_user (user_id, usuario, accion, modulo, descripcion, ip, resultado, detalles, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          userId,
          usuario,
          'busqueda_ruc',
          'consulta_ruc',
          'Búsqueda exitosa de RUC',
          ip,
          'exitoso',
          JSON.stringify(resumenAuditoria)
        ]
      );
    } catch (e) { console.error('Error audit_logs búsqueda RUC exitosa:', e); }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
    return res.json(normalizado);
  } catch (err) {
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | INICIO
    // Registrar error inesperado en audit_logs
    try {
      await req.app.locals.pool.query(
        `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
         VALUES ($1, 'busqueda_ruc', 'consulta_ruc', 'Error inesperado en búsqueda de RUC', $2, 'fallido', $3)` ,
        [usuario, ip, JSON.stringify({ error: err.message, ruc })]
      );
    } catch (e) { console.error('Error audit_logs búsqueda RUC error inesperado:', e); }
    // MODIFICACION 18/07/2025 | CAPTURA DE OPERACIONES RUC | FIN
    return res.status(500).json({ error: 'Error consultando RUC' });
  }
});

// MODIFICACION 18/07/2025 | ENDPOINT EXPORTACION RUC | INICIO
// Endpoint: POST /api/ruc/:ruc/exportar
router.post('/:ruc/exportar', async (req, res) => {
  // MODIFICACION 18/07/2025 | AUDITORIA EXPORTACION PDF RUC | INICIO
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
    } catch (e) { console.error('Error obteniendo email/dni para audit log RUC:', e); }
  }
  if (!usuario) usuario = 'desconocido';
  let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  const { ruc } = req.params;
  if (!ruc || !/^\d{11}$/.test(ruc)) {
    return res.status(400).json({ error: 'RUC inválido' });
  }
  // Registrar solo un resumen textual en la auditoría, sin datos inventados
  try {
    const resumen = `Exportación de PDF de RUC ${ruc} realizada por ${usuario}`;
    await req.app.locals.pool.query(
      `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
       VALUES ($1, 'exportacion', 'exportacion_ruc', 'Exportación de consulta RUC', $2, 'exitoso', $3)` ,
      [usuario, ip, resumen]
    );
  } catch (e) { console.error('Error audit_logs exportación RUC:', e); }
  return res.json({ success: true });
  // MODIFICACION 18/07/2025 | AUDITORIA EXPORTACION PDF RUC | FIN
});
// MODIFICACION 18/07/2025 | ENDPOINT EXPORTACION RUC | FIN

// MODIFICACION 18/07/2025 | ENDPOINT CONSULTAS RECIENTES RUC | INICIO

export { router };
