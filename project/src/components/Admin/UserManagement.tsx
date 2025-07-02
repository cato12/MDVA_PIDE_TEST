/**
 * Gestión y administración de usuarios del sistema.
 * Permite crear, editar, filtrar, eliminar y visualizar usuarios.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Estadísticas rápidas
 * - Filtros avanzados
 * - Tabla de usuarios
 * - Modales de edición y confirmación
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module UserManagement
 */
import { useState, useEffect, useRef } from 'react';
// Utilidades para obtener áreas y roles desde el backend
const fetchAreas = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/areas`);
    if (!res.ok) throw new Error('Error al obtener áreas');
    return await res.json();
  } catch {
    return [];
  }
};

const fetchRoles = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/roles`);
    if (!res.ok) throw new Error('Error al obtener roles');
    return await res.json();
  } catch {
    return [];
  }
};

// Utilidad para obtener cargos desde el backend, opcionalmente por área
const fetchCargos = async (areaId?: string) => {
  try {
    let url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/cargos`;
    if (areaId) url += `?area_id=${areaId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener cargos');
    return await res.json();
  } catch {
    return [];
  }
};
import {
  Users, Search, Filter, Plus, Edit, Trash2, AlertTriangle, Shield, ShieldCheck, Eye, EyeOff, UserCheck, UserX, Mail, Phone, Calendar, Building, LogIn
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

/**
 * Estructura de un usuario del sistema.
 */
interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cargo: string;
  area: string;
  role: 'trabajador' | 'administrador' | 'jefe_area';
  estado: 'activo' | 'inactivo' | 'suspendido';
  fechaIngreso: string;
  ultimoAcceso: string;
  permisos: string[];
  password?: string;
}

// Datos simulados de usuarios para demostración
const mockUsuarios: Usuario[] = [
  {
    id: '1',
    nombre: 'María Elena',
    apellidos: 'Quispe Mamani',
    email: 'mquispe@municipalidad.gob.pe',
    telefono: '987654321',
    dni: '12345678',
    cargo: 'Especialista en RRHH',
    area: 'Recursos Humanos',
    role: 'trabajador',
    estado: 'activo',
    fechaIngreso: '2023-03-15',
    ultimoAcceso: '2024-01-25T14:30:00',
    permisos: ['expedientes', 'vacaciones', 'recursos'],
    password: 'maria1234'
  },
  {
    id: '2',
    nombre: 'Carlos Alberto',
    apellidos: 'Vargas Herrera',
    email: 'cvargas@municipalidad.gob.pe',
    telefono: '987654322',
    dni: '87654321',
    cargo: 'Administrador de Sistemas',
    area: 'Sistemas',
    role: 'administrador',
    estado: 'activo',
    fechaIngreso: '2022-01-10',
    ultimoAcceso: '2024-01-25T16:45:00',
    permisos: ['todos'],
    password: 'carlos2024'
  },
  {
    id: '3',
    nombre: 'Ana Lucía',
    apellidos: 'Mendoza Torres',
    email: 'amendoza@municipalidad.gob.pe',
    telefono: '987654323',
    dni: '11223344',
    cargo: 'Contadora',
    area: 'Contabilidad',
    role: 'jefe_area',
    estado: 'activo',
    fechaIngreso: '2023-06-01',
    ultimoAcceso: '2024-01-24T11:20:00',
    permisos: ['expedientes', 'aprobaciones_area', 'reportes'],
    password: 'ana2025'
  },
  {
    id: '4',
    nombre: 'José Miguel',
    apellidos: 'Fernández Ruiz',
    email: 'jfernandez@municipalidad.gob.pe',
    telefono: '987654324',
    dni: '55667788',
    cargo: 'Ingeniero Civil',
    area: 'Obras Públicas',
    role: 'trabajador',
    estado: 'suspendido',
    fechaIngreso: '2023-09-15',
    ultimoAcceso: '2024-01-20T09:15:00',
    permisos: ['expedientes', 'recursos'],
    password: 'josemiguel'
  }
];

/**
 * Componente principal de gestión de usuarios.
 * Permite crear, editar, filtrar, eliminar y visualizar usuarios del sistema.
 */
export function UserManagement() {
  // Estado de usuarios y filtros
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(selectedUser?.password || '');
  // Estados para áreas, roles y cargos
  const [areas, setAreas] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [cargos, setCargos] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedCargoId, setSelectedCargoId] = useState<string>('');
  const [selectedRolId, setSelectedRolId] = useState<string>('');
  // Referencia al formulario para obtener valores de manera segura
  const formRef = useRef<HTMLFormElement | null>(null);
  // Cargar áreas, roles y cargos al abrir el modal de usuario
  useEffect(() => {
    if (showUserModal) {
      fetchAreas().then(data => {
        setAreas(data);
        // Si hay un usuario seleccionado, buscar cargos de su área
        if (selectedUser && data.length) {
          const areaObj = data.find((a: any) => a.nombre === selectedUser.area);
          if (areaObj) {
            setSelectedAreaId(areaObj.id);
            fetchCargos(areaObj.id).then(cgs => {
              setCargos(cgs);
              // Buscar el cargo por nombre y setear el id
              const cargoObj = cgs.find((c: any) => c.nombre === selectedUser.cargo);
              if (cargoObj) setSelectedCargoId(cargoObj.id);
            });
          } else {
            setCargos([]);
          }
        } else {
          setCargos([]);
        }
      });
      fetchRoles().then(data => {
        setRoles(data);
        if (selectedUser && data.length) {
          const rolObj = data.find((r: any) => r.nombre.toLowerCase() === selectedUser.role);
          if (rolObj) setSelectedRolId(rolObj.id);
        }
      });
      if (!selectedUser) {
        setSelectedAreaId('');
        setSelectedCargoId('');
        setSelectedRolId('');
      }
    }
  }, [showUserModal]);

  // Al abrir el modal de usuario, cargar los cargos desde la base de datos
  useEffect(() => {
    if (showUserModal) {
      fetchCargos().then((data) => {
        // Asegurarse de que los datos sean del tipo correcto
        if (Array.isArray(data)) {
          setCargos(data.filter((c) => c && c.id && c.nombre));
        } else {
          setCargos([]);
        }
      });
    }
  }, [showUserModal]);
  const { addToast } = useToast();
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Elimina un usuario del sistema.
   * @param userId - ID del usuario a eliminar
   */
  const deleteUser = (userId: string) => {
    setUsuarios((prev: Usuario[]) => prev.filter((user: Usuario) => user.id !== userId));
    addToast('Usuario eliminado correctamente', 'success');
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  /**
   * Filtra los usuarios según búsqueda, estado y rol.
   */
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch =
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.dni.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || user.estado === statusFilter;
    const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  /**
   * Devuelve el badge visual para el estado del usuario.
   * @param estado - Estado del usuario
   */
  const getStatusBadge = (estado: string) => {
    const colors = {
      activo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactivo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      suspendido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    const labels = {
      activo: 'Activo',
      inactivo: 'Inactivo',
      suspendido: 'Suspendido'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[estado as keyof typeof colors]}`}>
        {labels[estado as keyof typeof labels]}
      </span>
    );
  };

  /**
   * Devuelve el badge visual para el rol del usuario.
   * @param role - Rol del usuario
   */
  const getRoleBadge = (role: string) => {
    const colors = {
      trabajador: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      jefe_area: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      administrador: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    const labels = {
      trabajador: 'Trabajador',
      jefe_area: 'Jefe de Área',
      administrador: 'Administrador'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  /**
   * Activa o desactiva un usuario.
   * @param userId - ID del usuario
   */
  const toggleUserStatus = (userId: string) => {
    setUsuarios(prev => prev.map(user => {
      if (user.id === userId) {
        const newStatus = user.estado === 'activo' ? 'inactivo' : 'activo';
        addToast(
          `Usuario ${newStatus === 'activo' ? 'activado' : 'desactivado'} correctamente`,
          'success'
        );
        return { ...user, estado: newStatus };
      }
      return user;
    }));
  };

  /**
   * Abre el modal para crear o editar usuario.
   * @param user - Usuario a editar (opcional)
   */
  const openUserModal = (user?: Usuario) => {
    if (user) {
      setSelectedUser(user);
      setPassword(user.password || '');
      setIsEditing(true);
      // Buscar el área y cargo seleccionados
      setSelectedAreaId('');
      setSelectedCargoId(user.cargo || '');
    } else {
      setSelectedUser(null);
      setPassword('');
      setIsEditing(false);
      setSelectedAreaId('');
      setSelectedCargoId('');
    }
    setShowUserModal(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
            Gestión de <span className="text-[#C01702] font-bold">Usuarios</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-300">
            Administre usuarios, roles y permisos del sistema
          </p>
          <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
        </div>
        <button
          onClick={() => openUserModal()}
          className="bg-[#C01702] hover:bg-[#a31200] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-colors font-semibold"
        >
          <Plus className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{usuarios.length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{usuarios.filter(u => u.estado === 'activo').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios Activos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-[#C01702]">{usuarios.filter(u => u.role === 'administrador').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Administradores</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserX className="h-8 w-8 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{usuarios.filter(u => u.estado === 'suspendido').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Suspendidos</span>
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
                placeholder="Buscar por nombre, email o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-black active:border-black dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="suspendido">Suspendidos</option>
              </select>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos los roles</option>
              <option value="trabajador">Trabajadores</option>
              <option value="jefe_area">Jefes de Área</option>
              <option value="administrador">Administradores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C01702]/60 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cargo y Área
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#C01702] bg-[#F6E7E4] dark:bg-[#2A1A18]">
                          <span className="text-[#C01702] font-bold text-base">
                            {usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {usuario.nombre} {usuario.apellidos}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          DNI: {usuario.dni}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{usuario.cargo}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {usuario.area}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(usuario.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(usuario.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(usuario.ultimoAcceso).toLocaleDateString('es-PE')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openUserModal(usuario)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        title="Editar usuario"
                      >
                        <Edit className="h-4 w-4 text-[#C01702]" />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(usuario.id)}
                        className={`${
                          usuario.estado === 'activo' 
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400' 
                            : 'text-green-600 hover:text-green-900 dark:text-green-400'
                        }`}
                        title={usuario.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {usuario.estado === 'activo' ? <EyeOff className="h-4 w-4 text-red-600" /> : <Eye className="h-4 w-4 text-green-600" />}
                      </button>
                      
                      <button
                        onClick={() => { setUserToDelete(usuario); setShowDeleteModal(true); }}
                        className="text-gray-400 hover:text-[#C01702] dark:hover:text-[#C01702] focus:outline-none focus:ring-2 focus:ring-[#C01702] rounded transition"
                        title="Eliminar usuario"
                        aria-label={`Eliminar usuario ${usuario.nombre} ${usuario.apellidos}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span title="Iniciar sesión como este usuario">
                        <LogIn className="h-4 w-4 text-sky-600" />
                      </span>
      {/* Modal de confirmación de eliminación (fuera del mapeo de la tabla) */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#C01702] rounded-2xl max-w-md w-full border-2 border-[#C01702] shadow-2xl p-7 relative">
            <button
              onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
              className="absolute top-3 right-3 text-white hover:text-gray-200 text-2xl font-bold focus:outline-none"
              aria-label="Cerrar modal"
            >
              ×
            </button>
            <div className="flex flex-col items-center justify-center mb-4">
              <AlertTriangle className="h-20 w-20 text-white mb-2" />
            </div>
            <p className="text-white mb-7 text-base text-center break-words max-w-xs sm:max-w-sm md:max-w-md mx-auto">
              ¿Estás seguro de que deseas eliminar al usuario<br />
              <span className="font-semibold break-words">{userToDelete.nombre} {userToDelete.apellidos}</span>?<br />
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => deleteUser(userToDelete.id)}
                className="px-8 py-2 bg-[#C01702] hover:bg-[#a31200] text-white rounded-xl font-bold shadow flex items-center gap-3 text-lg border-2 border-white transition"
                autoFocus
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para crear/editar usuario - minimalista y corporativo */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-800">
            {/* Header minimalista */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-[#C01702] text-2xl font-bold focus:outline-none transition"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>
                <form className="px-6 py-6" ref={formRef}>
              {/* Datos personales y laborales agrupados en dos columnas en md+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Nombres</label>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={selectedUser?.nombre || ''}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 transition"
                    placeholder="Nombres"
                    aria-label="Nombres"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Apellidos</label>
                  <input
                    type="text"
                    name="apellidos"
                    defaultValue={selectedUser?.apellidos || ''}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 transition"
                    placeholder="Apellidos"
                    aria-label="Apellidos"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">DNI</label>
                  <input
                    type="text"
                    name="dni"
                    defaultValue={selectedUser?.dni || ''}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 transition"
                    placeholder="DNI"
                    aria-label="DNI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedUser?.email || ''}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 transition"
                    placeholder="Email"
                    aria-label="Email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    defaultValue={selectedUser?.telefono || ''}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 transition"
                    placeholder="Teléfono"
                    aria-label="Teléfono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-1.5 px-0 pr-8 transition"
                      placeholder="Contraseña"
                      aria-label="Contraseña"
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C01702] focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Área</label>
                  <select
                    value={selectedAreaId}
                    onChange={e => setSelectedAreaId(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white py-1.5 px-0 transition"
                    aria-label="Área"
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((area: any) => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Cargo</label>
                  <select
                    value={selectedCargoId}
                    onChange={e => setSelectedCargoId(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white py-1.5 px-0 transition"
                    aria-label="Cargo"
                  >
                    <option value="">Seleccionar cargo</option>
                    {cargos.length > 0 ? (
                      cargos.map((cargo) => (
                        <option key={cargo.id} value={cargo.id}>{cargo.nombre}</option>
                      ))
                    ) : (
                      <option value="" disabled>No hay cargos disponibles</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Rol</label>
                  <select
                    value={selectedRolId}
                    onChange={e => setSelectedRolId(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-700 focus:border-[#C01702] focus:ring-0 text-sm text-gray-900 dark:text-white py-1.5 px-0 transition"
                    aria-label="Rol"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((rol: any) => (
                      <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
                <div className="flex justify-center mt-4">
                  <button
                    type="submit"
                    onClick={async e => {
                      e.preventDefault();
                      if (!formRef.current) return;
                      const formData = new FormData(formRef.current);
                      const nombre = (formData.get('nombre') || '').toString().trim();
                      const apellidos = (formData.get('apellidos') || '').toString().trim();
                      const dni = (formData.get('dni') || '').toString().trim();
                      const email = (formData.get('email') || '').toString().trim();
                      const telefono = (formData.get('telefono') || '').toString().trim();
                      const passwordValue = password;
                      if (!nombre || !apellidos || !dni || !email || !telefono || !passwordValue || !selectedAreaId || !selectedCargoId || !selectedRolId) {
                        addToast('Completa todos los campos obligatorios', 'error');
                        return;
                      }
                      const userPayload = {
                        nombres: nombre, // Cambiado de 'nombre' a 'nombres'
                        apellidos,
                        email,
                        telefono,
                        dni,
                        cargo_id: selectedCargoId,
                        rol_id: selectedRolId,
                        password: passwordValue
                      };
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(userPayload)
                        });
                        if (res.ok) {
                          addToast('Usuario creado correctamente', 'success');
                          setShowUserModal(false);
                        } else {
                          const data = await res.json();
                          addToast(data.error || 'Error al crear usuario', 'error');
                        }
                      } catch {
                        addToast('Error de red al crear usuario', 'error');
                      }
                    }}
                    className="px-6 py-2 bg-[#C01702] hover:bg-[#a31200] text-white rounded-lg font-semibold text-base transition focus:outline-none focus:ring-2 focus:ring-[#C01702] flex items-center gap-2 shadow-none"
                  >
                    <UserCheck className="h-5 w-5 text-white" />
                    {isEditing ? 'Actualizar' : 'Crear'} Usuario
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}