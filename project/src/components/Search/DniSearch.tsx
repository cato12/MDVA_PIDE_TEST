
/**
 * Componente de búsqueda de personas por DNI o nombre.
 * Permite consultar datos simulados de RENIEC, mostrando resultados detallados y exportables.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Selector de tipo de búsqueda (DNI/nombre)
 * - Formulario de búsqueda
 * - Resultados en modal (portal)
 * - Detalle de persona en modal (portal)
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module DniSearch
 */
import React, { useState } from 'react';
import {
  Search, User, Calendar, MapPin, FileText, AlertCircle, Copy, Download, RefreshCw, Shield, Users
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createPortal } from 'react-dom';

/**
 * Estructura de datos de una persona (simulada RENIEC)
 */
interface PersonaData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  estadoCivil: string;
  ubigeoNacimiento: string;
  lugarNacimiento: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  direccion?: {
    departamento: string;
    provincia: string;
    distrito: string;
    direccionCompleta: string;
  };
  restricciones?: Array<{
    tipo: string;
    descripcion: string;
    vigente: boolean;
  }>;
  votacion?: {
    local: string;
    mesa: string;
    direccion: string;
  };
}

/**
 * Datos simulados de personas (mock RENIEC)
 */
const mockPersonasData: PersonaData[] = [
  {
    dni: '12345678',
    nombres: 'JUAN CARLOS',
    apellidoPaterno: 'PEREZ',
    apellidoMaterno: 'GARCIA',
    nombreCompleto: 'PEREZ GARCIA, JUAN CARLOS',
    fechaNacimiento: '1985-03-15',
    edad: 39,
    sexo: 'M',
    estadoCivil: 'SOLTERO',
    ubigeoNacimiento: '150101',
    lugarNacimiento: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'LIMA'
    },
    direccion: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'SAN ISIDRO',
      direccionCompleta: 'AV. JAVIER PRADO ESTE 1234 DPTO 501'
    },
    restricciones: [
      {
        tipo: 'JUDICIAL',
        descripcion: 'Sin restricciones judiciales',
        vigente: false
      }
    ],
    votacion: {
      local: 'I.E. JOSE MARIA EGUREN',
      mesa: '123456',
      direccion: 'AV. SALAVERRY 1234 - SAN ISIDRO'
    }
  },
  {
    dni: '87654321',
    nombres: 'MARIA ELENA',
    apellidoPaterno: 'RODRIGUEZ',
    apellidoMaterno: 'TORRES',
    nombreCompleto: 'RODRIGUEZ TORRES, MARIA ELENA',
    fechaNacimiento: '1990-07-22',
    edad: 34,
    sexo: 'F',
    estadoCivil: 'CASADA',
    ubigeoNacimiento: '150102',
    lugarNacimiento: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'RIMAC'
    },
    direccion: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'RIMAC',
      direccionCompleta: 'JR. UNION 567 INT 201'
    },
    restricciones: [
      {
        tipo: 'JUDICIAL',
        descripcion: 'Sin restricciones judiciales',
        vigente: false
      }
    ],
    votacion: {
      local: 'COLEGIO NACIONAL RIMAC',
      mesa: '654321',
      direccion: 'AV. RIMAC 890 - RIMAC'
    }
  },
  {
    dni: '11223344',
    nombres: 'CARLOS ALBERTO',
    apellidoPaterno: 'GARCIA',
    apellidoMaterno: 'LOPEZ',
    nombreCompleto: 'GARCIA LOPEZ, CARLOS ALBERTO',
    fechaNacimiento: '1978-12-10',
    edad: 45,
    sexo: 'M',
    estadoCivil: 'DIVORCIADO',
    ubigeoNacimiento: '150103',
    lugarNacimiento: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'BREÑA'
    },
    direccion: {
      departamento: 'LIMA',
      provincia: 'LIMA',
      distrito: 'BREÑA',
      direccionCompleta: 'AV. BOLIVIA 123 DPTO 302'
    },
    restricciones: [
      {
        tipo: 'JUDICIAL',
        descripcion: 'Sin restricciones judiciales',
        vigente: false
      }
    ],
    votacion: {
      local: 'I.E. RICARDO PALMA',
      mesa: '789012',
      direccion: 'AV. BOLIVIA 456 - BREÑA'
    }
  }
];


/**
 * Componente principal de búsqueda por DNI/nombre.
 * Incluye lógica de validación, consulta simulada y modales de resultado.
 */
