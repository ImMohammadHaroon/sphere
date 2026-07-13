import { motion } from "motion/react";
import { CheckCircle2, Eye } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useLandingMotion } from "./landingMotion";

const MILESTONE_STEPS = [
  { label: "Design system delivery", status: "approved", date: "Mar 12" },
  { label: "Beta launch", status: "pending", date: "Apr 3" },
  { label: "Full rollout", status: "upcoming", date: "May 1" },
];

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
            Clients see progress  and sign off on milestones
          </h2>
          <p className="mt-4 text-text-secondary">
            Invite clients to a read-only, branded view of their projects. They
            track delivery without a full team account, and approve milestones
            when work is ready  no chasing status in email.
          </p>
          <ButtonLink to="/register" className="mt-8" variant="outline">
            Set up your organization
          </ButtonLink>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                client-portal / acme-rebrand
              </p>
              <p className="mt-1 text-sm font-medium text-text-primary">
                Acme Rebrand  Client View
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-accent-subtle px-2.5 py-1 text-accent-foreground">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              <span className="text-xs font-medium">Read-only</span>
            </div>
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-text-muted">
            Milestones
          </p>
          <ul className="mt-3 space-y-3">
            {MILESTONE_STEPS.map((step) => (
              <li
                key={step.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  {step.status === "approved" ? (
                    <CheckCircle2
                      className="h-4 w-4 text-primary"
                      aria-label="Approved"
                    />
                  ) : (
                    <span
                      className="h-4 w-4 rounded-full border-2 border-border-strong"
                      aria-hidden
                    />
                  )}
                  <span className="text-sm text-text-primary">{step.label}</span>
                </div>
                <span className="font-mono text-[10px] text-text-muted">
                  {step.status === "approved"
                    ? `approved ${step.date}`
                    : step.date}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs text-text-secondary">
            Clients approve milestones from this view  your team keeps full
            edit access on the project board.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
