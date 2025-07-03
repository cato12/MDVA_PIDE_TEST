/**
 * Panel principal de administración del sistema.
 * Muestra métricas, actividad reciente y distribución de usuarios.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Métricas rápidas
 * - Actividad reciente
 * - Distribución de usuarios por rol
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module AdminDashboard
 */
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users, Activity, Shield, AlertTriangle, BarChart3, FileText, UserCheck, Eye
} from 'lucide-react';

/**
 * Componente principal del dashboard administrativo.
 * Muestra métricas, actividad y distribución de usuarios.
 */
export function AdminDashboard() {
    const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    areaHeads: 0,
    trabajadores: 0
  });

  useEffect(() => {
    axios.get('http://localhost:4000/admin-stats') // Cambia si usas proxy o entorno de producción
      .then(res => setStats(res.data))
      .catch(err => console.error('Error al cargar métricas:', err));
  }, []);

  // Métricas principales del sistema
  const adminStats = [
    {
      title: 'Total Usuarios',
      value: stats.total,
      icon: Users,
      color: 'bg-blue-500',
      change: '',
      changeType: ''
    },
    {
      title: 'Usuarios Activos', // Aún no implementado: usando total como placeholder
      value: stats.total,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '',
      changeType: ''
    },
    {
      title: 'Usuarios Administradores',
      value: stats.admins,
      icon: Shield,
      color: 'bg-[#C01702]',
      change: '',
      changeType: ''
    },
    // {
    //   title: 'Accesos Hoy',
    //   value: 23, // Simulado o podrías traerlo desde logs más adelante
    //   icon: Eye,
    //   color: 'bg-orange-500',
    //   change: '',
    //   changeType: ''
    // }
  ];

  // Actividad reciente simulada
  const recentActivity = [
    {
      id: '1',
      type: 'Usuario',
      title: 'Nuevo usuario registrado: Ana Mendoza Torres',
      description: 'Usuario creado en el área de Contabilidad',
      time: 'Hace 1 hora',
      status: 'Completado',
      priority: 'media'
    },
    {
      id: '2',
      type: 'Sistema',
      title: 'Respaldo automático completado',
      description: 'Base de datos respaldada exitosamente',
      time: 'Hace 2 horas',
      status: 'Exitoso',
      priority: 'baja'
    },
    {
      id: '3',
      type: 'Seguridad',
      title: 'Intento de acceso fallido detectado',
      description: 'IP: 192.168.1.110 - Usuario: Pedro Ramírez',
      time: 'Hace 3 horas',
      status: 'Bloqueado',
      priority: 'alta'
    },
    {
      id: '4',
      type: 'Consulta',
      title: 'Pico de consultas RUC detectado',
      description: '156 consultas en la última hora',
      time: 'Hace 4 horas',
      status: 'Monitoreando',
      priority: 'media'
    }
  ];

  // Métricas de distribución de usuarios por rol
  const totalUsuarios = 47;
  const jefesArea = 4;
  const admins = 5;
  const trabajadores = 38 + jefesArea; // Suma jefes de área a trabajadores
  const systemMetrics = [
    {
      label: 'Trabajadores',
      value: stats.trabajadores,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.trabajadores / stats.total) * 100) : 0
    },
    {
      label: 'Administradores',
      value: stats.admins,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.admins / stats.total) * 100) : 0
    },
    {
      label: 'Jefes de Área',
      value: stats.areaHeads,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.areaHeads / stats.total) * 100) : 0
    }
  ];

  /**
   * Devuelve el badge visual para el estado de la actividad.
   * @param status - Estado de la actividad
   */
  const getStatusBadge = (status: string) => {
    const colors = {
      Completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Exitoso: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Bloqueado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      Monitoreando: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  /**
   * Devuelve el ícono correspondiente a la prioridad de la actividad.
   * @param priority - Prioridad de la actividad
   */
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'alta':
        return <AlertTriangle className="h-4 w-4 text-[#C01702]" />;
      case 'media':
        return <Activity className="h-4 w-4 text-[#C01702]" />;
      case 'baja':
        return <Shield className="h-4 w-4 text-[#C01702]" />;
      default:
        return <FileText className="h-4 w-4 text-[#C01702]" />;
    }
  };

  return (
    <div className="space-y-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
          Panel de <span className="text-[#C01702] font-bold">Administración</span>
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-300">
          Control y supervisión del sistema municipal.
        </p>
        <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {adminStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200"
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
                    {stat.change} {stat.change && 'esta semana'}
                  </p>
                </div>
                <div className="p-3 flex items-center justify-center">
                  <Icon className="h-10 w-10 text-[#C01702]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Actividad Reciente (mejorado) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Activity className="h-5 w-5 text-[#C01702]" />
            <span className="text-[#C01702]">Actividad Reciente del Sistema</span>
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C01702]/60 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow transition-shadow duration-200">
                <div className="flex-shrink-0 flex items-center justify-center rounded-full bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702] p-3">
                  {getPriorityIcon(activity.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border border-[#C01702] text-[#C01702] bg-white dark:bg-gray-900 uppercase tracking-wide">
                      {activity.type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${activity.status === 'Completado' || activity.status === 'Exitoso' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : activity.status === 'Bloqueado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
                      {activity.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-base truncate">
                      {activity.title}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Métricas del Sistema */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <BarChart3 className="h-5 w-5 text-[#C01702]" />
            <span className="text-[#C01702]">Distribución de Usuarios por Rol</span>
          </h2>
          {/*
            Sección: Distribución de usuarios por rol
            - Visualiza la proporción de trabajadores, administradores y jefes de área.
            - Cada bloque es accesible, con contraste y título descriptivo.
            - El porcentaje se muestra en grande, con barra de progreso y leyenda.
            - Colores institucionales y responsividad.
          */}
          <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Trabajadores: muestra porcentaje y cantidad */}
            <div
              className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 p-6 shadow-sm min-h-[150px]"
              aria-label="Trabajadores"
            >
              {/* Ícono representativo */}
              <div className="rounded-full bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702] p-4 mb-3 flex items-center justify-center">
                <UserCheck className="h-7 w-7 text-[#C01702]" aria-hidden="true" />
              </div>
              {/* Porcentaje visual */}
              <div className="text-3xl font-extrabold text-[#C01702] mb-1" title={`${systemMetrics[0].value} usuarios`}>
                {systemMetrics[0].percentage}%
              </div>
              {/* Leyenda y cantidad */}
              <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">{systemMetrics[0].label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                {systemMetrics[0].value} de {systemMetrics[0].total}
              </div>
              {/* Barra de progreso accesible */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" aria-label="Progreso trabajadores" role="progressbar" aria-valuenow={systemMetrics[0].percentage} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-[#C01702] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${systemMetrics[0].percentage}% `}}
                ></div>
              </div>
            </div>
            {/* Administradores: muestra porcentaje y cantidad */}
            <div
              className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 p-6 shadow-sm min-h-[150px]"
              aria-label="Administradores"
            >
              <div className="rounded-full bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702] p-4 mb-3 flex items-center justify-center">
                <Shield className="h-7 w-7 text-[#C01702]" aria-hidden="true" />
              </div>
              <div className="text-3xl font-extrabold text-[#C01702] mb-1" title={`${systemMetrics[1].value} usuarios`}>
                {systemMetrics[1].percentage}%
              </div>
              <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">{systemMetrics[1].label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                {systemMetrics[1].value} de {systemMetrics[1].total}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" aria-label="Progreso administradores" role="progressbar" aria-valuenow={systemMetrics[1].percentage} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-[#C01702] h-2 rounded-full transition-all duration-300"
                  style={{ width:` ${systemMetrics[1].percentage}%` }}
                ></div>
              </div>
            </div>
            {/* Jefes de Área: muestra porcentaje y cantidad */}
            <div
              className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-800 p-6 shadow-sm min-h-[150px]"
              aria-label="Jefes de Área"
            >
              <div className="rounded-full bg-[#F6E7E4] dark:bg-[#2A1A18] border border-[#C01702] p-4 mb-3 flex items-center justify-center">
                <Users className="h-7 w-7 text-[#C01702]" aria-hidden="true" />
              </div>
              <div className="text-3xl font-extrabold text-[#C01702] mb-1" title={`${systemMetrics[2].value} usuarios`}>
                {systemMetrics[2].percentage}%
              </div>
              <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">{systemMetrics[2].label}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                {systemMetrics[2].value} de {systemMetrics[2].total}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" aria-label="Progreso jefes de área" role="progressbar" aria-valuenow={systemMetrics[2].percentage} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="bg-[#C01702] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${systemMetrics[2].percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}