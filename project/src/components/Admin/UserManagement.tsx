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
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  Users, Search, Filter, Plus, Edit, Trash2, AlertTriangle, Shield, ShieldCheck, Eye, EyeOff, UserCheck, UserX, Mail, Phone, Calendar, Building, LogIn, FileText
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ INICIO -----

// Función utilitaria para registrar advertencias de validación en audit_logs
async function registrarAdvertenciaAuditLog({ usuario, accion, modulo, descripcion, detalles }: any) {
  try {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs/frontend-warning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, accion, modulo, descripcion, detalles })
    });
  } catch (e) {
    // No interrumpir la UX si falla el log
  }
}

// Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ INICIO -----

/**
 * Estructura de un usuario del sistema.
 */
interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  dni: string;
  cargo: string;
  area: string;
  role: 'trabajador' | 'administrador' | 'jefe_area';
  rol_id: number;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fechaIngreso: string;
  ultimoAcceso: string;
  permisos: string[];
  password?: string;
}
export function UserManagement() {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('');

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateTelefono = (telefono: string) =>
  /^\d{7,9}$/.test(telefono);

  const validateDNI = (dni: string) =>
    /^\d{8}$/.test(dni);

  const validatePassword = (password: string) =>
    password.length >= 8;

  const generarReportePDF = () => {
    const usersToReport = filteredUsuarios;
    const doc = new jsPDF('landscape');
    const img = new Image();
    img.src = '/imagenes/logo_mdva_rojo.png';

    /* img.onload = () => { */
    // Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ INICIO -----
    img.onload = async () => {
    // Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ FIN -----
      // Logo en encabezado
      doc.addImage(img, 'PNG', 14, 10, 30, 30); 

      // Título con estilo corporativo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(192, 23, 2); // color institucional rojo
      doc.text('Reporte de Usuarios', 50, 25);
      doc.setFontSize(11);
      doc.setTextColor(100);
      const fechaHora = new Date().toLocaleString('es-PE');
      doc.text(`Fecha: ${fechaHora}`, 50, 32);
      if (usuarioSesion) {
        doc.text(`Generado por: ${usuarioSesion.nombres} ${usuarioSesion.apellidos} - ${usuarioSesion.email}`, 180, 32);
      }
      // Cuerpo de tabla
      const cols = ['Nombre', 'DNI', 'Correo', 'Teléfono', 'Cargo', 'Área', 'Rol', 'Estado'];
      const rows = usersToReport.map(u => [
        `${u.nombres} ${u.apellidos}`,
        u.dni,
        u.email,
        u.telefono || '—',
        u.cargo || '—',
        u.area || '—',
        u.role ? capitalize(u.role) : 'Sin Rol',
        u.estado ? capitalize(u.estado) : 'Desconocido'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [cols],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [192, 23, 2], halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 }
        }
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(9);
        doc.setTextColor(150);

        // Texto centrado (institución)
        doc.text('Municipalidad Distrital De Vista Alegre - Sistema MDVA', pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Número de página (a la derecha)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      }
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`usuarios_${fecha}.pdf`);
      // Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ INICIO -----
      // --- Registrar log de auditoría exitoso por exportación PDF ---
      try {
        await registrarAdvertenciaAuditLog({
          usuario: usuarioSesion?.email || 'no_proporcionado',
          accion: 'Exportar PDF',
          modulo: 'usuarios',
          descripcion: 'Exportación de gestión de usuarios a PDF',
          detalles: { cantidad: filteredUsuarios.length, fecha: fechaHora }
        });
      } catch {}
// Modificación Logs de Auditoría - Advertencias - Registrar nuevo usuario (09/07/2025) ------ FIN -----
    };
  };

  // Util: capitalizar string
  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Estado de usuarios y filtros
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [totalUsuariosDB, setTotalUsuariosDB] = useState<number>(0);
  const { user: usuarioSesion } = useAuth();
  // Cargar usuarios desde el backend al montar el componente
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users`);
        if (!res.ok) throw new Error('Error al obtener usuarios');
        const data = await res.json();
        // Mapear rol_id a string de rol
        const mapRol = (rol_id: number | string) => {
          if (rol_id === 1 || rol_id === '1') return 'administrador';
          if (rol_id === 2 || rol_id === '2') return 'trabajador';
          if (rol_id === 3 || rol_id === '3') return 'jefe_area';
          return 'trabajador';
        };
        setUsuarios(data.map((u: any) => ({
          ...u,
          role: mapRol(u.rol_id),
          ultimoAcceso: u.ultimo_acceso,
        })));
        setTotalUsuariosDB(Array.isArray(data) ? data.length : 0);
      } catch {
        setUsuarios([]);
        setTotalUsuariosDB(0);
      }
    };
    fetchUsuarios();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [roleFilter, setRoleFilter] = useState('todos');
  const [estados, setEstados] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [password, setPassword] = useState('');

  const [email, setEmail] = useState('');
  //const [telefono, setTelefono] = useState('');
  //const [dni, setDni] = useState('');

  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [telefonoValid, setTelefonoValid] = useState<boolean | null>(null);
  const [dniValid, setDniValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  // Estados para áreas, roles y cargos
  const [areas, setAreas] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([]);
  // Cargar roles para el filtro al montar el componente
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/roles`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setRoles(Array.isArray(data) ? data : []))
      .catch(() => setRoles([]));
  }, []);
  const [cargos, setCargos] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedCargoId, setSelectedCargoId] = useState<string>('');
  const [selectedRolId, setSelectedRolId] = useState<string>('');
  // Referencia al formulario para obtener valores de manera segura

  const [telefono, setTelefono] = useState(selectedUser?.telefono || '');
  const [dni, setDni] = useState(selectedUser?.dni || '');

  const formRef = useRef<HTMLFormElement | null>(null);
  // Cargar áreas, roles y cargos al abrir el modal de usuario
  // Cargar estados para los filtros al montar el componente
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/estado`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setEstados(Array.isArray(data) ? data : []))
      .catch(() => setEstados([]));
  }, []);
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
          fetchCargos().then(cgs => setCargos(Array.isArray(cgs) ? cgs : []));
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

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUsuarios((prev: Usuario[]) => prev.filter((user: Usuario) => user.id !== userId));
        addToast('Usuario eliminado correctamente', 'success');
      } else {
        addToast('No se pudo eliminar el usuario', 'error');
      }
    } catch {
      addToast('Error de red al eliminar usuario', 'error');
    }
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  /**
   * Filtra los usuarios según búsqueda, estado y rol.
   */
  const normalize = (str = '') => str.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').toLowerCase();
  const filteredUsuarios = usuarios.filter(user => {
    // No mostrar usuarios eliminados
    const estadoUser = (user.estado || '').toString().trim().toLowerCase();
    if (estadoUser === 'eliminado') return false;
    const matchesSearch =
      (user.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user.dni?.includes(searchTerm) || '');
    const matchesStatus = statusFilter === 'todos' || estadoUser === statusFilter.toLowerCase();
    // El filtro de rol compara el nombre real del rol, ignorando mayúsculas y espacios
    // Buscar el nombre real del rol usando rol_id si existe, si no, usar user.role
    let userRoleName = '';
    if ('rol_id' in user && user.rol_id !== undefined) {
      userRoleName = roles.find(r => r.id === (user as any).rol_id)?.nombre || '';
    }
    if (!userRoleName) userRoleName = user.role || '';
    const matchesRole = roleFilter === 'todos' || normalize(userRoleName) === normalize(roleFilter);
    return matchesSearch && matchesStatus && matchesRole;
  });

  /**
   * Devuelve el badge visual para el estado del usuario.
   * @param estado - Estado del usuario
   */
  const getStatusBadge = (estado: string) => {
    // Normalizar el estado recibido del backend
    const estadoNorm = (estado || '').toLowerCase();
    let key: 'activo' | 'suspendido' | 'eliminado' = 'eliminado';
    if (estadoNorm === 'activo') key = 'activo';
    else if (estadoNorm === 'suspendido') key = 'suspendido';
    else if (estadoNorm === 'eliminado') key = 'eliminado';
    // Colores y etiquetas
    const colors = {
      activo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      suspendido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      eliminado: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
    };
    const labels = {
      activo: 'Activo',
      suspendido: 'Suspendido',
      eliminado: 'Eliminado'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[key]}`}>
        {labels[key]}
      </span>
    );
  };

  /**
   * Devuelve el badge visual para el rol del usuario.
   * @param role - Rol del usuario
   */
  // Badge de rol: color según valor normalizado, texto según nombre real de la base de datos
  const getRoleBadge = (role: string, rol_id?: any) => {
    // Buscar el nombre real del rol en roles
    let realName = '';
    if (rol_id !== undefined) {
      realName = roles.find(r => r.id === rol_id)?.nombre || '';
    }
    if (!realName) {
      // Si no hay rol_id, intentar buscar por nombre normalizado
      const found = roles.find(r => r.nombre && r.nombre.toLowerCase() === role?.toLowerCase());
      realName = found?.nombre || role;
    }
    // Colores según valor normalizado
    const colorMap: Record<string, string> = {
      usuario: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      trabajador: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', // por compatibilidad
      administrador: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      jefe_area: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    // Normalizar para color
    const colorKey = (realName || role || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '').toLowerCase();
    const color = colorMap[colorKey] || 'bg-gray-200 text-gray-700';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {realName}
      </span>
    );
  };

  /**
   * Activa o desactiva un usuario.
   * @param userId - ID del usuario
   */
  // Cambia el estado del usuario entre 'activo' y 'suspendido' en la base de datos y en el frontend
  const toggleUserStatus = async (userId: string) => {
    const user = usuarios.find(u => u.id === userId);
    if (!user) return;
    const nuevoEstado = (user.estado || '').toLowerCase() === 'activo' ? 'suspendido' : 'activo';
    if (usuarioSesion?.id === userId) {
      addToast('❌ No puedes cambiar tu propio estado', 'error');
      return;
    }
    // 1. Actualización optimista
    setUsuarios(prev =>
      prev.map(u => u.id === userId ? { ...u, estado: nuevoEstado } : u)
    );

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users/${userId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, solicitante: usuarioSesion?.id })
      });
      if (!res.ok) {
        // Si falló, deshacer la actualización optimista
        setUsuarios(prev =>
          prev.map(u => u.id === userId ? { ...u, estado: user.estado } : u)
        );
        const error = await res.json();
        addToast(error?.error || 'No se pudo cambiar el estado del usuario', 'error');
      } else {
        addToast(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'suspendido'} correctamente`, 'success');
      }
    } catch {
      // Deshacer si hay error de red
      setUsuarios(prev =>
        prev.map(u => u.id === userId ? { ...u, estado: user.estado } : u)
      );
      addToast('Error de red al cambiar estado', 'error');
    }
  };

  
  /**
   * Abre el modal para crear o editar usuario.
   * @param user - Usuario a editar (opcional)
   */
  const openUserModal = (user?: Usuario) => {
    if (user) {
      setSelectedUser(user);
      setIsEditing(true);
      setSelectedAreaId('');
      setSelectedCargoId(user.cargo || '');
      setDni(user.dni || '');
      setTelefono(user.telefono || '');
    } else {
      setSelectedUser(null);
      setIsEditing(false);
      setSelectedAreaId('');
      setSelectedCargoId('');
      setSelectedRolId('');
      setDni('');
      setTelefono('');
    }
    setShowUserModal(true);
  };

  // Sincronizar el campo contraseña cada vez que se selecciona un usuario para editar y se abre el modal
  useEffect(() => {
    if (showUserModal) {
      if (selectedUser && isEditing) {
        // Si el usuario tiene password, úsalo; si no, pon cadena vacía
        setPassword(selectedUser.password ?? '');
      } else if (!selectedUser && !isEditing) {
        setPassword('');
      }
    }
  }, [showUserModal, selectedUser, isEditing]);

  useEffect(() => {
    if (isEditing) {
      setPassword('');
    }
  }, [isEditing, selectedUser]);

  useEffect(() => {
    if (isEditing && selectedUser) {
      setEmail(selectedUser.email || '');
    }
  }, [isEditing, selectedUser]);


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
        <div className="flex gap-3">
          <button
            onClick={() => openUserModal()}
            className="bg-[#C01702] hover:bg-[#a31200] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-colors font-semibold"
          >
            <Plus className="h-5 w-5" />
            Nuevo Usuario
          </button>
          <button
            onClick={generarReportePDF}
            className="bg-white border border-[#C01702] text-[#C01702] hover:bg-[#C01702] hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-colors font-semibold"
          >
            <FileText className="h-5 w-5" />
            Reporte PDF
          </button>
        </div>
      </div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsuariosDB}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Usuarios</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{usuarios.filter(u => (u.estado || '').toLowerCase() === 'activo').length}</span>
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
            <span className="text-2xl font-bold text-red-600">{usuarios.filter(u => (u.estado || '').toLowerCase() === 'suspendido').length}</span>
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
                {(Array.isArray(estados) ? estados : []).filter((e: {nombre: string}) => (e.nombre || '').toLowerCase() !== 'eliminado').map((estado: {id: number, nombre: string}) => (
                  <option key={estado.id} value={estado.nombre.toLowerCase()}>{estado.nombre.charAt(0).toUpperCase() + estado.nombre.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.nombre.toLowerCase()}>{rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).toLowerCase()}</option>
              ))}
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
                            {(usuario.nombres?.charAt(0) || '')}{(usuario.apellidos?.charAt(0) || '')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {usuario.nombres} {usuario.apellidos}
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
                    <div className="text-sm text-gray-900 dark:text-white">
                      {usuario.cargo}
                      {usuario.area ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">/ {usuario.area}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(usuario.role ?? '', (usuario as any).rol_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge((usuario.estado || '').toLowerCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {(() => {
                        if (!usuario.ultimoAcceso) {
                          return <span className="text-red-500 font-medium">Nunca</span>;
                        }
                        const accesoDate = new Date(usuario.ultimoAcceso);
                        const hoy = new Date();
                        const diffDias = Math.floor((hoy.getTime() - accesoDate.getTime()) / (1000 * 60 * 60 * 24));

                        const estilo =
                          diffDias === 0 ? 'text-green-600 font-semibold'
                          : diffDias <= 3 ? 'text-yellow-500'
                          : 'text-gray-500';

                        const fechaFormateada = accesoDate.toLocaleDateString('es-PE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        });

                        return <span className={estilo}>{fechaFormateada}</span>;
                      })()}
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
                        className={`$
                          {(usuario.estado || '').toLowerCase() === 'activo'
                            ? 'text-green-600 hover:text-green-900 dark:text-green-400'
                            : 'text-red-600 hover:text-red-900 dark:text-red-400'}
                        }`}
                        title={(usuario.estado || '').toLowerCase() === 'activo' ? 'Suspender usuario' : 'Activar usuario'}
                      >
                        {(usuario.estado || '').toLowerCase() === 'activo'
                          ? <Eye className="h-4 w-4 text-green-600" />
                          : <EyeOff className="h-4 w-4 text-red-600" />}
                      </button>
                      
                      <button
                        onClick={() => { setUserToDelete(usuario); setShowDeleteModal(true); }}
                        className="text-gray-400 hover:text-[#C01702] dark:hover:text-[#C01702] focus:outline-none focus:ring-2 focus:ring-[#C01702] rounded transition"
                        title="Eliminar usuario"
                        aria-label={`Eliminar usuario ${usuario.nombres} ${usuario.apellidos}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {/* Icono de iniciar sesión eliminado por requerimiento */}
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
              <span className="font-semibold break-words">{userToDelete.nombres} {userToDelete.apellidos}</span>?<br />
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
                    defaultValue={selectedUser?.nombres || ''}
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
                    value={dni}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,8}$/.test(val)) {
                        setDni(val);
                        setDniValid(validateDNI(val));
                      }
                    }}
                    className={`w-full bg-transparent border-0 border-b text-sm py-1.5 px-0 transition 
                      ${dniValid === null 
                        ? 'border-gray-300 dark:border-gray-700' 
                        : dniValid 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-red-500 focus:ring-red-500'} 
                      text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 
                      focus:outline-none focus:ring-2`}
                    placeholder="DNI"
                    aria-label="DNI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        setEmailValid(validateEmail(val));
                      }}
                      className={`w-full bg-transparent border-0 border-b text-sm py-1.5 px-0 transition ${
                        emailValid === null
                          ? 'border-gray-300 dark:border-gray-700'
                          : emailValid
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-red-500 focus:ring-red-500'
                      } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2`}
                      placeholder="Email"
                      aria-label="Email"
                    />
                  </div>

                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-0.5">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={telefono}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d{0,9}$/.test(val)) {
                        setTelefono(val);
                        setTelefonoValid(validateTelefono(val));
                      }
                    }}
                    className={`w-full bg-transparent border-0 border-b text-sm py-1.5 px-0 transition
                      ${telefonoValid === null
                        ? 'border-gray-300 dark:border-gray-700' 
                        : telefonoValid 
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-red-500 focus:ring-red-500'}
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 
                        focus:outline-none focus:ring-2`}
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
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassword(val);
                        setPasswordValid(validatePassword(val));
                      }}
                      className={`w-full bg-transparent border-0 border-b pr-8 text-sm py-1.5 px-0 transition 
                        ${passwordValid === null 
                          ? 'border-gray-300 dark:border-gray-700' 
                          : passwordValid 
                          ? 'border-green-500 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'} 
                        text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 
                        focus:outline-none focus:ring-2`}
                      
                      placeholder="Contraseña"
                      aria-label="Contraseña"
                      autoComplete="new-password"
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

                      if (!nombre || !apellidos || !dni || !email || !telefono || !selectedAreaId || !selectedCargoId || !selectedRolId) {
                        addToast('Completa todos los campos obligatorios', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'Campos obligatorios incompletos',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { nombre, apellidos, dni, email, telefono, selectedAreaId, selectedCargoId, selectedRolId }
                        });
                        return;
                      }

                      if (dni.length !== 8 || !/^\d{8}$/.test(dni)) {
                        addToast('El DNI debe tener exactamente 8 dígitos numéricos', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'DNI inválido',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { dni, email }
                        });
                        return;
                      }

                      if (telefono.length < 7 || telefono.length > 9 || !/^\d+$/.test(telefono)) {
                        addToast('El teléfono debe tener entre 7 y 9 dígitos numéricos', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'Teléfono inválido',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { telefono, email }
                        });
                        return;
                      }

                      const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
                      if (!nombreRegex.test(nombre)) {
                        addToast('El nombre solo debe contener letras y espacios', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'Nombre inválido',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { nombre, email }
                        });
                        return;
                      }

                      if (!nombreRegex.test(apellidos)) {
                        addToast('El apellido solo debe contener letras y espacios', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'Apellido inválido',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { apellidos, email }
                        });
                        return;
                      }

                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(email)) {
                        addToast('Correo electrónico no válido', 'error');
                        registrarAdvertenciaAuditLog({
                          usuario: email || 'no_proporcionado',
                          accion: 'Email inválido',
                          modulo: 'usuarios',
                          descripcion: 'Validación Frontend',
                          detalles: { email }
                        });
                        return;
                      }

                      const userPayload = {
                        nombres: nombre,
                        apellidos,
                        email,
                        telefono,
                        dni,
                        cargo_id: selectedCargoId,
                        rol_id: selectedRolId,
                        area_id: selectedAreaId
                      };

                      if (!isEditing) {
                        // Crear usuario
                        const createPayload = { ...userPayload, password: passwordValue };
                        setShowUserModal(false);
                        try {
                          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(createPayload)
                          });
                          if (res.ok) {
                            const responseData = await res.json();
                            const newUser = responseData.user;
                            const cargoNombre = cargos.find(c => String(c.id) === String(selectedCargoId))?.nombre ?? '';
                            const areaNombre = areas.find(a => String(a.id) === String(selectedAreaId))?.nombre ?? '';
                            const rolNombre = roles.find(r => String(r.id) === String(selectedRolId))?.nombre.toLowerCase() as Usuario['role'];
                            const usuarioAgregado: Usuario = {
                              id: String(newUser.id),
                              nombres: nombre,
                              apellidos,
                              email,
                              telefono,
                              dni,
                              cargo: cargoNombre,
                              area: areaNombre,
                              role: rolNombre,
                              rol_id: parseInt(selectedRolId, 10),
                              estado: 'activo',
                              fechaIngreso: '',
                              ultimoAcceso: '',
                              permisos: [],
                            };
                            setUsuarios(prev => [...prev, usuarioAgregado]);
                            setDni('');
                            setTelefono('');
                            setPassword('');
                            setShowUserModal(false);
                            addToast('Usuario creado correctamente', 'success');
                          } else {
                            const data = await res.json();
                            addToast(data.error || 'Error al crear usuario', 'error');
                          }
                        } catch {
                          addToast('Error de red al crear usuario', 'error');
                        }
                      } else {
                        // Editar usuario
                        try {
                          const esAutoedicion = usuarioSesion?.id === selectedUser?.id;
                          if (esAutoedicion && parseInt(selectedRolId, 10) !== selectedUser?.rol_id) {
                            addToast('No puedes cambiar tu propio rol', 'error');
                            return;
                          }

                          const userPayloadFinal: Record<string, any> = {
                            ...userPayload,
                            solicitante: usuarioSesion?.id
                          };
                          if (estadoSeleccionado) {
                            userPayloadFinal.estado = estadoSeleccionado;
                          }
                          if (passwordValue && passwordValue.trim() !== '') {
                            userPayloadFinal.password = passwordValue.trim();
                          }
                          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/users/${selectedUser?.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userPayloadFinal)
                          });                          
                          if (res.ok) {
                            addToast('Usuario actualizado correctamente', 'success');
                            setShowUserModal(false);

                            const rolNombre = roles.find(r => String(r.id) === String(selectedRolId))?.nombre.toLowerCase() as Usuario['role'];
                            const cargoNombre = cargos.find(c => String(c.id) === String(selectedCargoId))?.nombre ?? '';
                            const areaNombre = areas.find(a => String(a.id) === String(selectedAreaId))?.nombre ?? '';

                            setUsuarios(prev =>
                              prev.map(u =>
                                u.id === selectedUser?.id
                                  ? {
                                      ...u,
                                      nombres: userPayload.nombres,
                                      apellidos: userPayload.apellidos,
                                      email: userPayload.email,
                                      telefono: userPayload.telefono,
                                      dni: userPayload.dni,
                                      role: rolNombre,
                                      rol_id: parseInt(selectedRolId, 10),
                                      cargo: cargoNombre,
                                      area: areaNombre
                                    }
                                  : u
                              )
                            );
                            setPassword('');
                          } else {
                            const data = await res.json();
                            if (res.status === 403 && data.error?.includes('rol')) {
                              addToast('🚫 No puedes cambiar tu propio rol mientras estás autenticado.', 'error');
                            } else {
                              addToast(data.error || 'Error al actualizar usuario', 'error');
                            }
                          }
                          
                        } catch {
                          addToast('Error de red al actualizar usuario', 'error');
                        }
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