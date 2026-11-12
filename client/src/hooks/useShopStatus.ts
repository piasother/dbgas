import { useQuery } from '@tanstack/react-query';

// Online ordering is switched on/off on the server with the ORDERS_OPEN
// environment variable (cPanel > Setup Node.js App). Until the server says
// ordering is open, the site treats it as paused.
export function useShopStatus() {
  const { data } = useQuery<{ ordersOpen: boolean }>({
    queryKey: ['/api/shop-status'],
    staleTime: 60_000,
  });
  return { ordersOpen: data?.ordersOpen === true };
}

export const ORDER_PHONE_DISPLAY = '071 331 4920';
export const ORDER_PHONE_TEL = '+263713314920';
export const whatsappOrderUrl = (item?: string) =>
  'https://wa.me/263713314920?text=' +
  encodeURIComponent(item ? `Hi DB Gas, I'd like to order: ${item}. What is today's price?` : "Hi DB Gas, I'd like to place an order. What is today's price?");
