import api from "./api";

export const getCategories =
async () => {

  const response =

  await api.get("/categories");

  return response.data;
};

export const createCategory =
async (
  data: Record<string, unknown>
) => {

  const response =

  await api.post(
    "/categories",
    data
  );

  return response.data;
};

export const updateCategory =
async (
  id: string,
  data: Record<string, unknown>
) => {

  const response =

  await api.put(
    `/categories/${id}`,
    data
  );

  return response.data;
};