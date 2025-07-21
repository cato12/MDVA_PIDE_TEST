
/**
 * Dashboard principal para trabajadores municipales.
 * Muestra métricas de consultas, actividad reciente y resumen visual.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Métricas rápidas de consultas
 * - Consultas recientes (DNI/RUC)
 * - Resumen visual de actividad
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module TrabajadorDashboard
 */
import { useEffect, useState } from 'react';
import { Search, Building, User, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
// import type { ComponentType } from 'react';

// const JoyrideComponent = Joyride as unknown as ComponentType<any>;


export function TrabajadorDashboard() {
  const { user } = useAuth();
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [runTutorial, setRunTutorial] = useState(false);
  // const steps: Step[] = [
  //   {
  //     target: 'h1', // Encabezado de bienvenida
  //     content: 'Bienvenido al panel del trabajador. Aquí verás un resumen de tu actividad.',
  //   },
  //   {
  //     target: '[aria-label="Consultas RUC Realizadas"]',
  //     content: 'Aquí verás cuántas consultas RUC has realizado.',
  //   },
  //   {
  //     target: '[aria-label="Consultas DNI Realizadas"]',
  //     content: 'Este bloque muestra las consultas realizadas por DNI.',
  //   },
  //   {
  //     target: '[aria-label="Total Consultas"]',
  //     content: 'Aquí se muestra el total acumulado de consultas.',
  //   },
  //   {
  //     target: 'h2', // Título "Consultas Recientes"
  //     content: 'Aquí se listan las consultas recientes que hiciste. Puedes revisarlas rápidamente.',
  //   },
  //   {
  //     target: '[aria-label="Consultas DNI Realizadas"]',
  //     content: 'Este bloque muestra las consultas realizadas por DNI.',
  //   },
  //   {
  //     target: '[aria-label="Total Consultas"]',
  //     content: 'Aquí se muestra el total acumulado de consultas.',
  //   },
  //   {
  //     target: 'h2', // Título "Consultas Recientes"
  //     content: 'Aquí se listan las consultas recientes que hiciste. Puedes revisarlas rápidamente.',
  //   }
  // ];

  // useEffect(() => {
  //   const yaVisto = localStorage.getItem('tutorialDashboardVisto');
  //   if (!yaVisto) {
  //     setRunTutorial(true);
  //     localStorage.setItem('tutorialDashboardVisto', 'true');
  //   }
  // }, []);

  useEffect(() => {
    const fetchRecentSearches = async () => {
      setLoading(true);
      setError(null);
      try {

        const token = localStorage.getItem('token');
        const res = await fetch('/api/audit-logs/mis-consultas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        if (!res.ok) throw new Error('No se pudieron obtener las consultas recientes');
        let data;
        let text;
        try {
          text = await res.text();
          data = JSON.parse(text);
        } catch (err) {
          setError('Error inesperado al procesar la respuesta del servidor. Respuesta cruda: ' + text);
          console.error('Respuesta cruda del backend:', text);
          return;
        }
        // Mapea los datos reales recibidos del backend
        const mapped = (Array.isArray(data) ? data : []).map((item, idx) => {
          if (item.type === 'DNI') {
            return {
              id: item.id || idx,
              type: 'DNI',
              query: item.query,
              result: item.result,
              time: item.timestamp ? new Date(item.timestamp).toLocaleString('es-PE', { hour12: false }) : '',
              sexo: item.sexo || '',
              fecha_nacimiento: item.fecha_nacimiento || '',
              status: 'success',
            };
          } else if (item.type === 'RUC') {
            return {
              id: item.id || idx,
              type: 'RUC',
              query: item.query,
              result: item.result,
              estado: item.estado || '',
              condicion: item.condicion || '',
              time: item.timestamp ? new Date(item.timestamp).toLocaleString('es-PE', { hour12: false }) : '',
              status: 'success',
            };
          } else {
            return {
              id: item.id || idx,
              type: item.type || '',
              query: item.query || '',
              result: item.result || '',
              time: item.timestamp ? new Date(item.timestamp).toLocaleString('es-PE', { hour12: false }) : '',
              status: 'success',
            };
          }
        });
        setRecentSearches(mapped);
      } catch (e: any) {
        setError(e.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchRecentSearches();
  }, []);

  // Métricas principales de consultas realizadas
  // Calcula métricas reales según recentSearches
  const rucCount = recentSearches.filter(s => s.type === 'RUC').length;
  const dniCount = recentSearches.filter(s => s.type === 'DNI').length;
  const today = new Date().toLocaleDateString();
  const todayCount = recentSearches.filter(s => {
    if (!s.time) return false;
    const d = new Date(s.time);
    return !isNaN(d.getTime()) && d.toLocaleDateString() === today;
  }).length;
  const stats = [
    {
      title: 'Consultas RUC Realizadas',
      value: rucCount,
      icon: Building,
      color: 'bg-blue-500',
      trend: ''
    },
    {
      title: 'Consultas DNI Realizadas',
      value: dniCount,
      icon: User,
      color: 'bg-green-500',
      trend: ''
    },
    {
      title: 'Total Consultas',
      value: rucCount + dniCount,
      icon: Search,
      color: 'bg-purple-500',
      trend: ''
    }
  ];

  return (
    // <>
    //   <JoyrideComponent
    //     steps={steps}
    //     continuous
    //     showSkipButton
    //     showProgress
    //     run={runTutorial}
    //     styles={{ options: { zIndex: 9999, primaryColor: '#c00202c0' } }}
    //     callback={(data: CallBackProps) => {
    //       const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    //       if (finishedStatuses.includes(data.status as typeof finishedStatuses[number])) {
    //         setRunTutorial(false);
    //       }
    //     }}
    //   />

    <div className="space-y-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
          Bienvenido, <span className="text-[#C01702]">{user ? `${user.nombres} ${user.apellidos}` : ''}</span>
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-300">
          Vista general de tus operaciones realizadas.
        </p>
        <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
        {/* <button
          onClick={() => setRunTutorial(true)}
          className="text-sm font-medium text-[#C01702] underline hover:text-red-700 mt-2"
          >
          Ver tutorial
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stats.slice(0, 3).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200"
              aria-label={stat.title}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {stat.trend}
                  </p>
                </div>
                <div className="p-3 flex items-center justify-center">
                  <Icon className="h-10 w-10 text-[#C01702]" aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
        {/*
          Consultas Recientes:
          - Lista de búsquedas recientes de RUC/DNI.
          - Cada ítem muestra tipo, query, resultado y tiempo.
          - Accesible, con contraste y responsividad.
        */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Clock className="h-5 w-5 text-[#C01702]" aria-hidden="true" />
            <span className="text-[#C01702]">Consultas Recientes</span>
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C01702]/60 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
            {/* {recentSearches.map((search) => (
              <div key={search.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="rounded-full p-2 flex items-center justify-center bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702]">
                  {search.type === 'RUC' ? (
                    <Building className="h-4 w-4 text-[#C01702]" aria-hidden="true" />
                  ) : ( */}
                        {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando consultas recientes...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : recentSearches.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No hay consultas recientes.</div>
            ) : (
              recentSearches.map((search) => (
                <div key={search.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="rounded-full p-2 flex items-center justify-center bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702]">
                    <User className="h-4 w-4 text-[#C01702]" aria-hidden="true" />
                              </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-[#C01702] text-[#C01702] bg-white dark:bg-gray-900">{search.type}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {search.query}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {search.result}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {search.time}
                    </p>
                  </div>
                </div>
              ))
            )}
{/*                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-[#C01702] text-[#C01702] bg-white dark:bg-gray-900">{search.type}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {search.query}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {search.result}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {search.time}
                  </p>
                </div>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
    // </>
  );
}