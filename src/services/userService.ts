import api from "./api";


interface Users {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
  status?: boolean;
}

export const getUsers = async () => {

  const response = await api.get(

    "/users"

  );

  return response.data;

};

export const createUser = async (

  data: Users

) => {

  const response = await api.post(

    "/users",

    data

  );

  return response.data;

};

export const updateUser = async (

  id: string,

  data: Users

) => {

  const response = await api.put(

    `/users/${id}`,

    data

  );

  return response.data;

};
export const resetPassword =
  async (id: string) => {

    const response =
      await api.put(
        `/users/${id}/reset-password`
      );

    return response.data;

};