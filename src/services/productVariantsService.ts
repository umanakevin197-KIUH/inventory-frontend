import api from "./api";

export const getProductVariants =
async () => {

  const response =
    await api.get("/product_variants");

  return response.data;
};

export const createProductVariant =
async (data: Record<string, unknown>) => {

  const response =
    await api.post(
      "/product_variants",
      data
    );

  return response.data;
};

export const updateProductVariant =
async (
  id: string,
  data: Record<string, unknown>
) => {

  const response =
    await api.put(
      `/product_variants/${id}`,
      data
    );

  return response.data;
};