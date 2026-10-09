import api from "./api";

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface Sale {
    id: string;
    sale_number: string;
    customer_id?: string;
    subtotal: number;
    tax: number;
    total: number;
    payment_method: string;
    payment_status: string;
    due_date?: string;
    paid_at?: string;
    status: string;
    created_by?: string;
    created_at: string;
    items?: SaleItem[];
}

export interface SaleItemDto {
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
}

export interface CreateSaleDto {
    customer_id?: string;
    payment_method: string;
    payment_status?: string;
    due_date?: string;
    status?: string;
    created_by?: string;
    items: SaleItemDto[];
}

export const getSales = async (): Promise<Sale[]> => {
    const response = await api.get("/sales");
    return response.data;
};

export const getSaleById = async (id: string): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
};

export const getPendingCredits = async (): Promise<Sale[]> => {
    const response = await api.get("/sales/pending-credits");
    return response.data;
};

export const getOverdueCredits = async (): Promise<Sale[]> => {
    const response = await api.get("/sales/overdue-credits");
    return response.data;
};

export const createSale = async (data: CreateSaleDto): Promise<Sale> => {
    const response = await api.post("/sales", data);
    return response.data;
};

export const registerPayment = async (id: string): Promise<Sale> => {
    const response = await api.post(`/sales/${id}/pay`);
    return response.data;
};

export const deleteSale = async (id: string): Promise<void> => {
    await api.delete(`/sales/${id}`);
};