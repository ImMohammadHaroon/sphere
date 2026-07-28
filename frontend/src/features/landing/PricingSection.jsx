import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { useLandingMotion } from "./landingMotion";
import { BillingIntervalToggle } from "@/features/billing/BillingIntervalToggle";
import {
  DEFAULT_PLANS,
  formatPrice,
  getRegisterUrl,
} from "./pricingData";

function PricingCard({ plan, interval, revealProps }) {
  const priceCents =
    interval === "year" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
  const priceLabel = formatPrice(priceCents);
  const suffix = interval === "year" ? "/year" : "/month";

  return (
    <motion.article
      {...revealProps}
      className={cn(
        "relative flex h-full flex-col rounded-2xl border bg-surface-raised p-6 shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        plan.highlighted
          ? "border-primary/40 ring-2 ring-primary/20"
          : "border-border"
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Most popular
        </span>
      ) : null}

      <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {plan.name}
      </p>
      <h3 className="mt-3 font-landing-display text-2xl font-semibold text-text-primary">
        {plan.name}
      </h3>
      <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>

      <div className="mt-6 flex items-end gap-1">
        <span className="font-landing-display text-4xl font-semibold text-text-primary">
          {priceLabel}
        </span>
        <span className="pb-1 text-sm text-text-muted">{suffix}</span>
      </div>
      <p className="mt-2 text-xs text-text-muted">14-day free trial included</p>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <ButtonLink
        to={getRegisterUrl(plan.id, interval)}
        variant={plan.highlighted ? "primary" : "outline"}
        className="mt-8 w-full"
      >
        Start free trial
      </ButtonLink>
    </motion.article>
  );
}

export function PricingSection({ plans = DEFAULT_PLANS }) {
  const { revealProps, staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.08);
  const [interval, setInterval] = useState("month");

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <motion.div className="mx-auto max-w-2xl text-center" {...revealProps}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Pricing
        </p>
        <h2 className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl">
          Simple plans that scale with your team
        </h2>
        <p className="mt-4 text-text-secondary">
          Start with a 14-day free trial on any plan. Add your card in settings
          before the trial ends — no charge until then.
        </p>
        <div className="mt-8 flex justify-center">
          <BillingIntervalToggle interval={interval} onChange={setInterval} />
        </div>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-6 lg:grid-cols-3"
        variants={staggerContainer}
        {...staggerViewport}
      >
        {plans.map((plan) => (
          <motion.div key={plan.id} variants={staggerItem}>
            <PricingCard
              plan={plan}
              interval={interval}
              revealProps={{}}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
