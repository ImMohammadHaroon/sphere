import { motion } from "motion/react";
import { useLandingMotion } from "./landingMotion";

export function ProblemSection() {
  const { staggerContainer, staggerItem, staggerViewport } =
    useLandingMotion(0.1);

  return (
    <section className="border-y border-border bg-surface py-16 sm:py-20">
      <motion.div
        className="mx-auto max-w-3xl text-center"
        variants={staggerContainer}
        {...staggerViewport}
      >
        <motion.p
          variants={staggerItem}
          className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted"
        >
          The problem
        </motion.p>
        <motion.h2
          variants={staggerItem}
          className="mt-4 font-landing-display text-3xl font-semibold leading-tight sm:text-4xl"
        >
          Fixed workflows force teams to work around their tools
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg"
        >
          Most PM tools ship the same three columns and call it a workflow. Your
          design team runs client review before build. Your agency marks
          &quot;shipped&quot; differently than your internal squad. When the
          board doesn&apos;t match how work actually moves, people track status
          in spreadsheets, Slack threads, and side channels  and the tool
          becomes overhead.
        </motion.p>
        <motion.p
          variants={staggerItem}
          className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg"
        >
          ProjectSphere starts with the workflow you define  then keeps
          everyone on that board in real time.
        </motion.p>
      </motion.div>
    </section>
  );
}
