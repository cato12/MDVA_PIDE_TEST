/**
 * Monitoreo y auditoría de eventos del sistema.
 * Muestra logs detallados, filtros, estadísticas y modal de detalles.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Header institucional
 * - Estadísticas rápidas
 * - Filtros avanzados
 * - Tabla de logs
 * - Modal de detalles
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module AuditLogs
 */
import { useState } from 'react';
import {
  Shield, Search, Filter, Calendar, User, Activity,
  AlertTriangle, CheckCircle, XCircle, Eye, Clock
} from 'lucide-react';

/**
 * Estructura de un log de auditoría.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  accion: string;
  modulo: string;
  descripcion: string;
  ip: string;
  resultado: 'exitoso' | 'fallido' | 'advertencia';
  detalles?: string;
}

// Datos simulados de logs para demostración
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-25T14:30:15',
    usuario: 'Carlos Vargas',
    accion: 'LOGIN',
    modulo: 'Autenticación',
    descripcion: 'Inicio de sesión exitoso',
    ip: '192.168.1.100',
    resultado: 'exitoso'
  },
  {
    id: '2',
    timestamp: '2024-01-25T14:25:42',
    usuario: 'María Quispe',
    accion: 'CREATE_EXPEDIENTE',
    modulo: 'Expedientes',
    descripcion: 'Creación de expediente EXP-2024-003',
    ip: '192.168.1.105',
    resultado: 'exitoso',
    detalles: 'Expediente: Ampliación de Red Eléctrica'
  },
  {
    id: '3',
    timestamp: '2024-01-25T14:20:18',
    usuario: 'Ana Mendoza',
    accion: 'APPROVE_DOCUMENT',
    modulo: 'Aprobaciones',
    descripcion: 'Aprobación de solicitud de recursos SR-2024-015',
    ip: '192.168.1.102',
    resultado: 'exitoso'
  },
  {
    id: '4',
    timestamp: '2024-01-25T14:15:33',
    usuario: 'Sistema',
    accion: 'BACKUP',
    modulo: 'Sistema',
    descripcion: 'Respaldo automático de base de datos',
    ip: 'localhost',
    resultado: 'exitoso'
  },
  {
    id: '5',
    timestamp: '2024-01-25T14:10:07',
    usuario: 'Pedro Ramírez',
    accion: 'LOGIN_FAILED',
    modulo: 'Autenticación',
    descripcion: 'Intento de inicio de sesión fallido',
    ip: '192.168.1.110',
    resultado: 'fallido',
    detalles: 'Contraseña incorrecta - 3er intento'
  },
  {
    id: '6',
    timestamp: '2024-01-25T14:05:22',
    usuario: 'Carlos Vargas',
    accion: 'UPDATE_USER',
    modulo: 'Usuarios',
    descripcion: 'Modificación de permisos de usuario',
    ip: '192.168.1.100',
    resultado: 'exitoso',
    detalles: 'Usuario: José Fernández - Permisos actualizados'
  },
  {
    id: '7',
    timestamp: '2024-01-25T13:58:45',
    usuario: 'María Quispe',
    accion: 'DELETE_DOCUMENT',
    modulo: 'Documentos',
    descripcion: 'Eliminación de documento temporal',
    ip: '192.168.1.105',
    resultado: 'advertencia',
    detalles: 'Documento eliminado sin aprobación previa'
  },
  {
    id: '8',
    timestamp: '2024-01-25T13:55:11',
    usuario: 'Sistema',
    accion: 'SESSION_TIMEOUT',
    modulo: 'Seguridad',
    descripcion: 'Cierre de sesión por inactividad',
    ip: '192.168.1.108',
    resultado: 'exitoso'
  }
];

/**
 * Componente principal de monitoreo y auditoría de logs del sistema.
 * Permite filtrar, buscar, visualizar y explorar detalles de eventos.
 */
