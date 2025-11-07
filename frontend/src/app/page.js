"use client";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HyperliquidStats } from "@/components/landing/HyperliquidStats";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SupportedDexes } from "@/components/landing/SupportedDexes";
import { Testimonials } from "@/components/landing/Testimonials";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <HyperliquidStats />
      <HowItWorks />
      <SupportedDexes />
      <Testimonials />
      <CallToAction />
      <Footer />
    </main>
  );
}
