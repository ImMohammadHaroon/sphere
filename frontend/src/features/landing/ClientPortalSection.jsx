import { motion } from "motion/react";
import { CheckCircle2, Circle } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useLandingMotion } from "./landingMotion";

const MILESTONE_STEPS = [
  { label: "Brand guidelines", status: "approved", date: "Mar 12" },
  { label: "Website preview", status: "pending", date: "Apr 3" },
  { label: "Final launch", status: "upcoming", date: "May 1" },
];

function StepStatus({ status }) {
  if (status === "approved") {
    return (
      <CheckCircle2
        className="h-5 w-5 shrink-0 text-primary"
        aria-label="Approved"
      />
    );
  }

  return (
    <Circle
      className={`h-5 w-5 shrink-0 ${
        status === "pending" ? "text-primary" : "text-border-strong"
      }`}
      aria-hidden
    />
  );
}

function StepLabel({ status }) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Ready for you";
  return "Coming up";
}

export function ClientPortalSection() {
  const { staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.12);

  return (
    <section className="py-16 sm:py-24">
      <motion.div
        className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14"
        variants={staggerContainer}
        {...staggerViewport}
      >
        <motion.div variants={staggerItem}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
            Client portal
          </p>
          <h2 className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl">
            A simple place for clients to follow along
          </h2>
          <p className="mt-4 text-text-secondary">
            No training required. Clients see project progress, review
            deliverables, and tap one button to say it looks good — without
            learning your team&apos;s tools.
          </p>
          <ButtonLink to="/register" className="mt-8" variant="outline">
            Set up your organization
          </ButtonLink>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm sm:p-6"
        >
          <div className="border-b border-border pb-4">
            <p className="text-sm font-medium text-text-primary">
              Acme Rebrand
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Hi Sarah, here is where your project stands.
            </p>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">
                Making good progress
              </span>
              <span className="text-text-secondary">62% complete</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full w-[62%] rounded-full bg-primary" />
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-text-primary">
            Deliverables
          </p>
          <ul className="mt-3 space-y-3">
            {MILESTONE_STEPS.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <StepStatus status={step.status} />
                  <span className="text-sm text-text-primary">{step.label}</span>
                </div>
                <span className="text-xs text-text-muted">
                  <StepLabel status={step.status} />
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg bg-primary/5 px-4 py-3 text-center">
            <p className="text-sm font-medium text-text-primary">
              Website preview is ready for you
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Tap to review and let the team know if it looks good
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
