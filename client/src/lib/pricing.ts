// Per-kg LPG prices shown on the website. Update here and rebuild to change them.
// (Product prices themselves are edited in Admin -> Products.)
export const RETAIL_PRICE_PER_KG = 1.95;
export const WHOLESALE_PRICE_PER_KG = 1.55;
export const formatUsd = (n: number) => `$${n.toFixed(2)}`;
