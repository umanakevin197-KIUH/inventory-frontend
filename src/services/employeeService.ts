import api from "./api";

export interface Employee {
    id: string;
    name: string;
    position?: string;
    salary: number;
    hire_date?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: boolean;
    created_at: string;
}

export interface CreateEmployeeDto {
    name: string;
    position?: string;
    salary?: number;
    hire_date?: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: boolean;
}

export const getEmployees = async (): Promise<Employee[]> => {
    const response = await api.get("/employees");
    return response.data;
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};

export const createEmployee = async (data: CreateEmployeeDto): Promise<Employee> => {
    const response = await api.post("/employees", data);
    return response.data;
};

export const updateEmployee = async (id: string, data: CreateEmployeeDto): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
};