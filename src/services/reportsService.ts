import api from "./api";

export const getReportData = async () => {

  const [
    products,
    users,
    movements,
    categories,
  ] = await Promise.all([
    api.get("/products"),
    api.get("/users"),
    api.get("/inventory_movements"),
    api.get("/categories"),
  ]);

  


  return {
    products: products.data,
    users: users.data,
    movements: movements.data,
    categories: categories.data,
  };

};