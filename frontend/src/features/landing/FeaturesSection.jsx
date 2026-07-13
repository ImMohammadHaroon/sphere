import { motion } from "motion/react";
import { getPaletteColor } from "@/lib/taskStatusConfig";
import { CORE_FEATURES } from "./landingData";
import { useLandingMotion } from "./landingMotion";

export function FeaturesSection() {
  const { revealProps, staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.1);

  return (
    <section className="py-16 sm:py-24">
      <motion.div className="max-w-2xl" {...revealProps}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Core capabilities
        </p>
        <h2 className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl">
          Built around how projects actually run
        </h2>
        <p className="mt-4 text-text-secondary">
          Not a feature checklist  the parts of ProjectSphere you use every day
          when coordinating work across teams and organizations.
        </p>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-6 md:grid-cols-2"
        variants={staggerContainer}
        {...staggerViewport}
      >
        {CORE_FEATURES.map((feature) => (
          <motion.article
            key={feature.id}
            variants={staggerItem}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface-raised p-6 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <div
              className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-200 group-hover:opacity-35"
              style={{ backgroundColor: getPaletteColor(feature.accent) }}
              aria-hidden
            />
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              {feature.mono}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-text-primary">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
