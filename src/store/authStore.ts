import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const saveToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getUser = (): TokenPayload | null => {

  const token = getToken();

  if (!token) {
    return null;
  }

  try {

    return jwtDecode<TokenPayload>(token);

  } catch {

    return null;
  }
};