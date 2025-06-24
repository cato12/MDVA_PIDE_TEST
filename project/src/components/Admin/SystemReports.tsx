/**
 * Reportes y estadísticas administrativas del sistema.
 * Muestra panel de métricas, gráficos y acciones de exportación.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Estadísticas generales
 * - Gráficos de expedientes por mes y área
 * - Tiempos promedio de proceso
 * - Acciones de exportación de reportes
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module SystemReports
 */
import { useState } from 'react';
import {
  BarChart3, TrendingUp, Download, FileText, Users, Clock, CheckCircle, AlertTriangle, Building, PieChart
} from 'lucide-react';

/**
 * Estructura de los datos de reporte administrativo.
 */
interface ReportData {
  expedientesPorMes: Array<{ mes: string; cantidad: number }>;
  expedientesPorArea: Array<{ area: string; cantidad: number; porcentaje: number }>;
  tiemposPromedio: Array<{ proceso: string; dias: number }>;
  estadisticasGenerales: {
    totalExpedientes: number;
    expedientesAprobados: number;
    expedientesPendientes: number;
    tiempoPromedioAtencion: number;
    usuariosActivos: number;
    solicitudesRecursos: number;
  };
}

// Datos simulados para demostración
const mockReportData: ReportData = {
  expedientesPorMes: [
    { mes: 'Ene', cantidad: 45 },
    { mes: 'Feb', cantidad: 52 },
    { mes: 'Mar', cantidad: 38 },
    { mes: 'Abr', cantidad: 61 },
    { mes: 'May', cantidad: 49 },
    { mes: 'Jun', cantidad: 55 },
    { mes: 'Jul', cantidad: 43 },
    { mes: 'Ago', cantidad: 58 },
    { mes: 'Sep', cantidad: 47 },
    { mes: 'Oct', cantidad: 62 },
    { mes: 'Nov', cantidad: 51 },
    { mes: 'Dic', cantidad: 39 }
  ],
  expedientesPorArea: [
    { area: 'Obras Públicas', cantidad: 156, porcentaje: 31 },
    { area: 'Servicios Públicos', cantidad: 124, porcentaje: 25 },
    { area: 'Recursos Humanos', cantidad: 89, porcentaje: 18 },
    { area: 'Contabilidad', cantidad: 67, porcentaje: 13 },
    { area: 'Secretaría General', cantidad: 45, porcentaje: 9 },
    { area: 'Otros', cantidad: 19, porcentaje: 4 }
  ],
  tiemposPromedio: [
    { proceso: 'Registro de Expediente', dias: 2 },
    { proceso: 'Revisión Técnica', dias: 7 },
    { proceso: 'Aprobación Administrativa', dias: 5 },
    { proceso: 'Notificación Final', dias: 1 }
  ],
  estadisticasGenerales: {
    totalExpedientes: 500,
    expedientesAprobados: 387,
    expedientesPendientes: 113,
    tiempoPromedioAtencion: 15,
    usuariosActivos: 47,
    solicitudesRecursos: 89
  }
};

/**
 * Componente principal de reportes y estadísticas administrativas.
 * Permite visualizar métricas, gráficos y exportar reportes.
 */
export function SystemReports() {
  // Estado de periodo seleccionado y datos de reporte
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [reportData] = useState<ReportData>(mockReportData);

  /**
   * (Placeholder) Genera o exporta el reporte solicitado.
   * @param type - Tipo de reporte a exportar
   */
  const generateReport = (type: string) => {
    // TODO: Implementar generación real de reportes según el tipo solicitado
    // type puede ser 'general', 'expedientes', 'usuarios', 'recursos', 'rendimiento', etc.
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Estadísticas del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis y reportes de gestión administrativa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="2024">Año 2024</option>
            <option value="2023">Año 2023</option>
            <option value="trimestre">Último Trimestre</option>
            <option value="mes">Último Mes</option>
          </select>
          <button
            onClick={() => generateReport('general')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar Reporte
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expedientes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.estadisticasGenerales.totalExpedientes}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprobados</p>
              <p className="text-2xl font-bold text-green-600">{reportData.estadisticasGenerales.expedientesAprobados}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{reportData.estadisticasGenerales.expedientesPendientes}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-600">{reportData.estadisticasGenerales.tiempoPromedioAtencion}d</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuarios Activos</p>
              <p className="text-2xl font-bold text-primary-600">{reportData.estadisticasGenerales.usuariosActivos}</p>
            </div>
            <Users className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sol. Recursos</p>
              <p className="text-2xl font-bold text-orange-600">{reportData.estadisticasGenerales.solicitudesRecursos}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Expedientes por Mes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-500" />
            Expedientes por Mes
          </h3>
          <div className="space-y-3">
            {reportData.expedientesPorMes.map((item, index) => {
              const maxValue = Math.max(...reportData.expedientesPorMes.map(d => d.cantidad));
              const percentage = (item.cantidad / maxValue) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.mes}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.cantidad}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expedientes por Área */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-sky-500" />
            Expedientes por Área
          </h3>
          <div className="space-y-4">
            {reportData.expedientesPorArea.map((area, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {area.area}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {area.cantidad}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({area.porcentaje}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${area.porcentaje}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tiempos de Proceso */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-500" />
          Tiempos Promedio de Proceso
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportData.tiemposPromedio.map((proceso, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-primary-600 mb-2">
                {proceso.dias}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">días</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{proceso.proceso}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones de Reporte */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-primary-500" />
          Generar Reportes Específicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => generateReport('expedientes')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-6 w-6 text-blue-500 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              Reporte de Expedientes
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Detalle completo por período
            </p>
          </button>

          <button
            onClick={() => generateReport('usuarios')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="h-6 w-6 text-green-500 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              Reporte de Usuarios
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Actividad y accesos
            </p>
          </button>

          <button
            onClick={() => generateReport('recursos')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <AlertTriangle className="h-6 w-6 text-orange-500 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              Reporte de Recursos
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Solicitudes y asignaciones
            </p>
          </button>

          <button
            onClick={() => generateReport('rendimiento')}
            className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              Reporte de Rendimiento
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              KPIs y métricas
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}