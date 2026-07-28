import { motion } from "motion/react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { HeroBackground } from "./HeroBackground";
import { HeroKanban } from "./HeroKanban";
import { PLATFORM_FACTS } from "./landingData";
import { useLandingMotion } from "./landingMotion";

export function Hero() {
  const { revealProps, reduced } = useLandingMotion();

  const kanbanReveal = {
    ...revealProps,
    transition: {
      ...revealProps.transition,
      delay: reduced ? 0 : 0.15,
    },
  };

  return (
    <section className="relative overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,1.1fr)] lg:items-center lg:gap-12">
        <motion.div className="max-w-xl" {...revealProps}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Multi-org project management
          </p>
          <h1 className="mt-4 font-landing-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Your team&apos;s workflow.{" "}
            <span className="text-primary">Not someone else&apos;s.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">
            ProjectSphere is multi-tenant project management with custom Kanban
            columns, real-time board sync, and role-based dashboards  built for
            organizations that each run work differently.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/register" size="lg">
              Get started
            </ButtonLink>
            <ButtonLink
              to="/login"
              size="lg"
              className="border-transparent bg-text-primary text-white hover:bg-text-primary/90 hover:text-white"
            >
              Sign in
            </ButtonLink>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
            {PLATFORM_FACTS.map((fact) => (
              <div key={fact.value}>
                <dt className="font-landing-display text-lg font-semibold text-text-primary sm:text-xl">
                  {fact.value}
                </dt>
                <dd className="mt-1 text-xs text-text-secondary sm:text-sm">
                  {fact.label}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div className="relative z-10" {...kanbanReveal}>
          <HeroKanban />
        </motion.div>
      </div>
    </section>
  );
}
