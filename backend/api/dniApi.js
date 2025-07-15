// Integración con Express para exponer la consulta DNI como endpoint REST

import express from 'express';
export const router = express.Router();

// GET /api/dni/:dni
router.get('/:dni', async (req, res) => {
  const { dni } = req.params;
  try {
    const data = await consultarDNI(dni);
    // Log de depuración para ver la estructura real de la respuesta
    console.log('Respuesta cruda API externa:', JSON.stringify(data, null, 2));
    if (data.error) {
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
    return res.json(normalizado);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



// Ejemplo de integración con API externa de consulta DNI
// Puedes adaptar la URL y headers según el proveedor real


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