export function AuditLogs() {
  // Estado de logs y filtros
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('todos');
  const [resultFilter, setResultFilter] = useState('todos');
  const [dateFilter, setDateFilter] = useState('hoy');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);

  /**
   * Filtra los logs según búsqueda, módulo y resultado.
   */
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'todos' || log.modulo === moduleFilter;
    const matchesResult = resultFilter === 'todos' || log.resultado === resultFilter;
    return matchesSearch && matchesModule && matchesResult;
  });

  /**
   * Devuelve el ícono correspondiente al resultado del log.
   * @param resultado - Estado del log
   */
  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'exitoso':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fallido':
        return <XCircle className="h-4 w-4 text-[#C01702]" />;
      case 'advertencia':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Devuelve el badge visual para el resultado del log.
   * @param resultado - Estado del log
   */
  const getResultBadge = (resultado: string) => {
    const colors = {
      exitoso: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      fallido: 'bg-[#F6E7E4] text-[#C01702] dark:bg-[#2A1A18] dark:text-[#C01702]',
      advertencia: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    const labels = {
      exitoso: 'Exitoso',
      fallido: 'Fallido',
      advertencia: 'Advertencia'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[resultado as keyof typeof colors]}`}>
        {labels[resultado as keyof typeof labels]}
      </span>
    );
  };

  /**
   * (Placeholder) Exporta los logs a archivo. Implementar si es necesario.
   */
  const exportLogs = () => {
    // TODO: Implementar exportación real de logs si es necesario
  };

  /**
   * Abre el modal de detalles para un log específico.
   * @param log - Log seleccionado
   */
  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  return (
    <div className="space-y-10">
      {/* Header institucional */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
            Monitoreo <span className="text-[#C01702] font-bold">del Sistema</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-300">
            Registro detallado de actividades y eventos del sistema
          </p>
          <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Eventos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{logs.filter(l => l.resultado === 'exitoso').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Exitosos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-[#C01702]">{logs.filter(l => l.resultado === 'fallido').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Fallidos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{logs.filter(l => l.resultado === 'advertencia').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Advertencias</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
              >
                <option value="todos">Todos los módulos</option>
                <option value="Autenticación">Autenticación</option>
                <option value="Expedientes">Expedientes</option>
                <option value="Usuarios">Usuarios</option>
                <option value="Sistema">Sistema</option>
                <option value="Aprobaciones">Aprobaciones</option>
                <option value="Documentos">Documentos</option>
                <option value="Seguridad">Seguridad</option>
              </select>
            </div>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
            >
              <option value="todos">Todos los resultados</option>
              <option value="exitoso">Exitosos</option>
              <option value="fallido">Fallidos</option>
              <option value="advertencia">Advertencias</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C01702]/60 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(log.timestamp).toLocaleDateString('es-PE')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString('es-PE')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{log.usuario}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{log.accion}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {log.descripcion}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {log.modulo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getResultIcon(log.resultado)}
                      {getResultBadge(log.resultado)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openLogDetail(log)}
                      className="text-[#C01702] hover:text-[#a31200] focus:outline-none focus:ring-2 focus:ring-[#C01702] rounded transition"
                      title="Ver detalles"
                      aria-label={`Ver detalles del log ${log.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#C01702] rounded-2xl max-w-md w-full shadow-2xl p-0 relative">
            {/* Header institucional corporativo */}
            <div className="flex items-center justify-between bg-[#C01702] rounded-t-2xl px-8 py-5 w-full shadow-sm">
              <div className="flex items-center gap-4">
                <Shield className="h-10 w-10 text-white" />
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Detalles
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 text-3xl font-bold focus:outline-none transition"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-b-2xl px-8 py-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Fecha y Hora</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#C01702] opacity-70" />
                      <span className="text-lg text-black dark:text-white">{new Date(selectedLog.timestamp).toLocaleString('es-PE')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Usuario</label>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-[#C01702] opacity-70" />
                      <span className="text-lg text-black dark:text-white">{selectedLog.usuario}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Acción</label>
                    <span className="text-lg text-black dark:text-white">{selectedLog.accion}</span>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Módulo</label>
                    <span className="text-lg text-black dark:text-white">{selectedLog.modulo}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-base font-semibold text-black dark:text-white mb-2">Descripción</label>
                  <span className="text-lg text-black dark:text-white">{selectedLog.descripcion}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Dirección IP</label>
                    <span className="text-lg text-black dark:text-white">{selectedLog.ip}</span>
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Resultado</label>
                    <div className="flex items-center gap-2">
                      {getResultIcon(selectedLog.resultado)}
                      {getResultBadge(selectedLog.resultado)}
                    </div>
                  </div>
                </div>
                {selectedLog.detalles && (
                  <div>
                    <label className="block text-base font-semibold text-black dark:text-white mb-2">Detalles Adicionales</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-lg text-black dark:text-white">{selectedLog.detalles}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-7 py-3 bg-[#C01702] hover:bg-[#a31200] text-white rounded-xl font-bold shadow-lg text-lg transition focus:outline-none focus:ring-2 focus:ring-[#C01702] flex items-center gap-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}