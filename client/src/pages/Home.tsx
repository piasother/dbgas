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

export function Home() {
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
