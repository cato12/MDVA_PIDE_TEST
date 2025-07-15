import express from 'express';
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

export { router };