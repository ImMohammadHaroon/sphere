import { motion } from "motion/react";
import { Lock, ScrollText, Shield } from "lucide-react";
import { SECURITY_POINTS } from "./landingData";
import { useLandingMotion } from "./landingMotion";

const ICONS = {
  "Tenant isolation": Shield,
  "Audit logs": ScrollText,
  "Role-based access": Lock,
};

export function SecuritySection() {
  const { revealProps, staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.1);

  return (
    <section className="border-t border-border py-16 sm:py-20">
      <motion.div className="max-w-2xl" {...revealProps}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Security & trust
        </p>
        <h2 className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl">
          Isolated by default, accountable by design
        </h2>
        <p className="mt-4 text-text-secondary">
          Multi-tenant SaaS only works if each organization&apos;s data stays
          walled off  and if you can trace what happened when it matters.
        </p>
      </motion.div>

      <motion.div
        className="mt-10 grid gap-6 sm:grid-cols-3"
        variants={staggerContainer}
        {...staggerViewport}
      >
        {SECURITY_POINTS.map((point) => {
          const Icon = ICONS[point.title] ?? Shield;
          return (
            <motion.article
              key={point.title}
              variants={staggerItem}
              className="rounded-2xl border border-border bg-surface-raised p-5"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="mt-4 font-semibold text-text-primary">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {point.description}
              </p>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
