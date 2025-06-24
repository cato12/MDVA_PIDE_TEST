
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
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Building, AlertCircle, RefreshCw, User
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

/**
 * Estructura de datos de una empresa (simulada SUNAT)
 */
interface EmpresaData {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  estado: 'activo' | 'suspendido' | 'baja' | 'baja_definitiva';
  condicion: 'habido' | 'no_habido';
  tipoContribuyente: string;
  fechaInscripcion: string;
  fechaInicioActividades: string;
  actividadEconomica: string;
  sistemaEmision: string;
  sistemaContabilidad: string;
  direccion: {
    ubigeo: string;
    tipoZona: string;
    nombreZona: string;
    numero: string;
    interior?: string;
    lote?: string;
    departamento: string;
    provincia: string;
    distrito: string;
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
 * Datos simulados de empresas (mock SUNAT)
 */
const mockEmpresasData: EmpresaData[] = [
  {
    ruc: '20123456789',
    razonSocial: 'CONSTRUCTORA MUNICIPAL SAC',
    nombreComercial: 'CONSTRUCTORA MUNICIPAL',
    estado: 'activo',
    condicion: 'habido',
    tipoContribuyente: 'SOCIEDAD ANONIMA CERRADA',
    fechaInscripcion: '2020-03-15',
    fechaInicioActividades: '2020-04-01',
    actividadEconomica: 'CONSTRUCCION DE EDIFICIOS COMPLETOS',
    sistemaEmision: 'COMPUTARIZADO',
    sistemaContabilidad: 'COMPUTARIZADO',
    direccion: {
      ubigeo: '150101',
      tipoZona: 'AVENIDA',
      nombreZona: 'LIMA',
      numero: '1234',
      interior: '201',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'LIMA'
    },
    representanteLegal: {
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678',
      nombre: 'JUAN CARLOS PEREZ GARCIA'
    },
    actividadesEconomicas: [
      {
        codigo: '4100',
        descripcion: 'CONSTRUCCION DE EDIFICIOS COMPLETOS',
        principal: true
      },
      {
        codigo: '4290',
        descripcion: 'CONSTRUCCION DE OTRAS OBRAS DE INGENIERIA CIVIL',
        principal: false
      }
    ],
    comprobantes: [
      { codigo: '01', descripcion: 'FACTURA' },
      { codigo: '03', descripcion: 'BOLETA DE VENTA' },
      { codigo: '07', descripcion: 'NOTA DE CREDITO' },
      { codigo: '08', descripcion: 'NOTA DE DEBITO' }
    ],
    padrones: [
      {
        codigo: 'AGRET',
        descripcion: 'AGENTE DE RETENCION',
        desde: '2020-05-01'
      },
      {
        codigo: 'BUEN',
        descripcion: 'BUEN CONTRIBUYENTE',
        desde: '2021-01-01'
      }
    ]
  },
  {
    ruc: '20987654321',
    razonSocial: 'SERVICIOS GENERALES LIMA EIRL',
    nombreComercial: 'SERVICIOS LIMA',
    estado: 'activo',
    condicion: 'habido',
    tipoContribuyente: 'EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA',
    fechaInscripcion: '2019-08-20',
    fechaInicioActividades: '2019-09-01',
    actividadEconomica: 'ACTIVIDADES DE SERVICIOS ADMINISTRATIVOS',
    sistemaEmision: 'COMPUTARIZADO',
    sistemaContabilidad: 'MANUAL',
    direccion: {
      ubigeo: '150102',
      tipoZona: 'JIRON',
      nombreZona: 'UNION',
      numero: '567',
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'RIMAC'
    },
    representanteLegal: {
      tipoDocumento: 'DNI',
      numeroDocumento: '87654321',
      nombre: 'MARIA ELENA RODRIGUEZ TORRES'
    },
    actividadesEconomicas: [
      {
        codigo: '8211',
        descripcion: 'ACTIVIDADES DE SERVICIOS ADMINISTRATIVOS',
        principal: true
      }
    ],
    comprobantes: [
      { codigo: '01', descripcion: 'FACTURA' },
      { codigo: '03', descripcion: 'BOLETA DE VENTA' }
    ],
    padrones: []
  }
];


/**
 * Componente principal de búsqueda por RUC/nombre.
 * Incluye lógica de validación, consulta simulada y modales de resultado.
 */
export function RucSearch() {
  // Estado del formulario y resultados
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'ruc' | 'nombre'>('ruc');
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [searchResults, setSearchResults] = useState<EmpresaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const { addToast } = useToast();


  /**
   * Valida si el RUC tiene 11 dígitos numéricos
   */
  const validateRuc = (rucValue: string): boolean => {
    const rucPattern = /^\d{11}$/;
    return rucPattern.test(rucValue);
  };


  /**
   * Ejecuta la búsqueda por RUC o nombre, simula consulta y muestra resultados.
   */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError(`Ingrese ${searchType === 'ruc' ? 'un número de RUC' : 'un nombre de empresa'}`);
      return;
    }
    if (searchType === 'ruc' && !validateRuc(searchTerm)) {
      setError('El RUC debe tener 11 dígitos');
      return;
    }
    setIsLoading(true);
    setError('');
    setEmpresaData(null);
    setSearchResults([]);
    try {
      // Simula retardo de consulta
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (searchType === 'ruc') {
        const empresa = mockEmpresasData.find(e => e.ruc === searchTerm);
        if (empresa) {
          setSearchResults([empresa]);
          setShowResultsModal(true);
          addToast('Consulta realizada exitosamente', 'success');
        } else {
          setError('No se encontraron datos para el RUC consultado');
        }
      } else {
        // Búsqueda por nombre
        let results = mockEmpresasData.filter(e => 
          e.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.nombreComercial && e.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        // Ordenar alfabéticamente por razón social
        results = results.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es', { sensitivity: 'base' }));
        if (results.length > 0) {
          setSearchResults(results);
          setShowResultsModal(true);
          addToast(`Se encontraron ${results.length} resultado(s)`, 'success');
        } else {
          setError('No se encontraron empresas con ese nombre');
        }
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
  const selectEmpresa = (empresa: EmpresaData) => {
    setEmpresaData(empresa);
    setShowResultsModal(false);
    addToast('Consulta realizada exitosamente', 'success');
  };




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
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Búsqueda por RUC</span>
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
                  {/* Tarjeta Nombre */}
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
                    <User className={`h-12 w-12 mb-3 ${searchType === 'nombre' ? 'text-[#C01702]' : 'text-gray-400'}`} />
                    <span className="font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Por Nombre</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-center font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <div className="flex-1">
                <label className="block text-base font-semibold text-[#fffff] mb-2 tracking-tight font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
                  {searchType === 'ruc' ? 'Número de RUC' : 'Nombre de la Empresa'}
                </label>
                <div className="relative">
                  {searchType === 'ruc' ? (
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  ) : (
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
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
                    maxLength={searchType === 'ruc' ? 11 : undefined}
                  />
                </div>
                <div className="min-h-[28px] flex items-center">
                  {error ? (
                    <div className="flex items-center gap-2 text-[#C01702]">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-base font-medium">{error}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-end h-full">
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-[#C01702] hover:bg-[#a01301] disabled:bg-gray-400 text-white px-8 py-3 rounded-xl flex items-center gap-3 text-lg font-semibold shadow-md transition-colors min-w-[150px]"
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
          {/* Ejemplos y advertencia de privacidad */}
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 border-t pt-4 border-gray-200 dark:border-gray-700 text-center font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
            <span className="inline-block bg-[#C0170208] text-[#C01702] font-semibold px-4 py-1 rounded-full mb-2 font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Ejemplos</span>
            <div>
              <span className="block">• RUC: <span className="font-mono">20123456789</span> o <span className="font-mono">20987654321</span></span>
              <span className="block">• Nombre: <span className="font-mono">"CONSTRUCTORA"</span> o <span className="font-mono">"SERVICIOS"</span></span>
            </div>
          </div>
        </div>
      </div>
      {/* Portales fuera del div principal */}
      {showResultsModal && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-200"
            style={{ zIndex: 9999 }}
            onClick={() => setShowResultsModal(false)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[80vh] overflow-y-auto" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none"
                onClick={() => {
                  setShowResultsModal(false);
                  addToast('Consulta realizada exitosamente', 'success');
                }}
                aria-label="Cerrar resultados"
                tabIndex={0}
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-[#C01702] mb-6 flex items-center gap-2">
                <Building className="h-6 w-6 text-[#C01702]" />
                Resultados de Búsqueda ({searchResults.length})
              </h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {searchResults.map((empresa) => (
                  <div
                    key={empresa.ruc}
                    onClick={() => selectEmpresa(empresa)}
                    className="p-5 border-2 border-gray-300 rounded-lg hover:bg-[#C0170208] cursor-pointer transition-colors flex items-center justify-between shadow-sm group"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-[#C01702]">
                        {empresa.razonSocial}
                      </p>
                      {empresa.nombreComercial && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">Nombre Comercial: {empresa.nombreComercial}</p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">RUC: {empresa.ruc}</p>
                        <span className="flex gap-2">{getEstadoBadge(empresa.estado)}{getCondicionBadge(empresa.condicion)}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
      {empresaData && typeof window !== 'undefined' && createPortal(
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
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none"
                onClick={() => setEmpresaData(null)}
                aria-label="Cerrar detalle"
                tabIndex={0}
              >
                ×
              </button>
              <h2 className="text-2xl font-bold text-[#C01702] mb-6 flex items-center gap-2">
                <Building className="h-7 w-7 text-[#C01702]" />
                Detalle de Empresa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Razón Social</span>
                    <span className="block text-lg font-bold text-gray-900 dark:text-white">{empresaData.razonSocial}</span>
                  </div>
                  {empresaData.nombreComercial && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre Comercial</span>
                      <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.nombreComercial}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RUC</span>
                    <span className="block text-base font-mono text-gray-800 dark:text-white">{empresaData.ruc}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {getEstadoBadge(empresaData.estado)}
                    {getCondicionBadge(empresaData.condicion)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo Contribuyente</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.tipoContribuyente}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Actividad Económica</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.actividadEconomica}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dirección</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.direccion.tipoZona} {empresaData.direccion.nombreZona} {empresaData.direccion.numero}{empresaData.direccion.interior ? (", Int. " + empresaData.direccion.interior) : ''}, {empresaData.direccion.departamento}, {empresaData.direccion.provincia}, {empresaData.direccion.distrito}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha Inscripción</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.fechaInscripcion}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Inicio Actividades</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.fechaInicioActividades}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sistema Emisión</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.sistemaEmision}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sistema Contabilidad</span>
                    <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.sistemaContabilidad}</span>
                  </div>
                  {empresaData.representanteLegal && (
                    <div>
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Representante Legal</span>
                      <span className="block text-base text-gray-700 dark:text-gray-300">{empresaData.representanteLegal.nombre} ({empresaData.representanteLegal.tipoDocumento} {empresaData.representanteLegal.numeroDocumento})</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Actividades económicas */}
              {empresaData.actividadesEconomicas && empresaData.actividadesEconomicas.length > 0 && (
                <div className="mb-4">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Actividades Económicas</span>
                  <ul className="list-disc pl-6 space-y-1">
                    {empresaData.actividadesEconomicas.map((act, idx) => (
                      <li key={idx} className={act.principal ? 'font-bold text-[#C01702]' : ''}>
                        {act.descripcion} {act.principal && <span className="ml-2 text-xs bg-[#C01702] text-white px-2 py-0.5 rounded">Principal</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Comprobantes */}
              {empresaData.comprobantes && empresaData.comprobantes.length > 0 && (
                <div className="mb-4">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comprobantes Autorizados</span>
                  <ul className="list-disc pl-6 space-y-1">
                    {empresaData.comprobantes.map((c, idx) => (
                      <li key={idx}>{c.descripcion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Padrones */}
              {empresaData.padrones && empresaData.padrones.length > 0 && (
                <div className="mb-4">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Padrones</span>
                  <ul className="list-disc pl-6 space-y-1">
                    {empresaData.padrones.map((p, idx) => (
                      <li key={idx}>{p.descripcion} (Desde: {p.desde}{p.hasta ? `, Hasta: ${p.hasta}` : ''})</li>
                    ))}
                  </ul>
                </div>
              )}
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
              <div className="flex justify-end gap-4 mt-4">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold shadow"
                  onClick={() => {
                    setEmpresaData(null);
                    setShowSuccessModal(true);
                    setTimeout(() => setShowSuccessModal(false), 2200);
                  }}
                >
                  Aceptar
                </button>
      {/* Modal de éxito institucional */}
      {showSuccessModal && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-200"
            style={{ zIndex: 99999 }}
            onClick={() => setShowSuccessModal(false)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 100000 }}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl px-10 py-12 shadow-2xl border-2 border-green-600 w-full max-w-md mx-auto flex flex-col items-center pointer-events-auto animate-fade-in" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-green-700 text-2xl font-bold focus:outline-none"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Cerrar mensaje de éxito"
                tabIndex={0}
              >
                ×
              </button>
              <div className="flex flex-col items-center gap-4">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="30" fill="#22C55E" fillOpacity="0.15"/>
                  <path d="M18 32L27 41L43 23" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="text-2xl font-bold text-green-700 text-center">Operación exitosa</h3>
                <p className="text-base text-gray-700 dark:text-gray-200 text-center">La consulta y visualización de la empresa se realizó correctamente.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
                <button
                  className="bg-[#C01702] hover:bg-[#a01301] text-white px-6 py-2 rounded-lg font-semibold shadow"
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(16);
                    doc.text('Detalle de Empresa', 15, 20);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    let y = 30;
                    doc.text(`Razón Social: ${empresaData.razonSocial}`, 15, y); y += 8;
                    if (empresaData.nombreComercial) { doc.text(`Nombre Comercial: ${empresaData.nombreComercial}`, 15, y); y += 8; }
                    doc.text(`RUC: ${empresaData.ruc}`, 15, y); y += 8;
                    doc.text(`Estado: ${empresaData.estado}`, 15, y); y += 8;
                    doc.text(`Condición: ${empresaData.condicion}`, 15, y); y += 8;
                    doc.text(`Tipo Contribuyente: ${empresaData.tipoContribuyente}`, 15, y); y += 8;
                    doc.text(`Actividad Económica: ${empresaData.actividadEconomica}`, 15, y); y += 8;
                    doc.text(`Dirección: ${empresaData.direccion.tipoZona} ${empresaData.direccion.nombreZona} ${empresaData.direccion.numero}${empresaData.direccion.interior ? (", Int. " + empresaData.direccion.interior) : ''}, ${empresaData.direccion.departamento}, ${empresaData.direccion.provincia}, ${empresaData.direccion.distrito}`, 15, y); y += 8;
                    doc.text(`Fecha Inscripción: ${empresaData.fechaInscripcion}`, 15, y); y += 8;
                    doc.text(`Inicio Actividades: ${empresaData.fechaInicioActividades}`, 15, y); y += 8;
                    doc.text(`Sistema Emisión: ${empresaData.sistemaEmision}`, 15, y); y += 8;
                    doc.text(`Sistema Contabilidad: ${empresaData.sistemaContabilidad}`, 15, y); y += 8;
                    if (empresaData.representanteLegal) { doc.text(`Representante Legal: ${empresaData.representanteLegal.nombre} (${empresaData.representanteLegal.tipoDocumento} ${empresaData.representanteLegal.numeroDocumento})`, 15, y); y += 8; }
                    if (empresaData.actividadesEconomicas && empresaData.actividadesEconomicas.length > 0) {
                      doc.text('Actividades Económicas:', 15, y); y += 8;
                      empresaData.actividadesEconomicas.forEach((act) => {
                        doc.text(`- ${act.descripcion}${act.principal ? ' (Principal)' : ''}`, 20, y); y += 8;
                      });
                    }
                    if (empresaData.comprobantes && empresaData.comprobantes.length > 0) {
                      doc.text('Comprobantes Autorizados:', 15, y); y += 8;
                      empresaData.comprobantes.forEach((c) => {
                        doc.text(`- ${c.descripcion}`, 20, y); y += 8;
                      });
                    }
                    if (empresaData.padrones && empresaData.padrones.length > 0) {
                      doc.text('Padrones:', 15, y); y += 8;
                      empresaData.padrones.forEach((p) => {
                        doc.text(`- ${p.descripcion} (Desde: ${p.desde}${p.hasta ? `, Hasta: ${p.hasta}` : ''})`, 20, y); y += 8;
                      });
                    }
                    doc.save(`empresa_${empresaData.ruc}.pdf`);
                  }}
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}