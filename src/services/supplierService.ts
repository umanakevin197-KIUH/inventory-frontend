import api from "./api";

export interface Supplier {
    id: string;
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    contact_name?: string;
    rating?: number;
    payment_terms?: string;
    notes?: string;
    status: boolean;
    created_at: string;
    updated_at?: string;
}

export interface CreateSupplierDto {
    name: string;
    ruc?: string;
    phone?: string;
    email?: string;
    address?: string;
    contact_name?: string;
    rating?: number;
    payment_terms?: string;
    notes?: string;
    status?: boolean;
}

export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get("/suppliers");
    return response.data;
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
};

export const createSupplier = async (data: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.post("/suppliers", data);
    return response.data;
};

export const updateSupplier = async (id: string, data: CreateSupplierDto): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
};