import api from "./api";

export interface ABCAnalysis {
    category: 'A' | 'B' | 'C';
    productId: string;
    productName: string;
    value: number;
    percentage: number;
    cumulativePercentage: number;
    stock: number;
    price: number;
    totalSold: number;
}

export interface EOQAnalysis {
    productId: string;
    productName: string;
    annualDemand: number;
    orderCost: number;
    holdingCost: number;
    eoq: number;
    ordersPerYear: number;
    reorderPoint: number;
    currentStock: number;
    status: 'CRITICAL' | 'LOW' | 'NORMAL';
}

export interface Profitability {
    productId: string;
    productName: string;
    category: string;
    price: number;
    estimatedCost: number;
    margin: number;
    marginPercentage: number;
    totalSold: number;
    totalRevenue: number;
    totalProfit: number;
}

export const getABCAnalysis = async (): Promise<ABCAnalysis[]> => {
    const response = await api.get("/intelligence/abc");
    return response.data;
};

export const getEOQAnalysis = async (): Promise<EOQAnalysis[]> => {
    const response = await api.get("/intelligence/eoq");
    return response.data;
};

export const getProfitability = async (): Promise<Profitability[]> => {
    const response = await api.get("/intelligence/profitability");
    return response.data;
};