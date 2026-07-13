import { PublicHeader } from "@/components/layout/PublicHeader";
import { ClientPortalSection } from "./ClientPortalSection";
import { FeaturesSection } from "./FeaturesSection";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { ProblemSection } from "./ProblemSection";
import { RolesSection } from "./RolesSection";
import { SecuritySection } from "./SecuritySection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <PublicHeader />

      <main>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Hero />
        </div>

        <ProblemSection />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <FeaturesSection />
          <RolesSection />
          <ClientPortalSection />
          <SecuritySection />
          <FinalCta />
          <LandingFooter />
        </div>
      </main>
    </div>
  );
}
