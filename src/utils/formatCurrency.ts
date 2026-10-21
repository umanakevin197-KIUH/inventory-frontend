// ✅ Formato de moneda 100% manual (evita que el navegador agregue "dólares")
export const formatCurrency = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "0.00";

    // 1. Forzamos 2 decimales con toFixed
    const fixedNum = num.toFixed(2);
    
    // 2. Separamos la parte entera de los decimales
    const parts = fixedNum.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // 3. Agregamos las comas a la parte entera manualmente
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 4. Retornamos todo junto
    return `${formattedInteger}.${decimalPart}`;
};