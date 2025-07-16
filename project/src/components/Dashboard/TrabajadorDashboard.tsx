
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
import React from 'react';
import {
  Search, Building, User, FileText, Clock, TrendingUp, Activity, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


/**
 * Componente principal del dashboard de trabajador.
 * Muestra métricas, consultas recientes y resumen visual.
 */
export function TrabajadorDashboard() {
  const { user } = useAuth();

  // Métricas principales de consultas realizadas
  const stats = [
    {
      title: 'Consultas RUC Realizadas',
      value: 47,
      icon: Building,
      color: 'bg-blue-500',
      trend: '+12 esta semana'
    },
    {
      title: 'Consultas DNI Realizadas',
      value: 89,
      icon: User,
      color: 'bg-green-500',
      trend: '+23 esta semana'
    },
    {
      title: 'Total Consultas',
      value: 136,
      icon: Search,
      color: 'bg-purple-500',
      trend: '+35 esta semana'
    },
    {
      title: 'Consultas Hoy',
      value: 8,
      icon: Activity,
      color: 'bg-orange-500',
      trend: 'Día actual'
    }
  ];

  // Consultas recientes simuladas (DNI/RUC)
  const recentSearches = [
    {
      id: '1',
      type: 'RUC',
      query: '20123456789',
      result: 'CONSTRUCTORA MUNICIPAL SAC',
      time: 'Hace 15 minutos',
      status: 'success'
    },
    {
      id: '2',
      type: 'DNI',
      query: '12345678',
      result: 'JUAN CARLOS PEREZ GARCIA',
      time: 'Hace 1 hora',
      status: 'success'
    },
    {
      id: '3',
      type: 'RUC',
      query: '20987654321',
      result: 'SERVICIOS GENERALES LIMA EIRL',
      time: 'Hace 2 horas',
      status: 'success'
    },
    {
      id: '4',
      type: 'DNI',
      query: '87654321',
      result: 'MARIA ELENA RODRIGUEZ TORRES',
      time: 'Hace 3 horas',
      status: 'success'
    }
  ];


  return (
    <div className="space-y-10">
      {/*
        Header de bienvenida personalizado para el trabajador.
        Muestra el nombre y una breve descripción.
      */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
          Bienvenido, <span className="text-[#C01702]">{user ? `${user.nombres} ${user.apellidos}` : ''}</span>
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-300">
          Vista general de tus operaciones realizadas.
        </p>
        <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
      </div>

      {/*
        Stats Grid: Métricas rápidas de consultas realizadas.
        - Cada bloque muestra el total, tendencia y un ícono representativo.
        - Accesible y responsivo.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => {
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
            {recentSearches.map((search) => (
              <div key={search.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="rounded-full p-2 flex items-center justify-center bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702]">
                  {search.type === 'RUC' ? (
                    <Building className="h-4 w-4 text-[#C01702]" aria-hidden="true" />
                  ) : (
                    <User className="h-4 w-4 text-[#C01702]" aria-hidden="true" />
                  )}
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
            ))}
          </div>
        </div>

        {/*
          Resumen de Actividad:
          - Visualiza proporción de consultas RUC, DNI y tasa de éxito.
          - Cada bloque es accesible, con contraste y título descriptivo.
          - Porcentaje visual, leyenda y colores institucionales.
        */}
        
      </div>

    </div>
  );
}