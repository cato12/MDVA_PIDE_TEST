// Función para consultar RUC desde el frontend (React)
// Llama al backend: GET /api/ruc/:ruc
export async function consultarRUC(ruc) {
  if (!ruc || typeof ruc !== 'string') throw new Error('RUC inválido');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  // MODIFICACION 18/07/2025 | ENVIO DE USUARIO EN CONSULTA RUC | INICIO
  // Obtener userId y email de localStorage
  const userId = localStorage.getItem('mdva_user_id');
  let userEmail = '';
  try {
    const userObj = JSON.parse(localStorage.getItem('municipal_user') || '{}');
    userEmail = userObj.email || '';
  } catch {}
  try {
    const res = await fetch(`${API_URL}/api/ruc/${ruc}` , {
      headers: {
        'x-user-id': userId || '',
        'x-user-email': userEmail || ''
      }
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error consultando RUC');
    }
    const raw = await res.json();
    console.log('DEBUG RUC raw:', raw);
    if (raw && (raw.ruc || raw.razonSocial)) {
      return raw;
    }
    if (raw && raw.data && typeof raw.data === 'object' && raw.data !== null) {
      const d = raw.data;
      if (Object.keys(d).length > 0) {
        return {
          ruc: d.numero || '',
          razonSocial: d.nombre_o_razon_social || '',
          nombreComercial: d.nombre_comercial || '',
          estado: d.estado || '',
          condicion: d.condicion || '',
          tipoContribuyente: d.tipo_contribuyente || '',
          fechaInscripcion: d.fecha_inscripcion || '',
          fechaInicioActividades: d.fecha_inicio_actividades || '',
          actividadEconomica: d.actividad_economica || '',
          sistemaEmision: d.sistema_emision || '',
          sistemaContabilidad: d.sistema_contabilidad || '',
          direccion: {
            direccionCompleta: d.direccion_completa || '',
            direccion: d.direccion || '',
            ubigeo: d.ubigeo_sunat || '',
            departamento: d.departamento || '',
            provincia: d.provincia || '',
            distrito: d.distrito || ''
          },
          representanteLegal: d.representante_legal ? {
            tipoDocumento: d.representante_legal.tipo_documento || '',
            numeroDocumento: d.representante_legal.numero_documento || '',
            nombre: d.representante_legal.nombre || ''
          } : undefined,
          actividadesEconomicas: Array.isArray(d.actividades_economicas) ? d.actividades_economicas : [],
          comprobantes: Array.isArray(d.comprobantes_autorizados) ? d.comprobantes_autorizados : [],
          padrones: Array.isArray(d.padrones) ? d.padrones : []
        };
      } else {
        return { error: 'Datos no encontrados' };
      }
    }
    return { error: 'Datos no encontrados' };
  } catch (err) {
    return { error: err.message };
  }
}
// Función para consultar DNI desde el frontend (React)
// Llama al backend: GET /api/dni/:dni

export async function consultarDNI(dni) {
  if (!dni || typeof dni !== 'string') throw new Error('DNI inválido');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_URL}/api/dni/${dni}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error consultando DNI');
    }
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

