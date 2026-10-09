import api from "./api";

export interface Payroll {
    id: string;
    employee_id: string;
    period: string;
    base_salary: number;
    bonuses: number;
    bonus_description?: string;
    deductions: number;
    deduction_description?: string;
    net_salary: number;
    payment_method: string;
    status: string;
    paid_at?: string;
    created_by?: string;
    created_at: string;
    employee_name?: string;
    employee_position?: string;
}

export interface CreatePayrollDto {
    employee_id: string;
    period: string;
    base_salary: number;
    bonuses?: number;
    bonus_description?: string;
    deductions?: number;
    deduction_description?: string;
    payment_method?: string;
    status?: string;
    created_by?: string;
}

export const getPayrolls = async (): Promise<Payroll[]> => {
    const response = await api.get("/payroll");
    return response.data;
};

export const getPayrollById = async (id: string): Promise<Payroll> => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
};

export const getPayrollsByEmployee = async (employeeId: string): Promise<Payroll[]> => {
    const response = await api.get(`/payroll/employee/${employeeId}`);
    return response.data;
};

export const createPayroll = async (data: CreatePayrollDto): Promise<Payroll> => {
    const response = await api.post("/payroll", data);
    return response.data;
};

export const deletePayroll = async (id: string): Promise<void> => {
    await api.delete(`/payroll/${id}`);
};