export function DniSearch() {
  // Estado del formulario y resultados
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'dni' | 'nombre'>('dni');
  const [personaData, setPersonaData] = useState<PersonaData | null>(null);
  const [searchResults, setSearchResults] = useState<PersonaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const { addToast } = useToast();


  /**
   * Valida si el DNI tiene 8 dígitos numéricos
   */
  const validateDni = (dniValue: string): boolean => {
    const dniPattern = /^\d{8}$/;
    return dniPattern.test(dniValue);
  };


  /**
   * Calcula la edad a partir de la fecha de nacimiento
   */
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };


  /**
   * Ejecuta la búsqueda por DNI o nombre, simula consulta y muestra resultados.
   */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError(`Ingrese ${searchType === 'dni' ? 'un número de DNI' : 'un nombre completo'}`);
      return;
    }
    if (searchType === 'dni' && !validateDni(searchTerm)) {
      setError('El DNI debe tener 8 dígitos');
      return;
    }
    setIsLoading(true);
    setError('');
    setPersonaData(null);
    setSearchResults([]);
    try {
      // Simula retardo de consulta
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (searchType === 'dni') {
        const persona = mockPersonasData.find(p => p.dni === searchTerm);
        if (persona) {
          const data = { ...persona };
          data.edad = calculateAge(data.fechaNacimiento);
          setSearchResults([data]);
          setShowResultsModal(true);
          addToast('Consulta realizada exitosamente', 'success');
        } else {
          setError('No se encontraron datos para el DNI consultado');
        }
      } else {
        // Búsqueda por nombre
        const results = mockPersonasData.filter(p => 
          p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.apellidoPaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.apellidoMaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (results.length > 0) {
          const resultsWithAge = results.map(p => ({
            ...p,
            edad: calculateAge(p.fechaNacimiento)
          }));
          setSearchResults(resultsWithAge);
          setShowResultsModal(true);
          addToast(`Se encontraron ${results.length} resultado(s)`, 'success');
        } else {
          setError('No se encontraron personas con ese nombre');
        }
      }
    } catch (err) {
      setError('Error al realizar la consulta. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Selecciona una persona de los resultados y muestra el detalle.
   */
  const selectPersona = (persona: PersonaData) => {
    setPersonaData(persona);
    setShowResultsModal(false);
    addToast('Consulta realizada exitosamente', 'success');
  };


  /**
   * Copia texto al portapapeles y muestra toast.
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copiado al portapapeles', 'success');
  };


  /**
   * Exporta los datos de la persona seleccionada como JSON.
   */
  const exportData = () => {
    if (personaData) {
      const dataStr = JSON.stringify(personaData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `persona_${personaData.dni}.json`;
      link.click();
      addToast('Datos exportados correctamente', 'success');
    }
  };


  /**
   * Devuelve un badge visual para el sexo (M/F)
   */
  const getSexoBadge = (sexo: string) => {
    const colors = {
      'M': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'F': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    const labels = {
      'M': 'Masculino',
      'F': 'Femenino'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[sexo as keyof typeof colors]}`}>
        {labels[sexo as keyof typeof labels]}
      </span>
    );
  };

  return (
    <>
      {/*
        Formulario de búsqueda principal
        - Selector de tipo (DNI/nombre)
        - Input y botón de consulta
        - Ejemplos y advertencia de privacidad
      */}
      <div className="min-h-[80vh] py-12 space-y-8 flex flex-col items-center font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
        <div className="relative bg-gradient-to-br from-[#fff7f6] via-white to-[#f9f9f9] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl p-0 shadow-xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto overflow-hidden">
          {/* Encabezado destacado */}
          <div className="bg-[#C01702] bg-opacity-95 px-10 py-7 rounded-t-2xl flex flex-col items-center border-b-4 border-gray-200 dark:border-gray-700 shadow-md font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>Búsqueda por DNI</span>
            </div>
            <p className="text-white text-sm opacity-90 font-medium mt-1" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              Consulte información de ciudadanos registrados en RENIEC por DNI o nombre
            </p>
          </div>
          <div className="px-10 py-8 space-y-8">
            {/* Selector de tipo de búsqueda como tarjetas grandes y centradas */}
            <div>
              <div className="flex flex-col items-center justify-center">
                <div className="flex gap-10 justify-center">
                  {/* Tarjeta DNI */}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType('dni');
                      setSearchTerm('');
                      setError('');
                    }}
                    className={`flex flex-col items-center justify-center px-12 py-8 rounded-2xl border-2 shadow-md transition-all duration-150 cursor-pointer w-56 h-40 text-xl font-semibold tracking-tight
                      ${searchType === 'dni'
                        ? 'border-gray-300 bg-[#C017020e] text-[#C01702] shadow-lg scale-105 ring-2 ring-[#C01702]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-[#C0170204]'}
                    `}
                    tabIndex={0}
                    aria-pressed={searchType === 'dni'}
                  >
                    <User className={`h-12 w-12 mb-3 ${searchType === 'dni' ? 'text-[#C01702]' : 'text-gray-400'}`} />
                    <span>Por DNI</span>
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
                    <Users className={`h-12 w-12 mb-3 ${searchType === 'nombre' ? 'text-[#C01702]' : 'text-gray-400'}`} />
                    <span>Por Nombre</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="block text-base font-semibold text-[#fffff] mb-2 tracking-tight font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
                  {searchType === 'dni' ? 'Número de DNI' : 'Nombre Completo'}
                </label>
                <div className="relative">
                  {searchType === 'dni' ? (
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  ) : (
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  )}
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      if (searchType === 'dni') {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                        setSearchTerm(value);
                      } else {
                        setSearchTerm(e.target.value);
                      }
                      setError('');
                    }}
                    placeholder={searchType === 'dni' ? 'Ingrese DNI de 8 dígitos' : 'Ingrese nombres o apellidos'}
                    className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:border-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium shadow-md placeholder-gray-400 font-sans"
                    style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}
                    maxLength={searchType === 'dni' ? 8 : undefined}
                  />
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-2 text-[#C01702]">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-base font-medium">{error}</span>
                  </div>
                )}
              </div>
              <div className="flex items-end">
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
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 border-t pt-4 border-gray-200 dark:border-gray-700 text-center">
            <span className="inline-block bg-[#C0170208] text-[#C01702] font-semibold px-4 py-1 rounded-full mb-2">Ejemplos</span>
            <div>
              <span className="block">• DNI: <span className="font-mono">12345678</span>, <span className="font-mono">87654321</span> o <span className="font-mono">11223344</span></span>
              <span className="block">• Nombre: <span className="font-mono">"JUAN"</span>, <span className="font-mono">"GARCIA"</span>, <span className="font-mono">"MARIA ELENA"</span></span>
            </div>
            <p className="text-xs mt-1">
              <Shield className="h-3 w-3 inline mr-1" />
              Esta consulta está sujeta a las políticas de privacidad y uso responsable de datos personales.
            </p>
          </div>
        </div>
      </div>
      {/* Modal de resultados de búsqueda por nombre o DNI (portal, fondo oscuro desenfocado, z-index alto) */}
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
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[80vh] overflow-y-auto">
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
                <Search className="h-6 w-6 text-[#C01702]" />
                Resultados de Búsqueda ({searchResults.length})
              </h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {searchResults.map((persona) => (
                  <div
                    key={persona.dni}
                    onClick={() => selectPersona(persona)}
                    className="p-5 border-2 border-gray-300 rounded-lg hover:bg-[#C0170208] cursor-pointer transition-colors flex items-center justify-between shadow-sm group"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-[#C01702]">
                        {persona.nombreCompleto}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        DNI: {persona.dni}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {persona.edad} años • {persona.estadoCivil}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSexoBadge(persona.sexo)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal de información detallada de la persona seleccionada (portal) */}
      {personaData && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-200"
            style={{ zIndex: 9999 }}
            onClick={() => setPersonaData(null)}
          />
          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-3xl mx-auto animate-fade-in flex flex-col pointer-events-auto max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none"
                onClick={() => setPersonaData(null)}
                aria-label="Cerrar información"
                tabIndex={0}
              >
                ×
              </button>
              {/* Información personal */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-500" />
                  Información Personal
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        DNI
                      </label>
                      <p className="text-lg font-mono text-gray-900 dark:text-white">{personaData.dni}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre Completo
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">{personaData.nombreCompleto}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombres
                        </label>
                        <p className="text-gray-900 dark:text-white">{personaData.nombres}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Apellido Paterno
                        </label>
                        <p className="text-gray-900 dark:text-white">{personaData.apellidoPaterno}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Apellido Materno
                        </label>
                        <p className="text-gray-900 dark:text-white">{personaData.apellidoMaterno}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Sexo
                        </label>
                        {getSexoBadge(personaData.sexo)}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Estado Civil
                        </label>
                        <p className="text-gray-900 dark:text-white">{personaData.estadoCivil}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-white">
                          {new Date(personaData.fechaNacimiento).toLocaleDateString('es-PE')}
                        </p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({personaData.edad} años)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lugar de Nacimiento
                      </label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-white">
                          {personaData.lugarNacimiento.distrito}, {personaData.lugarNacimiento.provincia}, {personaData.lugarNacimiento.departamento}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ubigeo de Nacimiento
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono">{personaData.ubigeoNacimiento}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              {personaData.direccion && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary-500" />
                    Dirección de Domicilio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dirección Completa
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.direccion.direccionCompleta}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Distrito
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.direccion.distrito}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provincia
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.direccion.provincia}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Departamento
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.direccion.departamento}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Electoral */}
              {personaData.votacion && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary-500" />
                    Información Electoral
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Local de Votación
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.votacion.local}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mesa de Votación
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono">{personaData.votacion.mesa}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dirección del Local
                      </label>
                      <p className="text-gray-900 dark:text-white">{personaData.votacion.direccion}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Restricciones */}
              {personaData.restricciones && personaData.restricciones.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary-500" />
                    Restricciones y Observaciones
                  </h3>
                  <div className="space-y-3">
                    {personaData.restricciones.map((restriccion, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          restriccion.vigente 
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' 
                            : 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className={`h-4 w-4 ${
                            restriccion.vigente 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                          <p className={`font-medium ${
                            restriccion.vigente 
                              ? 'text-red-900 dark:text-red-100' 
                              : 'text-green-900 dark:text-green-100'
                          }`}>
                            {restriccion.tipo}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            restriccion.vigente 
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' 
                              : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                          }`}>
                            {restriccion.vigente ? 'Vigente' : 'Sin restricciones'}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          restriccion.vigente 
                            ? 'text-red-700 dark:text-red-300' 
                            : 'text-green-700 dark:text-green-300'
                        }`}>
                          {restriccion.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advertencia de uso */}
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Uso Responsable de Datos Personales
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
    </>
  );
}