import { Hero } from '@/components/hero';
import { Features } from '@/components/features';
import { HowItWorks } from '@/components/how-it-works';
import { Impact } from '@/components/impact';
import { CTA } from '@/components/cta';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <Impact />
      <CTA />
    </div>
  );
}