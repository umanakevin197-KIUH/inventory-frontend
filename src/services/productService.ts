import api from "./api";


export const getProducts = async () => {

    const response = await api.get(
        "/products"
    );
    return response.data;
    };

    export interface CreateProductDto {
        category_id: string;
        subcategory_id: string;
        name: string;
        description: string;
        status: boolean;
        created_at: string;
        price: number;
        stock: number;
    }

    export const createProduct = async (
        data: CreateProductDto

        ) => {

            const response = await api.post(
                "/products",
                data
                );

                return response.data;
            };

    export const updateProduct = async (
        id: string,
        data: unknown
    ) => {

        const response = await api.put(
            `/products/${id}`,
            data
        );

        return response.data;
    };

    export const deleteProduct = async  (id: string) => {
        const response = await api.delete(
            `/products/${id}`
        );

    return response.data;
}