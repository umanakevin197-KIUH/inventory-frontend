import { Navigate } from "react-router-dom";
import { getToken } from "../store/authStore";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({
  children,
}: Props) {

  const token = getToken();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}