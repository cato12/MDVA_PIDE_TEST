import express from 'express';
export const router = express.Router();

// Endpoint: GET /api/audit-logs/mis-consultas
router.get('/mis-consultas', async (req, res) => {
  try {
    // Determina el userId desde la sesión, header o query
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.headers['x-user-id']) {
      userId = req.headers['x-user-id'];
    } else if (req.query.userId) {
      userId = req.query.userId;
    }
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const pool = req.app.locals.pool;
    const { rows } = await pool.query(
      `SELECT id, accion, detalles, fecha FROM audit_logs_user WHERE user_id = $1 AND (accion = 'busqueda_dni' OR accion = 'busqueda_ruc') ORDER BY fecha DESC LIMIT 10`,
      [userId]
    );
    // Mapea los datos para extraer los campos del JSON detalles y distinguir tipo
    const mapped = rows.map(row => {
      let detalles = {};
      try {
        detalles = typeof row.detalles === 'string' ? JSON.parse(row.detalles) : row.detalles;
      } catch {}
      if (row.accion === 'busqueda_dni') {
        return {
          id: row.id,
          type: 'DNI',
          query: detalles.dni || '',
          result: detalles.nombreCompleto || '',
          sexo: detalles.sexo || '',
          fecha_nacimiento: detalles.fechaNacimiento || '',
          timestamp: row.fecha
        };
      } else if (row.accion === 'busqueda_ruc') {
        return {
          id: row.id,
          type: 'RUC',
          query: detalles.ruc || '',
          result: detalles.razonSocial || '',
          estado: detalles.estado || '',
          condicion: detalles.condicion || '',
          timestamp: row.fecha
        };
      } else {
        return {
          id: row.id,
          type: row.accion,
          query: '',
          result: '',
          timestamp: row.fecha
        };
      }
    });
    return res.json(mapped);
  } catch (err) {
    console.error('Error en /api/audit-logs/mis-consultas:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});
