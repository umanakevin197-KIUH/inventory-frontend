// ✅ Formatea un número para que use coma en los miles y punto en los decimales
// Ejemplo: 23000.5 -> "23,000.50"
export const formatCurrency = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "0.00";

    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};