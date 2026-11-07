import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { Layout } from '@/components/Layout';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';
import { About } from '@/components/About';
import { Services } from '@/components/Services';
import { Shop } from '@/components/Shop';
import { Accessories } from '@/components/Accessories';
import { Commercial } from '@/components/Commercial';
import { Safety } from '@/components/Safety';
import { Contact } from '@/components/Contact';

// Shows the result after Paynow sends the customer back to the site.
function usePaymentResult() {
  const { toast } = useToast();
  const { clearCart } = useCart();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    const order = params.get('order');
    const ref = order ? ` (order #${order})` : '';
    if (payment === 'success') {
      clearCart();
      toast({ title: 'Payment received', description: `Thank you! Your payment was confirmed${ref}. We'll be in touch about delivery.` });
    } else if (payment === 'pending') {
      clearCart();
      toast({ title: 'Payment being confirmed', description: `We're waiting for Paynow to confirm your payment${ref}. You can check its status under My Account.` });
    } else if (payment === 'failed') {
      toast({ title: 'Payment not completed', description: `Your payment was cancelled or declined${ref}. Your cart is still saved, so you can try again.`, variant: 'destructive' });
    } else {
      toast({ title: 'Something went wrong', description: 'We could not confirm your payment. Please contact us on WhatsApp 0713 314 920.', variant: 'destructive' });
    }
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  usePaymentResult();
  return (
    <Layout>
      <Hero />
      <Stats />
      <About />
      <Services />
      <Shop />
      <Accessories />
      <Commercial />
      <Safety />
      <Contact />
    </Layout>
  );
}
