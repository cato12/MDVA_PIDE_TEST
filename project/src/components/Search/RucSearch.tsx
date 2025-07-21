
/**
 * Componente de búsqueda de empresas por RUC o nombre.
 * Permite consultar datos simulados de SUNAT, mostrando resultados detallados y exportables.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Selector de tipo de búsqueda (RUC/nombre)
 * - Formulario de búsqueda
 * - Resultados en modal (portal)
 * - Detalle de empresa en modal (portal)
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module RucSearch
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Building, AlertCircle, RefreshCw, MapPin
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { consultarRUC } from '../../api/consumoApi';

/**
 * Estructura de datos de una empresa (simulada SUNAT)
 */
interface EmpresaData {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  estado: 'activo' | 'suspendido' | 'baja' | 'baja_definitiva' | string;
  condicion: 'habido' | 'no_habido' | string;
  tipoContribuyente: string;
  fechaInscripcion: string;
  fechaInicioActividades: string;
  actividadEconomica: string;
  sistemaEmision: string;
  sistemaContabilidad: string;
  direccion?: {
    // Puede venir como dirección completa o como objeto detallado
    direccionCompleta?: string;
    direccion?: string;
    ubigeo?: string;
    tipoZona?: string;
    nombreZona?: string;
    numero?: string;
    interior?: string;
    lote?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
  representanteLegal?: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombre: string;
  };
  actividadesEconomicas: Array<{
    codigo: string;
    descripcion: string;
    principal: boolean;
  }>;
  comprobantes: Array<{
    codigo: string;
    descripcion: string;
  }>;
  padrones: Array<{
    codigo: string;
    descripcion: string;
    desde: string;
    hasta?: string;
  }>;
}




/**
 * Componente principal de búsqueda por RUC/nombre.
 * Incluye lógica de validación, consulta simulada y modales de resultado.
 */
