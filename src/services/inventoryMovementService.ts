import api from "./api";

export const getInventoryMovements =
async () => {

  const response =
  await api.get("/inventory_movements");

  return response.data;
};

export const createInventoryMovement =
async (data: Record<string, unknown>) => {

  const response =
  await api.post(
    "/inventory_movements",
    data
  );

  return response.data;
};

