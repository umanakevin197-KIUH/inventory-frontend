import api from "./api";

export interface Invoice {
    id: string;
    invoice_number: string;
    sale_id: string;
    customer_id?: string;
    type: string;
    subtotal: number;
    tax: number;
    total: number;
    status: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface CreateInvoiceDto {
    sale_id: string;
    customer_id?: string;
    type?: string;
    notes?: string;
    created_by?: string;
}

export const getInvoices = async (): Promise<Invoice[]> => {
    const response = await api.get("/invoices");
    return response.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
};

export const createInvoice = async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await api.post("/invoices", data);
    return response.data;
};

export const cancelInvoice = async (id: string, reason: string): Promise<Invoice> => {
    const response = await api.post(`/invoices/${id}/cancel`, { reason });
    return response.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
};