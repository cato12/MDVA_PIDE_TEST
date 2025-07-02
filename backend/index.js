import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/login', async (req, res) => {
  const { emailOrDni, password } = req.body;
  if (!emailOrDni || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }
  try {
    const result = await pool.query(
      `SELECT u.*, c.nombre AS cargo_nombre, a.nombre AS area_nombre, LOWER(r.nombre) AS rol
       FROM users u
       LEFT JOIN cargos c ON u.cargo_id = c.id
       LEFT JOIN areas a ON c.area_id = a.id
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE (u.email = $1 OR u.dni = $1) AND u.password = $2`,
      [emailOrDni, password]
    );
    if (result.rows.length > 0) {
      const { password, ...userData } = result.rows[0];
      res.json({ success: true, user: userData });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error en el servidor' });
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

// Endpoint para obtener cargos 
app.get('/cargos', async (req, res) => {
  try {
     const result = await pool.query('SELECT id, nombre FROM cargos ORDER BY id');
     res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cargos' });
  }
});


// Endpoint para registrar un nuevo usuario
app.post('/users', async (req, res) => {
  const {
    nombres,
    apellidos,
    email,
    telefono,
    dni,
    cargo_id,
    rol_id,
    password
  } = req.body;
  if (!nombres || !apellidos || !email || !telefono || !dni || !cargo_id || !rol_id || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO users (nombres, apellidos, email, telefono, dni, cargo_id, rol_id, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombres, apellidos, email, telefono, dni, cargo_id, rol_id, password]
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en puerto ${port}`);
});
