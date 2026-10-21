// ✅ Formatea un número forzando el formato de Nicaragua (C$)
export const formatCurrency = (value: number | string): string => {
    const num = Number(value);
    if (isNaN(num)) return "0.00";

    // ✅ Forzamos 'es-NI' (Español - Nicaragua) para que el navegador 
    // sepa exactamente qué formato usar, sin importar la región del usuario.
    return num.toLocaleString("es-NI", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};