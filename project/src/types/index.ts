/**
 * Representa un usuario del sistema.
 * @interface User
 */
export interface User {
  id: string;                // Identificador único
  name: string;              // Nombre completo
  email: string;             // Correo electrónico
  role: 'trabajador' | 'administrador'; // Rol de usuario
  area: string;              // Área o departamento
  avatar?: string;           // URL del avatar (opcional)
  isActive: boolean;         // Estado de actividad
}

/**
 * Representa un expediente gestionado en el sistema.
 * @interface Expediente
 */
export interface Expediente {
  id: string;                // Identificador único
  numero: string;            // Número de expediente
  titulo: string;            // Título descriptivo
  descripcion: string;       // Descripción detallada
  area: string;              // Área responsable
  estado: 'borrador' | 'en_tramite' | 'observado' | 'aprobado' | 'archivado'; // Estado actual
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'; // Nivel de prioridad
  fechaCreacion: string;     // Fecha de creación (ISO)
  fechaModificacion: string; // Fecha de última modificación (ISO)
  solicitante: string;       // Nombre del solicitante
  documentos: Document[];    // Documentos asociados
}

/**
 * Representa un documento adjunto a un expediente.
 * @interface Document
 */
export interface Document {
  id: string;        // Identificador único
  nombre: string;    // Nombre del documento
  tipo: string;      // Tipo o extensión
  fecha: string;     // Fecha de carga (ISO)
  url: string;       // URL de acceso
}


/**
 * Estructura de un toast (notificación emergente).
 * @interface Toast
 */
export interface Toast {
  id: string;        // Identificador único
  mensaje: string;   // Mensaje a mostrar
  tipo: 'success' | 'error' | 'warning' | 'info'; // Tipo de toast
  duracion?: number; // Duración en ms (opcional)
}