
import express from 'express';
const router = express.Router();

// Recibe el pool como parámetro para compartir conexión

const userStatusRoutes = (pool) => {
  // PUT /users/:id/estado
  router.put('/users/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    // Mapear nombre_estado a id_estado
    let estado_id = 1;
    if (estado === 'suspendido') estado_id = 2;
    else if (estado === 'eliminado') estado_id = 0;
    else if (estado === 'activo') estado_id = 1;
    else return res.status(400).json({ error: 'Estado no válido' });
    try {
      const result = await pool.query(
        'UPDATE users SET estado_id = $1 WHERE id = $2 RETURNING *',
        [estado_id, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json({ success: true, user: result.rows[0] });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      res.status(500).json({ error: 'Error al actualizar estado del usuario' });
    }
  });
  return router;
};

export default userStatusRoutes;
