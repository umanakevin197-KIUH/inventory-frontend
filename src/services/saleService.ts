import api from "./api";

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    original_price?: number;
    discount?: number;
    total: number;
}

export interface Sale {
    id: string;
    sale_number: string;
    customer_id?: string;
    customer_name_optional?: string;
    subtotal: number;
    tax: number;
    total: number;
    total_paid?: number;
    balance_due?: number;
    payment_method: string;
    payment_status: string;
    sale_type?: string;
    delivery_status?: string;
    due_date?: string;
    next_payment_date?: string;
    notification_days_before?: number;
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
    original_price?: number;
    discount?: number;
}

export interface CreateSaleDto {
    customer_id?: string;
    customer_name_optional?: string;
    payment_method: string;
    payment_status?: string;
    sale_type?: string;
    due_date?: string;
    next_payment_date?: string;
    notification_days_before?: number;
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