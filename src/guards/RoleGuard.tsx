import { Navigate } from "react-router-dom";
import { getUser } from "../store/authStore";

interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({
  children,
  allowedRoles,
}: Props) {

  const user = getUser();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // ✅ Normalizar el rol (ADMIN = ADMINISTRADOR)
  const userRole = (user.role || "").toUpperCase();

  // ✅ Verificar si el rol del usuario está permitido
  // Acepta tanto "ADMIN" como "ADMINISTRADOR"
  const hasAccess = allowedRoles.some(role => {
    const allowedRole = role.toUpperCase();
    
    // Coincidencia exacta
    if (userRole === allowedRole) return true;
    
    // ADMIN es equivalente a ADMINISTRADOR
    if (allowedRole === "ADMIN" && userRole === "ADMINISTRADOR") return true;
    if (allowedRole === "ADMINISTRADOR" && userRole === "ADMIN") return true;
    
    return false;
  });

  if (!hasAccess) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}