import api from "./api";

// ============================================
// TIPOS
// ============================================
export interface CreditPayment {
    id: string;
    sale_id: string;
    amount: number;
    payment_method: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface RegisterPaymentDto {
    sale_id: string;
    amount: number;
    payment_method?: string;
    notes?: string;
}

// ✅ Venta con saldo pendiente (crédito o apartado)
export interface PendingSale {
    id: string;
    sale_number: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_name_optional?: string;
    sale_type: "NORMAL" | "APARTADO" | "CREDITO";
    subtotal: number;
    tax: number;
    total: number;
    total_paid: number;
    balance_due: number;
    payment_method?: string;
    payment_status: string;
    delivery_status: string;
    next_payment_date?: string;
    notification_days_before?: number;
    reservation_expires_at?: string;
    created_by?: string;
    created_at: string;
}

// ✅ Respuesta al cancelar un apartado
export interface CancelReservationResponse {
    message: string;
}

// ============================================
// ENDPOINTS
// ============================================

// ✅ Registrar un abono
export const registerPayment = async (
    data: RegisterPaymentDto
): Promise<CreditPayment> => {
    const response = await api.post<CreditPayment>("/credit_payments", data);
    return response.data;
};

// ✅ Obtener abonos de una venta
export const getPaymentsBySale = async (
    saleId: string
): Promise<CreditPayment[]> => {
    const response = await api.get<CreditPayment[]>(
        `/credit_payments/sale/${saleId}`
    );
    return response.data;
};

// ✅ Obtener ventas con saldo pendiente (créditos y apartados)
export const getPendingSales = async (): Promise<PendingSale[]> => {
    const response = await api.get<PendingSale[]>("/sales/pending");
    return response.data;
};

// ✅ Cancelar un apartado
export const cancelReservation = async (
    saleId: string
): Promise<CancelReservationResponse> => {
    const response = await api.post<CancelReservationResponse>(
        `/sales/${saleId}/cancel-reservation`
    );
    return response.data;
};

export interface UpdateDateResponse {
    message: string;
}

// ✅ Actualizar fecha de pago
export const updatePaymentDate = async (
    saleId: string,
    newDate: string
): Promise<UpdateDateResponse> => {
    const response = await api.put<UpdateDateResponse>(
        `/sales/${saleId}/payment-date`,
        { new_date: newDate }
    );
    return response.data;
};