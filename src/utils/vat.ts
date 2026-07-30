export const VAT_RATE = 15;

export const calculateVAT = (price: number) => {
  const vatAmount = price * (15 / 115);
  const subtotal = price - vatAmount;
  return {
    vatAmount,
    subtotal,
    total: price
  };
};

export const formatPrice = (amount: number) => {
  return `R${amount.toFixed(2)}`;
};

export const getPriceBreakdown = (sellingPrice: number) => {
  const vatAmount = sellingPrice * (15 / 115);
  const subtotal = sellingPrice - vatAmount;
  return {
    sellingPrice,
    vatAmount,
    subtotal,
    vatRate: VAT_RATE
  };
};