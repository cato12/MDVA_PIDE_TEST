// utils/session.js
// Utilidad para saber si la sesión es activa en el frontend

export function isSessionActive() {
  // Busca un token en localStorage (puedes cambiar a cookies si usas cookies)
  const token = localStorage.getItem('token');
  if (!token) return false;
  // Opcional: podrías decodificar el token y verificar expiración
  // Si usas JWT, puedes usar jwt-decode
  return true;
}
