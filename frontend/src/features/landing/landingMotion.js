import { useReducedMotion } from "motion/react";

export const VIEWPORT = { once: true, margin: "-100px" };
export const REVEAL_EASE = [0.16, 1, 0.3, 1];

export function useLandingMotion(staggerSeconds = 0.1) {
  const reduced = useReducedMotion();

  const revealTransition = reduced
    ? { duration: 0.01 }
    : { duration: 0.6, ease: REVEAL_EASE };

  const revealProps = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: VIEWPORT,
    transition: revealTransition,
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduced ? 0 : staggerSeconds,
      },
    },
  };

  const staggerItem = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: revealTransition,
    },
  };

  const staggerViewport = {
    initial: "hidden",
    whileInView: "visible",
    viewport: VIEWPORT,
  };

  return {
    reduced,
    revealProps,
    staggerContainer,
    staggerItem,
    staggerViewport,
  };
}
