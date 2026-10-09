import api from "./api";

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export interface PurchaseOrder {
    id: string;
    supplier_id: string;
    order_number: string;
    status: string;
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    created_by?: string;
    created_at: string;
    received_at?: string;
    items?: PurchaseOrderItem[];
}

export interface PurchaseItemDto {
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
}

export interface CreatePurchaseDto {
    supplier_id: string;
    status?: string;
    notes?: string;
    created_by?: string;
    items: PurchaseItemDto[];
}

export const getPurchases = async (): Promise<PurchaseOrder[]> => {
    const response = await api.get("/purchases");
    return response.data;
};

export const getPurchaseById = async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
};

export const createPurchase = async (data: CreatePurchaseDto): Promise<PurchaseOrder> => {
    const response = await api.post("/purchases", data);
    return response.data;
};

export const updatePurchase = async (id: string, data: CreatePurchaseDto): Promise<PurchaseOrder> => {
    const response = await api.put(`/purchases/${id}`, data);
    return response.data;
};

export const receivePurchase = async (id: string): Promise<PurchaseOrder> => {
    const response = await api.post(`/purchases/${id}/receive`);
    return response.data;
};

export const deletePurchase = async (id: string): Promise<void> => {
    await api.delete(`/purchases/${id}`);
};