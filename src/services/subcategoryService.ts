import api from "./api";

export const getSubcategoriesByCategory =
async (categoryId: string) => {

  const response = await api.get(

    `/subcategories/by-category/${categoryId}`

  );

  return response.data;

};

export const getSubcategories =
async () => {

  const response = await api.get(

    "/subcategories"

  );

  return response.data;

};

export const createSubcategory =
async (

  data: Record<string, unknown>

) => {

  const response = await api.post(

    "/subcategories",

    data

  );

  return response.data;

};

export const updateSubcategory =
async (

  id: string,

  data: Record<string, unknown>

) => {

  const response = await api.put(

    `/subcategories/${id}`,

    data

  );

  return response.data;

};