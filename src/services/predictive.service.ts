// 📁 frontend/src/services/predictive.service.ts

import api from './api';

export interface DashboardMetrics {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
    criticalAlerts: Array<{
        productId: string;
        productName: string;
        currentStock: number;
        reorderPoint: number;
        urgency: 'CRITICAL' | 'WARNING' | 'INFO';
        message: string;
    }>;
    predictedSalesNextMonth: number;
}

export interface DemandPrediction {
    productId: string;
    productName: string;
    currentStock: number;
    predictedDemand: {
        nextWeek: number;
        nextMonth: number;
        nextQuarter: number;
    };
    confidence: number;
    recommendation: 'COMPRAR' | 'MANTENER' | 'REDUCIR';
}

export const predictiveService = {
    async getDashboardMetrics(): Promise<DashboardMetrics> {
        try {
            const response = await api.get('/dashboard/metrics');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            // Retornar datos por defecto en caso de error
            return {
                totalProducts: 0,
                lowStockProducts: 0,
                outOfStockProducts: 0,
                totalInventoryValue: 0,
                criticalAlerts: [],
                predictedSalesNextMonth: 0
            };
        }
    },

    async getPredictions(productId: string): Promise<DemandPrediction> {
        const response = await api.get(`/predictions/${productId}`);
        return response.data;
    },

    async getAlerts(): Promise<any[]> {
        try {
            const response = await api.get('/alerts');
            return response.data;
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    },

    async getReorderPoint(productId: string): Promise<{ productId: string; reorderPoint: number }> {
        const response = await api.get(`/reorder-point/${productId}`);
        return response.data;
    }
};