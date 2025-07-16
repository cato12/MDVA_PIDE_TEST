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
import { consultarDNI as consultarDNIapi } from '../../api/consumoApi';
import {
  Search, User, Calendar, MapPin, FileText, AlertCircle, RefreshCw, Shield, Users
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  /** Código de verificación del DNI */
  codigoVerificacion?: string;
  votacion?: {
    local: string;
    mesa: string;
    direccion: string;
  };
}


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
    if (searchType === 'nombre') {
      setError('La búsqueda por nombre aún no está disponible.');
      return;
    }
    if (!validateDni(searchTerm)) {
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
      // Consulta real al backend
      const result = await consultarDNIapi(searchTerm);
      if (result && !result.error) {
        // Adaptar los campos según respuesta real y normalizar nombres
        const fechaNac = result.fechaNacimiento || result.fecha_nacimiento || '';
        // Adaptar código de verificación desde diferentes posibles campos
        const codigoVerificacion = result.codigoVerificacion || result.codigo_verificacion || (result.data && (result.data.codigoVerificacion || result.data.codigo_verificacion)) || '';
        // Adaptar sexo, si viene vacío dejar como undefined
        const sexo = (result.sexo || result.genero || (result.data && (result.data.sexo || result.data.genero)) || '').trim();
        const data = {
          dni: result.dni || result.numero || (result.data && (result.data.dni || result.data.numero)) || searchTerm,
          nombres: result.nombres || (result.data && result.data.nombres) || result.nombres_completos || '',
          apellidoPaterno: result.apellidoPaterno || (result.data && result.data.apellido_paterno) || result.apellido_paterno || '',
          apellidoMaterno: result.apellidoMaterno || (result.data && result.data.apellido_materno) || result.apellido_materno || '',
          nombreCompleto: result.nombreCompleto || (result.data && result.data.nombre_completo) || result.nombre_completo || '',
          fechaNacimiento: fechaNac || (result.data && result.data.fecha_nacimiento) || '',
          edad: fechaNac ? calculateAge(fechaNac) : 0,
          sexo: sexo === '' ? undefined : sexo,
          estadoCivil: result.estadoCivil || (result.data && result.data.estado_civil) || result.estado_civil || '',
          ubigeoNacimiento: result.ubigeoNacimiento || (result.data && (result.data.ubigeo_reniec || result.data.ubigeo)) || result.ubigeo_nacimiento || '',
          lugarNacimiento: {
            departamento: result.departamentoNacimiento || (result.data && result.data.departamento) || result.departamento_nacimiento || '',
            provincia: result.provinciaNacimiento || (result.data && result.data.provincia) || result.provincia_nacimiento || '',
            distrito: result.distritoNacimiento || (result.data && result.data.distrito) || result.distrito_nacimiento || ''
          },
          direccion: (result.direccion || (result.data && (result.data.direccion_completa || result.data.direccion))) ? {
            departamento: (result.direccion && result.direccion.departamento) || (result.data && result.data.departamento) || '',
            provincia: (result.direccion && result.direccion.provincia) || (result.data && result.data.provincia) || '',
            distrito: (result.direccion && result.direccion.distrito) || (result.data && result.data.distrito) || '',
            direccionCompleta: (result.direccion && (result.direccion.direccionCompleta || result.direccion.direccion_completa)) || (result.data && (result.data.direccion_completa || result.data.direccion)) || ''
          } : undefined,
          restricciones: result.restricciones || [],
          votacion: result.votacion || undefined,
          codigoVerificacion: codigoVerificacion
        };
        setSearchResults([data]);
        setShowResultsModal(true);
        addToast('Consulta realizada exitosamente', 'success');
      } else {
        setError(result.error || 'No se encontraron datos para el DNI consultado');
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
   * Exporta los datos personales y domicilio a PDF con formato institucional (logo, colores, tabla, pie de página)
   */
  const handleExportPDF = async () => {
    if (!personaData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const usuarioSesion = JSON.parse(localStorage.getItem('usuarioSesion') || '{}');
    const fechaHora = new Date().toLocaleString('es-PE');
    const img = new window.Image();
    img.src = '/imagenes/logo_mdva_rojo.png';
    img.onload = () => {
      doc.addImage(img, 'PNG', 20, 18, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(192, 23, 2);
      doc.text('Detalle de Persona', 70, 38);
      // Línea de generado por (nombre del usuario)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
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
      doc.text(generadoPor, 70, 54);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Fecha y hora: ${fechaHora}`, 70, 68);

      // Tabla de datos personales
      const datosPersonales = [
        ['DNI', personaData.dni],
        ...(personaData.codigoVerificacion ? [['Código de verificación', personaData.codigoVerificacion]] : []),
        ['Nombre completo', personaData.nombreCompleto || '-'],
        ['Nombres', personaData.nombres || '-'],
        ['Apellido paterno', personaData.apellidoPaterno || '-'],
        ['Apellido materno', personaData.apellidoMaterno || '-'],
        ['Sexo', personaData.sexo === 'M' ? 'Masculino' : personaData.sexo === 'F' ? 'Femenino' : '-'],
        ['Estado civil', personaData.estadoCivil || '-'],
        ['Nacimiento', personaData.fechaNacimiento ? new Date(personaData.fechaNacimiento).toLocaleDateString('es-PE') + (personaData.edad ? ` (${personaData.edad} años)` : '') : '-'],
        ['Lugar de nacimiento', personaData.lugarNacimiento ? [personaData.lugarNacimiento.distrito, personaData.lugarNacimiento.provincia, personaData.lugarNacimiento.departamento].filter(Boolean).join(', ') : '-'],
        ['Ubigeo', personaData.ubigeoNacimiento || '-'],
      ];
      autoTable(doc, {
        startY: 90,
        head: [['Campo', 'Valor']],
        body: datosPersonales,
        theme: 'grid',
        headStyles: { fillColor: [192, 23, 2], halign: 'center' },
        styles: { fontSize: 10, cellPadding: 4 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 320 } }
      });

      // Tabla de domicilio
      const domicilio = [
        ['Dirección', personaData.direccion?.direccionCompleta || '-'],
        ['Distrito', personaData.direccion?.distrito || '-'],
        ['Provincia', personaData.direccion?.provincia || '-'],
        ['Departamento', personaData.direccion?.departamento || '-'],
      ];
      let lastY = (doc as any).lastAutoTable?.finalY || 120;
      autoTable(doc, {
        startY: lastY + 16,
        head: [['Domicilio', 'Valor']],
        body: domicilio,
        theme: 'grid',
        headStyles: { fillColor: [192, 23, 2], halign: 'center' },
        styles: { fontSize: 10, cellPadding: 4 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 320 } }
      });
      lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;

      // Información electoral (si existe)
      if (personaData.votacion) {
        const votacion = [
          ['Local', personaData.votacion.local || '-'],
          ['Mesa', personaData.votacion.mesa || '-'],
          ['Dirección', personaData.votacion.direccion || '-'],
        ];
        autoTable(doc, {
          startY: lastY + 16,
          head: [['Información Electoral', 'Valor']],
          body: votacion,
          theme: 'grid',
          headStyles: { fillColor: [192, 23, 2], halign: 'center' },
          styles: { fontSize: 10, cellPadding: 4 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 320 } }
        });
        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
      }

      // Restricciones (si existen)
      if (personaData.restricciones && personaData.restricciones.length > 0) {
        const restricciones = personaData.restricciones.map(r => [r.tipo, `${r.descripcion} (${r.vigente ? 'Vigente' : 'Sin restricciones'})`]);
        autoTable(doc, {
          startY: lastY + 16,
          head: [['Restricción', 'Detalle']],
          body: restricciones,
          theme: 'grid',
          headStyles: { fillColor: [192, 23, 2], halign: 'center' },
          styles: { fontSize: 10, cellPadding: 4 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 320 } }
        });
        lastY = (doc as any).lastAutoTable?.finalY || lastY + 60;
      }

      // Pie de página y paginación
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('Municipalidad Distrital De Vista Alegre - Sistema MDVA', pageWidth / 2, pageHeight - 20, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: 'right' });
      }
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`persona_${personaData.dni}_${fecha}.pdf`);
    };
  };


  /**
   * Devuelve un badge visual para el sexo (M/F)
   */
  const getSexoBadge = (sexo: 'M' | 'F') => {
    const colors: Record<'M' | 'F', string> = {
      'M': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'F': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    const labels: Record<'M' | 'F', string> = {
      'M': 'Masculino',
      'F': 'Femenino'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[sexo]}`}>
        {labels[sexo]}
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
      <div className="min-h-[80vh] py-12 flex flex-col justify-center items-center space-y-8 font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
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
                    //setError('La búsqueda por nombre aún no está disponible.');
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

            <div className="flex flex-row gap-6 items-center">
              <div className="flex-1 flex flex-col">
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
                <div className="min-h-[28px]">
                  {error && (
                    <div className="mt-2 flex items-center gap-2 text-[#C01702]">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-base font-medium">{error}</span>
                    </div>
                  )}
                  {searchType === 'nombre' && !error && (
                    <span className="text-xs text-[#C01702] mt-2">Actualmente solo está disponible la búsqueda real por DNI.</span>
                  )}
                </div>
              </div>
              <div className="flex items-center h-full">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || searchType !== 'dni'}
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

          {/* Ejemplos y advertencia de privacidad */}
          <div className="my-10 flex justify-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium font-sans" style={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              LÍMITE DE USO: 3 CONSULTAS POR SEMANA.
            </div>
          </div>
        </div>
      </div>
      {/* Modal de resultados de búsqueda por nombre o DNI (portal, fondo oscuro desenfocado, z-index alto) */}
      {showResultsModal && typeof window !== 'undefined' &&
        createPortal(
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">DNI: {persona.dni}</span>
                          {persona.codigoVerificacion && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300 ml-2">
                              Código de verificación:
                              <span className="ml-1 font-mono text-[#C01702] tracking-widest">{persona.codigoVerificacion}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
      {personaData && typeof window !== 'undefined' &&
        createPortal(
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
                {/* Información personal minimalista */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-5 w-5 text-primary-500" />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Datos personales</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400">DNI</span>
                      <span className="font-mono text-base text-gray-900 dark:text-white">{personaData.dni}</span>
                    </div>
                    {personaData.codigoVerificacion && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Código de verificación</span>
                        <span className="font-mono text-base text-gray-900 dark:text-white">{personaData.codigoVerificacion}</span>
                      </div>
                    )}
                    {personaData.nombreCompleto && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Nombre completo</span>
                        <span className="text-base text-gray-900 dark:text-white font-medium">{personaData.nombreCompleto}</span>
                      </div>
                    )}
                    {personaData.nombres && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Nombres</span>
                        <span className="text-gray-900 dark:text-white">{personaData.nombres}</span>
                      </div>
                    )}
                    {personaData.apellidoPaterno && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Apellido paterno</span>
                        <span className="text-gray-900 dark:text-white">{personaData.apellidoPaterno}</span>
                      </div>
                    )}
                    {personaData.apellidoMaterno && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Apellido materno</span>
                        <span className="text-gray-900 dark:text-white">{personaData.apellidoMaterno}</span>
                      </div>
                    )}
                    {personaData.sexo && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Sexo</span>
                        {getSexoBadge(personaData.sexo)}
                      </div>
                    )}
                    {personaData.estadoCivil && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Estado civil</span>
                        <span className="text-gray-900 dark:text-white">{personaData.estadoCivil}</span>
                      </div>
                    )}
                    {personaData.fechaNacimiento && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Nacimiento</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{new Date(personaData.fechaNacimiento).toLocaleDateString('es-PE')}</span>
                          <span className="text-xs text-gray-400">({personaData.edad} años)</span>
                        </div>
                      </div>
                    )}
                    {(personaData.lugarNacimiento?.departamento || personaData.lugarNacimiento?.provincia || personaData.lugarNacimiento?.distrito) && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Lugar de nacimiento</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{[personaData.lugarNacimiento.distrito, personaData.lugarNacimiento.provincia, personaData.lugarNacimiento.departamento].filter(Boolean).join(', ')}</span>
                        </div>
                      </div>
                    )}
                    {personaData.ubigeoNacimiento && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Ubigeo</span>
                        <span className="text-gray-900 dark:text-white font-mono">{personaData.ubigeoNacimiento}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                {personaData.direccion && (
                  <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-primary-500" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">Domicilio</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 border-t border-gray-100 dark:border-gray-700 pt-3">
                      {personaData.direccion.direccionCompleta && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Dirección</span>
                          <span className="text-gray-900 dark:text-white">{personaData.direccion.direccionCompleta}</span>
                        </div>
                      )}
                      {personaData.direccion.distrito && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Distrito</span>
                          <span className="text-gray-900 dark:text-white">{personaData.direccion.distrito}</span>
                        </div>
                      )}
                      {personaData.direccion.provincia && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Provincia</span>
                          <span className="text-gray-900 dark:text-white">{personaData.direccion.provincia}</span>
                        </div>
                      )}
                      {personaData.direccion.departamento && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400">Departamento</span>
                          <span className="text-gray-900 dark:text-white">{personaData.direccion.departamento}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información Electoral */}
                {personaData.votacion && (
                  <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary-500" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">Electoral</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Local</span>
                        <span className="text-gray-900 dark:text-white">{personaData.votacion.local}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Mesa</span>
                        <span className="text-gray-900 dark:text-white font-mono">{personaData.votacion.mesa}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Dirección</span>
                        <span className="text-gray-900 dark:text-white">{personaData.votacion.direccion}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Restricciones */}
                {personaData.restricciones && personaData.restricciones.length > 0 && (
                  <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-primary-500" />
                      <span className="text-base font-semibold text-gray-900 dark:text-white">Restricciones</span>
                    </div>
                    <div className="space-y-2">
                      {personaData.restricciones.map((restriccion, index) => (
                        <div
                          key={index}
                          className={`rounded border px-3 py-2 text-sm flex items-center gap-3 ${
                            restriccion.vigente
                              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                              : 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                          }`}
                        >
                          <AlertCircle className={`h-4 w-4 ${
                            restriccion.vigente
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                          <span className="font-medium mr-2">{restriccion.tipo}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            restriccion.vigente
                              ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                          }`}>
                            {restriccion.vigente ? 'Vigente' : 'Sin restricciones'}
                          </span>
                          <span className={`ml-2 ${
                            restriccion.vigente
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {restriccion.descripcion}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencia de uso */}
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6">
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
                {/* Botón PDF profesional, debajo de advertencia de uso */}
                <div className="flex justify-center mb-8 print:hidden">
                  <button
                    onClick={handleExportPDF}
                    aria-label="Exportar PDF"
                    title="Exportar PDF"
                    className="bg-[#C01702] hover:bg-[#a01301] text-white font-semibold text-base px-7 py-2.5 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-[#C01702]/40 transition-colors"
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