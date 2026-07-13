import { motion } from "motion/react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useLandingMotion } from "./landingMotion";

export function FinalCta() {
  const { revealProps } = useLandingMotion();

  return (
    <section className="py-16 sm:py-24">
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-16"
        {...revealProps}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, hsl(var(--accent) / 1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.85) 0%, transparent 45%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-landing-display text-3xl font-semibold text-primary-foreground sm:text-4xl">
            Define your workflow. Invite your team.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-primary-foreground/85">
            Create your organization, set up custom Kanban templates, and start
            coordinating work the way your team actually runs it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink
              to="/register"
              size="lg"
              className="bg-surface-raised text-text-primary hover:bg-surface shadow-md"
            >
              Get started free
            </ButtonLink>
            <ButtonLink
              to="/login"
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              Sign in
            </ButtonLink>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
