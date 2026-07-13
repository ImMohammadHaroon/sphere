import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ROLES } from "./landingData";
import { useLandingMotion } from "./landingMotion";

export function RolesSection() {
  const [activeKey, setActiveKey] = useState(ROLES[2].key);
  const activeRole = ROLES.find((r) => r.key === activeKey) ?? ROLES[0];
  const { revealProps, staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.08);

  return (
    <section className="rounded-3xl border border-border bg-surface px-4 py-14 sm:px-8 sm:py-20">
      <motion.div className="max-w-2xl" {...revealProps}>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Multi-tenant by design
        </p>
        <h2 className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl">
          Built for every role in the room
        </h2>
        <p className="mt-4 text-text-secondary">
          One platform, five distinct experiences  each scoped to what that
          person is responsible for, from platform oversight to client
          transparency.
        </p>
      </motion.div>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,14rem)_1fr] lg:gap-8">
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          role="tablist"
          aria-label="ProjectSphere roles"
          variants={staggerContainer}
          {...staggerViewport}
        >
          {ROLES.map((role) => (
            <motion.div key={role.key} variants={staggerItem} className="shrink-0">
              <button
                type="button"
                role="tab"
                aria-selected={activeKey === role.key}
                aria-controls={`role-panel-${role.key}`}
                id={`role-tab-${role.key}`}
                onClick={() => setActiveKey(role.key)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  activeKey === role.key
                    ? "border-primary bg-primary-subtle text-text-primary"
                    : "border-border bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary"
                )}
              >
                <span className="block text-sm font-semibold">{role.title}</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-text-muted">
                  {role.scope}
                </span>
              </button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          {...revealProps}
          id={`role-panel-${activeRole.key}`}
          role="tabpanel"
          aria-labelledby={`role-tab-${activeRole.key}`}
          className="mt-6 rounded-2xl border border-border bg-surface-raised p-6 sm:p-8 lg:mt-0"
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            role: {activeRole.key}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-text-primary">
            {activeRole.title}
          </h3>
          <p className="mt-3 max-w-prose text-text-secondary">
            {activeRole.description}
          </p>
          <ul className="mt-6 space-y-3">
            {activeRole.actions.map((action) => (
              <li
                key={action}
                className="flex items-start gap-3 text-sm text-text-primary"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                {action}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
