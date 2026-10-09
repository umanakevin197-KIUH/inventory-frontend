import api from "./api";

export interface Customer {
    id: string;
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: boolean;
    created_at: string;
}

export interface CreateCustomerDto {
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: boolean;
}

export const getCustomers = async (): Promise<Customer[]> => {
    const response = await api.get("/customers");
    return response.data;
};

export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.post("/customers", data);
    return response.data;
};

export const updateCustomer = async (id: string, data: CreateCustomerDto): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
};