export function RucSearch() {
  // Estado del formulario y resultados
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [searchType, setSearchType] = useState<'ruc' | 'nombre'>('ruc');
  const { addToast } = useToast();



  // Versión anterior: permitía consultar aunque el campo esté vacío o no tenga 11 dígitos
  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setEmpresaData(null);
    try {
      const data = await consultarRUC(searchTerm);
      if (data && !data.error && (data.ruc || data.razonSocial)) {
        setEmpresaData({
          ...data,
          actividadesEconomicas: Array.isArray(data.actividadesEconomicas) ? data.actividadesEconomicas : [],
          comprobantes: Array.isArray(data.comprobantes) ? data.comprobantes : [],
          padrones: Array.isArray(data.padrones) ? data.padrones : [],
        });
        setShowResultsModal(true);
        addToast('Consulta realizada exitosamente', 'success');
      } else if (data && data.error) {
        setError(data.error);
      } else {
        setError('No se encontraron datos para el RUC consultado');
      }
    } catch (err) {
      setError('Error al realizar la consulta. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Selecciona una empresa de los resultados y muestra el detalle.
   */

  // Ya no se usa selección de empresa desde lista, solo un resultado




  /**
   * Devuelve un badge visual para el estado de la empresa
   */
  const getEstadoBadge = (estado: string) => {
    const styles = {
      'activo': 'bg-white border-2 border-green-600 text-green-800 shadow font-semibold',
      'suspendido': 'bg-white border-2 border-yellow-400 text-yellow-700 shadow font-semibold',
      'baja': 'bg-white border-2 border-red-600 text-red-700 shadow font-bold',
      'baja_definitiva': 'bg-white border-2 border-gray-400 text-gray-700 shadow font-semibold'
    };
    const labels = {
      'activo': 'Activo',
      'suspendido': 'Suspendido',
      'baja': 'Baja Temporal',
      'baja_definitiva': 'Baja Definitiva'
    };
    return (
      <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm tracking-tight ${styles[estado as keyof typeof styles]}`}>{labels[estado as keyof typeof labels]}</span>
    );
  };


  /**
   * Devuelve un badge visual para la condición de la empresa
   */
  const getCondicionBadge = (condicion: string) => {
    const styles = {
      'habido': 'bg-white border-2 border-green-600 text-green-800 shadow font-semibold',
      'no_habido': 'bg-white border-2 border-red-600 text-red-700 shadow font-bold'
    };
    const labels = {
      'habido': 'Habido',
      'no_habido': 'No Habido'
    };
    return (
      <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm tracking-tight ${styles[condicion as keyof typeof styles]}`}>{labels[condicion as keyof typeof labels]}</span>
    );
  };

  return (
    <>
      {/*
        Formulario de búsqueda principal
        - Selector de tipo (RUC/nombre)
        - Input y botón de consulta
        - Ejemplos y advertencia de privacidad
      */}
      <div className="min-h-[80vh] py-12 flex flex-col justify-center items-center space-y-8 font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
        <div className="relative bg-gradient-to-br from-[#fff7f6] via-white to-[#f9f9f9] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl p-0 shadow-xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto overflow-hidden">
          {/* Encabezado destacado */}
          <div className="bg-[#C01702] bg-opacity-95 px-10 py-7 rounded-t-2xl flex flex-col items-center border-b-4 border-gray-200 dark:border-gray-700 shadow-md font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Búsqueda de Empresas</span>
            </div>
            <p className="text-white text-sm opacity-90 font-medium mt-1 font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              Consulte información de empresas registradas en SUNAT por RUC o nombre
            </p>
          </div>
          <div className="px-10 py-8 space-y-8 font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
            {/* Selector de tipo de búsqueda como tarjetas grandes y centradas */}
            <div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex gap-10 justify-center font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
                  {/* Tarjeta RUC */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType('ruc');
                      setSearchTerm('');
                      setError('');
                    }}
                    className={`flex flex-col items-center justify-center px-12 py-8 rounded-2xl border-2 shadow-md transition-all duration-150 cursor-pointer w-56 h-40 text-xl font-semibold tracking-tight
                      ${searchType === 'ruc'
                        ? 'border-gray-300 bg-[#C017020e] text-[#C01702] shadow-lg scale-105 ring-2 ring-[#C01702]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-[#C0170204]'}
                    `}
                    tabIndex={0}
                    aria-pressed={searchType === 'ruc'}
                  >
                    <Building className={`h-12 w-12 mb-3 ${searchType === 'ruc' ? 'text-[#C01702]' : 'text-gray-400'}`} />
                    <span className="font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Por RUC</span>
                  </button>
                  {/* Tarjeta Nombre (habilitada, pero solo visual) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType('nombre');
                      setSearchTerm('');
                      setError('');
                    }}
                    className={`flex flex-col items-center justify-center px-12 py-8 rounded-2xl border-2 shadow-md transition-all duration-150 cursor-pointer w-56 h-40 text-xl font-semibold tracking-tight
                      ${searchType === 'nombre'
                        ? 'border-gray-300 bg-[#C017020e] text-[#C01702] shadow-lg scale-105 ring-2 ring-[#C01702]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-[#C0170204]'}
                    `}
                    tabIndex={0}
                    aria-pressed={searchType === 'nombre'}
                  >
                    <Search className={`h-12 w-12 mb-3 ${searchType === 'nombre' ? 'text-[#C01702]' : 'text-gray-400'}`} />
                    <span className="font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Por Nombre</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-center font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <div className="flex-1 flex flex-col">
                <label className="block text-base font-semibold text-[#fffff] mb-2 tracking-tight font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
                  {searchType === 'ruc' ? 'Número de RUC' : 'Nombre de la Empresa'}
                </label>
                <div className="relative">
                  {searchType === 'ruc' ? (
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  )}
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      if (searchType === 'ruc') {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setSearchTerm(value);
                      } else {
                        setSearchTerm(e.target.value);
                      }
                      setError('');
                    }}
                    placeholder={searchType === 'ruc' ? 'Ingrese RUC de 11 dígitos' : 'Ingrese nombre de la empresa'}
                    className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium shadow-md placeholder-gray-400" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}
                    maxLength={searchType === 'ruc' ? 11 : 100}
                    disabled={searchType !== 'ruc'}
                  />
                </div>
                <div className="min-h-[28px] flex items-center">
                  {error && (
                    <div className="flex items-center gap-2 text-[#C01702]">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-base font-medium">{error}</span>
                    </div>
                  )}
                  {searchType === 'nombre' && !error && (
                    <span className="text-xs text-[#C01702]">Actualmente solo está disponible la búsqueda real por RUC.</span>
                  )}
                </div>
              </div>
              <div className="flex items-center h-full">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || searchType !== 'ruc'}
                  className="bg-[#C01702] hover:bg-[#a01301] disabled:bg-gray-400 text-white px-8 py-3 rounded-xl flex items-center gap-3 text-lg font-semibold shadow-md transition-colors min-w-[150px] h-[52px]"
                  style={{ height: '52px' }}
                >
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  {isLoading ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </div>
          </div>
          {/* Límite de uso banner minimalista, gris, sin fondo ni borde, con mayor separación */}
          <div className="my-10 flex justify-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              LÍMITE DE USO: 3 CONSULTAS POR SEMANA.
            </div>
          </div>
        </div>
      </div>
      {/* Portales fuera del div principal */}
      {/* Mostrar resumen general tras la consulta, y detalle solo al seleccionar */}
      {empresaData && typeof window !== 'undefined' && !showResultsModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-200"
            style={{ zIndex: 9999 }}
            onClick={() => setEmpresaData(null)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[80vh] overflow-y-auto" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none"
                onClick={() => setEmpresaData(null)}
                aria-label="Cerrar resultados"
                tabIndex={0}
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-[#C01702] mb-6 flex items-center gap-2">
                <Building className="h-6 w-6 text-[#C01702]" />
                Resultado de Búsqueda
              </h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow flex flex-col md:flex-row items-center md:items-stretch gap-4 p-4 md:p-5 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="h-5 w-5 text-[#C01702]" />
                      <span className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate">{empresaData.razonSocial}</span>
                    </div>
                    {empresaData.nombreComercial && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">Nombre Comercial: {empresaData.nombreComercial}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono">RUC: {empresaData.ruc}</span>
                      {getEstadoBadge(empresaData.estado)}
                      {getCondicionBadge(empresaData.condicion)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setShowResultsModal(true)}
                      className="bg-[#C01702] hover:bg-[#a01301] text-white px-4 py-1.5 rounded-lg font-semibold shadow-md transition-colors text-xs flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Exportar PDF
                    </button>
                    <span className="text-xs text-[#C01702] font-semibold cursor-pointer hover:underline mt-1" onClick={() => setShowResultsModal(true)}>
                      Ver Detalle &rarr;
                    </span>
                  </div>
                </div>
              </div>
              {/* Advertencia de uso responsable */}
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Uso Responsable de Datos Empresariales
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Esta información es confidencial y debe ser utilizada únicamente para fines administrativos oficiales. 
                      El uso indebido de estos datos está penado por la ley.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal de detalle completo al seleccionar */}
      {empresaData && typeof window !== 'undefined' && showResultsModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-200"
            style={{ zIndex: 9999 }}
            onClick={() => {
              setShowResultsModal(false);
              setEmpresaData(null);
            }}
          />
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none"
                onClick={() => {
                  setShowResultsModal(false);
                  setEmpresaData(null);
                }}
                aria-label="Cerrar detalle"
                tabIndex={0}
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-[#C01702] mb-6 flex items-center gap-2">
                <Building className="h-7 w-7 text-[#C01702]" />
                Detalle de Empresa
              </h2>
              {/* ...el resto del contenido del detalle ya está implementado abajo... */}
              {/* Copiado de la sección de detalle actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                {/* Bloque: Datos Generales y Dirección en tabla */}
                <div className="col-span-2 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-[#C01702] flex items-center gap-2 mb-4"><Building className="h-5 w-5" /> Datos Generales</h3>
                    <table className="w-full text-sm mb-2">
                      <tbody>
                        {empresaData.razonSocial && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300 w-40">Razón Social</td>
                            <td className="text-gray-900 dark:text-white">{empresaData.razonSocial}</td>
                          </tr>
                        )}
                        {empresaData.nombreComercial && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Nombre Comercial</td>
                            <td className="text-gray-700 dark:text-gray-300">{empresaData.nombreComercial}</td>
                          </tr>
                        )}
                        {empresaData.ruc && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">RUC</td>
                            <td className="font-mono text-gray-800 dark:text-white">{empresaData.ruc}</td>
                          </tr>
                        )}
                        {empresaData.estado && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Estado</td>
                            <td>{empresaData.estado}</td>
                          </tr>
                        )}
                        {empresaData.condicion && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Condición</td>
                            <td>{empresaData.condicion}</td>
                          </tr>
                        )}
                        {empresaData.tipoContribuyente && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Tipo Contribuyente</td>
                            <td>{empresaData.tipoContribuyente}</td>
                          </tr>
                        )}
                        {empresaData.actividadEconomica && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Actividad Económica</td>
                            <td>{empresaData.actividadEconomica}</td>
                          </tr>
                        )}
                        {empresaData.fechaInscripcion && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Fecha Inscripción</td>
                            <td>{empresaData.fechaInscripcion}</td>
                          </tr>
                        )}
                        {empresaData.fechaInicioActividades && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Inicio Actividades</td>
                            <td>{empresaData.fechaInicioActividades}</td>
                          </tr>
                        )}
                        {empresaData.sistemaEmision && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Sistema Emisión</td>
                            <td>{empresaData.sistemaEmision}</td>
                          </tr>
                        )}
                        {empresaData.sistemaContabilidad && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Sistema Contabilidad</td>
                            <td>{empresaData.sistemaContabilidad}</td>
                          </tr>
                        )}
                        {empresaData.representanteLegal && empresaData.representanteLegal.nombre && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Representante Legal</td>
                            <td>{empresaData.representanteLegal.nombre} ({empresaData.representanteLegal.tipoDocumento} {empresaData.representanteLegal.numeroDocumento})</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <h4 className="text-base font-bold text-[#C01702] flex items-center gap-2 mt-6 mb-2"><MapPin className="h-4 w-4" /> Dirección</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        {empresaData.direccion && (empresaData.direccion.direccionCompleta || empresaData.direccion.direccion) && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300 w-40">Dirección</td>
                            <td>{empresaData.direccion.direccionCompleta || empresaData.direccion.direccion}</td>
                          </tr>
                        )}
                        {empresaData.direccion && empresaData.direccion.departamento && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Departamento</td>
                            <td>{empresaData.direccion.departamento}</td>
                          </tr>
                        )}
                        {empresaData.direccion && empresaData.direccion.provincia && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Provincia</td>
                            <td>{empresaData.direccion.provincia}</td>
                          </tr>
                        )}
                        {empresaData.direccion && empresaData.direccion.distrito && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Distrito</td>
                            <td>{empresaData.direccion.distrito}</td>
                          </tr>
                        )}
                        {empresaData.direccion && empresaData.direccion.ubigeo && (
                          <tr>
                            <td className="font-semibold text-gray-600 dark:text-gray-300">Ubigeo</td>
                            <td>{empresaData.direccion.ubigeo}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Bloque: Actividades Económicas */}
                {empresaData.actividadesEconomicas && empresaData.actividadesEconomicas.length > 0 && (
                  <div className="col-span-2 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-4"><Search className="h-5 w-5" /> Actividades Económicas</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        {empresaData.actividadesEconomicas.map((act) => (
                          <li key={act.codigo} className={act.principal ? 'font-semibold text-blue-800 dark:text-blue-200' : ''}>
                            {act.descripcion} {act.principal && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-xs text-blue-800 dark:text-blue-100">Principal</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {/* Bloque: Comprobantes Autorizados */}
                {empresaData.comprobantes && empresaData.comprobantes.length > 0 && (
                  <div className="col-span-2 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-bold text-green-700 dark:text-green-300 flex items-center gap-2 mb-4"><AlertCircle className="h-5 w-5" /> Comprobantes Autorizados</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        {empresaData.comprobantes.map((comp) => (
                          <li key={comp.codigo}>{comp.descripcion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {/* Bloque: Padrones */}
                {empresaData.padrones && empresaData.padrones.length > 0 && (
                  <div className="col-span-2 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-4"><Building className="h-5 w-5" /> Padrones</h3>
                      <ul className="list-disc pl-6 space-y-1">
                        {empresaData.padrones.map((padron) => (
                          <li key={padron.codigo}>
                            {padron.descripcion} <span className="text-xs text-gray-500">(Desde: {padron.desde}{padron.hasta ? `, Hasta: ${padron.hasta}` : ''})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              {/* ...bloques visuales ya mejorados arriba... */}
              {/* Advertencia de uso responsable */}
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mt-6 mb-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Uso Responsable de Datos Empresariales
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Esta información es confidencial y debe ser utilizada únicamente para fines administrativos oficiales. 
                      El uso indebido de estos datos está penado por la ley.
                    </p>
                  </div>
                </div>
              </div>
              {/* <div className="flex justify-end gap-4 mt-4">
                <button
                  className="bg-[#C01702] hover:bg-[#a01301] text-white px-6 py-2 rounded-lg font-semibold shadow"
                  onClick={async () => {
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
                    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioSesion') || '{}');
                    const fechaHora = new Date().toLocaleString('es-PE');
                    const img = new window.Image();
                    img.src = '/imagenes/logo_mdva_rojo.png';
                    img.onload = () => {
                      doc.addImage(img, 'PNG', 30, 24, 60, 60);
                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(22);
                      doc.setTextColor(192, 23, 2);
                      doc.text('Detalle de Empresa', 110, 50);
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(12);
                      doc.setTextColor(80, 80, 80);
                      let generadoPor = '';
                      if (usuarioSesion && (usuarioSesion.nombres || usuarioSesion.apellidos || usuarioSesion.username || usuarioSesion.email)) {
                        const nombre = [usuarioSesion.nombres, usuarioSesion.apellidos].filter(Boolean).join(' ').trim();
                        let userOrMail = '';
                        if (usuarioSesion.username && usuarioSesion.username !== 'undefined') {
                          userOrMail = `(${usuarioSesion.username})`;
                        } else if (usuarioSesion.email && usuarioSesion.email !== 'undefined') {
                          userOrMail = `(${usuarioSesion.email})`;
                        }
                        generadoPor = `Generado por: ${[nombre, userOrMail].filter(Boolean).join(' ').trim()}`;
                      } else {
                        generadoPor = 'Generado por: -';
                      }
                      doc.text(generadoPor, 110, 70);
                      doc.setFontSize(11);
                      doc.setTextColor(120, 120, 120);
                      doc.text(`Fecha y hora: ${fechaHora}`, 110, 90);

                      // Tabla de datos generales
                      const datosGenerales = [
                        ['RUC', empresaData.ruc],
                        empresaData.razonSocial ? ['Razón Social', empresaData.razonSocial] : null,
                        empresaData.nombreComercial ? ['Nombre Comercial', empresaData.nombreComercial] : null,
                        empresaData.estado ? ['Estado', empresaData.estado] : null,
                        empresaData.condicion ? ['Condición', empresaData.condicion] : null,
                        empresaData.tipoContribuyente ? ['Tipo Contribuyente', empresaData.tipoContribuyente] : null,
                        empresaData.actividadEconomica ? ['Actividad Económica', empresaData.actividadEconomica] : null,
                        empresaData.fechaInscripcion ? ['Fecha Inscripción', empresaData.fechaInscripcion] : null,
                        empresaData.fechaInicioActividades ? ['Inicio Actividades', empresaData.fechaInicioActividades] : null,
                        empresaData.sistemaEmision ? ['Sistema Emisión', empresaData.sistemaEmision] : null,
                        empresaData.sistemaContabilidad ? ['Sistema Contabilidad', empresaData.sistemaContabilidad] : null,
                        empresaData.representanteLegal && empresaData.representanteLegal.nombre ? ['Representante Legal', `${empresaData.representanteLegal.nombre} (${empresaData.representanteLegal.tipoDocumento} ${empresaData.representanteLegal.numeroDocumento})`] : null,
                      ].filter((row): row is string[] => Array.isArray(row));
                      autoTable(doc, {
                        startY: 110,
                        margin: { left: 30, right: 30 },
                        head: [['Campo', 'Valor']],
                        body: datosGenerales,
                        theme: 'grid',
                        headStyles: { fillColor: [192, 23, 2], halign: 'center', fontSize: 11 },
                        styles: { fontSize: 10, cellPadding: 4 },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 350 } },
                        tableWidth: 'wrap',
                      });
                      let lastY = (doc as any).lastAutoTable?.finalY || 180;

                      // Tabla de dirección
                      if (empresaData.direccion && (empresaData.direccion.direccionCompleta || empresaData.direccion.direccion)) {
                        const direccion = [
                          ['Dirección', empresaData.direccion.direccionCompleta || empresaData.direccion.direccion],
                          empresaData.direccion.departamento ? ['Departamento', empresaData.direccion.departamento] : null,
                          empresaData.direccion.provincia ? ['Provincia', empresaData.direccion.provincia] : null,
                          empresaData.direccion.distrito ? ['Distrito', empresaData.direccion.distrito] : null,
                          empresaData.direccion.ubigeo ? ['Ubigeo', empresaData.direccion.ubigeo] : null,
                        ].filter((row): row is string[] => Array.isArray(row));
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Dirección', 'Valor']],
                          body: direccion,
                          theme: 'grid',
                          headStyles: { fillColor: [192, 23, 2], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 350 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Actividades económicas
                      if (empresaData.actividadesEconomicas && empresaData.actividadesEconomicas.length > 0) {
                        const actividades = empresaData.actividadesEconomicas.map(act => [act.descripcion, act.principal ? 'Principal' : 'Secundaria']);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Actividad', 'Tipo']],
                          body: actividades,
                          theme: 'grid',
                          headStyles: { fillColor: [23, 100, 192], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: 100 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Comprobantes autorizados
                      if (empresaData.comprobantes && empresaData.comprobantes.length > 0) {
                        const comprobantes = empresaData.comprobantes.map(c => [c.descripcion]);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Comprobantes Autorizados']],
                          body: comprobantes,
                          theme: 'grid',
                          headStyles: { fillColor: [23, 192, 80], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 400 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Padrones
                      if (empresaData.padrones && empresaData.padrones.length > 0) {
                        const padrones = empresaData.padrones.map(p => [p.descripcion, p.desde, p.hasta || '-']);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Padrón', 'Desde', 'Hasta']],
                          body: padrones,
                          theme: 'grid',
                          headStyles: { fillColor: [192, 100, 23], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 250 }, 1: { cellWidth: 80 }, 2: { cellWidth: 80 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Pie de página y paginación
                      const pageCount = doc.getNumberOfPages();
                      const pageWidth = doc.internal.pageSize.getWidth();
                      const pageHeight = doc.internal.pageSize.getHeight();
                      for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(9);
                        doc.setTextColor(150);
                        doc.text('Municipalidad Distrital De Vista Alegre - Sistema MDVA', pageWidth / 2, pageHeight - 20, { align: 'center' });
                        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
                      }
                      doc.save(`empresa_${empresaData.ruc}.pdf`);
                    };
                  }}
                >
                  Exportar PDF
                </button> */}
      <div className="flex justify-end gap-4 mt-4">
                {/* MODIFICACION 18/07/2025 | AUDITORIA EXPORTACION PDF RUC | INICIO */}
                <button
                  className="bg-[#C01702] hover:bg-[#a01301] text-white px-6 py-2 rounded-lg font-semibold shadow"
                  onClick={async () => {
                    if (!empresaData) return;
                    try {
                      // Validar RUC antes de exportar
                      if (!empresaData.ruc || typeof empresaData.ruc !== 'string' || !/^\d{11}$/.test(empresaData.ruc)) {
                        addToast('RUC inválido. No se puede exportar.', 'error');
                        return;
                      }
                      // Llamar al endpoint solo para registrar en auditoría
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
                      const userId = localStorage.getItem('mdva_user_id');
                      const userEmail = (() => {
                      try {
                        const userObj = JSON.parse(localStorage.getItem('municipal_user') || '{}');
                        return userObj.email || '';
                      } catch { return ''; }
                      })();
                      const auditRes = await fetch(`${API_URL}/api/ruc/${empresaData.ruc}/exportar`, {
                        method: 'POST',
                        headers: {
                          'x-user-id': userId || '',
                          'x-user-email': userEmail || '',
                          'Content-Type': 'application/json'
                        }
                      });
                      if (!auditRes.ok) {
                        addToast('No se pudo registrar la auditoría de exportación.', 'error');
                        return;
                      }
                      // Generar el PDF usando los datos actuales de empresaData
                      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'A4' });
                      const usuarioSesion = JSON.parse(localStorage.getItem('usuarioSesion') || '{}');
                      const fechaHora = new Date().toLocaleString('es-PE');
                      const img = new window.Image();
                      img.src = '/imagenes/logo_mdva_rojo.png';
                      img.onload = () => {
                      doc.addImage(img, 'PNG', 30, 24, 60, 60);
                      doc.setFont('helvetica', 'bold');
                      doc.setFontSize(22);
                      doc.setTextColor(192, 23, 2);
                      doc.text('Detalle de Empresa', 110, 50);
                      doc.setFont('helvetica', 'normal');
                      doc.setFontSize(12);
                      doc.setTextColor(80, 80, 80);
                      let generadoPor = '';
                      if (usuarioSesion && (usuarioSesion.nombres || usuarioSesion.apellidos || usuarioSesion.username || usuarioSesion.email)) {
                        const nombre = [usuarioSesion.nombres, usuarioSesion.apellidos].filter(Boolean).join(' ').trim();
                        let userOrMail = '';
                        if (usuarioSesion.username && usuarioSesion.username !== 'undefined') {
                          userOrMail = `(${usuarioSesion.username})`;
                        } else if (usuarioSesion.email && usuarioSesion.email !== 'undefined') {
                          userOrMail = `(${usuarioSesion.email})`;
                        }
                        generadoPor = `Generado por: ${[nombre, userOrMail].filter(Boolean).join(' ').trim()}`;
                      } else {
                        // Si no hay datos en localStorage, consultar al backend por el id
                        const userId = localStorage.getItem('mdva_user_id');
                        generadoPor = 'Generado por: -';
                        if (userId) {
                          const xhr = new XMLHttpRequest();
                          xhr.open('GET', `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users/${userId}`, false); // false = síncrono
                          xhr.send(null);
                          if (xhr.status === 200) {
                            try {
                              const user = JSON.parse(xhr.responseText);
                              if (user.nombres || user.apellidos || user.email) {
                                const nombre = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
                                let userOrMail = user.email ? `(${user.email})` : '';
                                generadoPor = `Generado por: ${[nombre, userOrMail].filter(Boolean).join(' ').trim()}`;
                              }
                            } catch {}
                          }
                        }
                      }
                      doc.text(generadoPor, 110, 70);
                      doc.setFontSize(11);
                      doc.setTextColor(120, 120, 120);
                      doc.text(`Fecha y hora: ${fechaHora}`, 110, 90);

                      // Tabla de datos generales
                      const datosGenerales = [
                        ['RUC', empresaData.ruc],
                        empresaData.razonSocial ? ['Razón Social', empresaData.razonSocial] : null,
                        empresaData.nombreComercial ? ['Nombre Comercial', empresaData.nombreComercial] : null,
                        empresaData.estado ? ['Estado', empresaData.estado] : null,
                        empresaData.condicion ? ['Condición', empresaData.condicion] : null,
                        empresaData.tipoContribuyente ? ['Tipo Contribuyente', empresaData.tipoContribuyente] : null,
                        empresaData.actividadEconomica ? ['Actividad Económica', empresaData.actividadEconomica] : null,
                        empresaData.fechaInscripcion ? ['Fecha Inscripción', empresaData.fechaInscripcion] : null,
                        empresaData.fechaInicioActividades ? ['Inicio Actividades', empresaData.fechaInicioActividades] : null,
                        empresaData.sistemaEmision ? ['Sistema Emisión', empresaData.sistemaEmision] : null,
                        empresaData.sistemaContabilidad ? ['Sistema Contabilidad', empresaData.sistemaContabilidad] : null,
                        empresaData.representanteLegal && empresaData.representanteLegal.nombre ? ['Representante Legal', `${empresaData.representanteLegal.nombre} (${empresaData.representanteLegal.tipoDocumento} ${empresaData.representanteLegal.numeroDocumento})`] : null,
                      ].filter((row): row is string[] => Array.isArray(row));
                      autoTable(doc, {
                        startY: 110,
                        margin: { left: 30, right: 30 },
                        head: [['Campo', 'Valor']],
                        body: datosGenerales,
                        theme: 'grid',
                        headStyles: { fillColor: [192, 23, 2], halign: 'center', fontSize: 11 },
                        styles: { fontSize: 10, cellPadding: 4 },
                        alternateRowStyles: { fillColor: [245, 245, 245] },
                        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 350 } },
                        tableWidth: 'wrap',
                      });
                      let lastY = (doc as any).lastAutoTable?.finalY || 180;

                      // Tabla de dirección
                      if (empresaData.direccion && (empresaData.direccion.direccionCompleta || empresaData.direccion.direccion)) {
                        const direccion = [
                          ['Dirección', empresaData.direccion.direccionCompleta || empresaData.direccion.direccion],
                          empresaData.direccion.departamento ? ['Departamento', empresaData.direccion.departamento] : null,
                          empresaData.direccion.provincia ? ['Provincia', empresaData.direccion.provincia] : null,
                          empresaData.direccion.distrito ? ['Distrito', empresaData.direccion.distrito] : null,
                          empresaData.direccion.ubigeo ? ['Ubigeo', empresaData.direccion.ubigeo] : null,
                        ].filter((row): row is string[] => Array.isArray(row));
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Dirección', 'Valor']],
                          body: direccion,
                          theme: 'grid',
                          headStyles: { fillColor: [192, 23, 2], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 350 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Actividades económicas
                      if (empresaData.actividadesEconomicas && empresaData.actividadesEconomicas.length > 0) {
                        const actividades = empresaData.actividadesEconomicas.map(act => [act.descripcion, act.principal ? 'Principal' : 'Secundaria']);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Actividad', 'Tipo']],
                          body: actividades,
                          theme: 'grid',
                          headStyles: { fillColor: [23, 100, 192], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: 100 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Comprobantes autorizados
                      if (empresaData.comprobantes && empresaData.comprobantes.length > 0) {
                        const comprobantes = empresaData.comprobantes.map(c => [c.descripcion]);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Comprobantes Autorizados']],
                          body: comprobantes,
                          theme: 'grid',
                          headStyles: { fillColor: [23, 192, 80], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 400 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Padrones
                      if (empresaData.padrones && empresaData.padrones.length > 0) {
                        const padrones = empresaData.padrones.map(p => [p.descripcion, p.desde, p.hasta || '-']);
                        autoTable(doc, {
                          startY: lastY + 16,
                          margin: { left: 30, right: 30 },
                          head: [['Padrón', 'Desde', 'Hasta']],
                          body: padrones,
                          theme: 'grid',
                          headStyles: { fillColor: [192, 100, 23], halign: 'center', fontSize: 11 },
                          styles: { fontSize: 10, cellPadding: 4 },
                          alternateRowStyles: { fillColor: [245, 245, 245] },
                          columnStyles: { 0: { cellWidth: 250 }, 1: { cellWidth: 80 }, 2: { cellWidth: 80 } },
                          tableWidth: 'wrap',
                        });
                        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
                      }

                      // Pie de página y paginación
                      const pageCount = doc.getNumberOfPages();
                      const pageWidth = doc.internal.pageSize.getWidth();
                      const pageHeight = doc.internal.pageSize.getHeight();
                      for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(9);
                        doc.setTextColor(150);
                        doc.text('Municipalidad Distrital De Vista Alegre - Sistema MDVA', pageWidth / 2, pageHeight - 20, { align: 'center' });
                        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
                      }
                      doc.save(`empresa_${empresaData.ruc}.pdf`);
                    };
                    img.onerror = () => {
                      // Si falla la carga del logo, igual generar el PDF sin logo
                      // (copiar la lógica de renderPDF si se usa en otro lado)
                      // Aquí se puede llamar directamente a la función de renderizado si existe
                    };
                    setTimeout(() => {
                      if (!img.complete) {
                        // Fallback si la imagen no carga en 2s
                        // (copiar la lógica de renderPDF si se usa en otro lado)
                      }
                    }, 2000);
                    } catch (err) {
                      addToast('Error al exportar PDF. Intente nuevamente.', 'error');
                    }
                  }}
                >
                  Exportar PDF
                </button>
                {/* MODIFICACION 18/07/2025 | AUDITORIA EXPORTACION PDF RUC | FIN */}          
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal duplicado eliminado, solo queda el modal principal y el de detalle con PDF export. */}
    </>
  );
}