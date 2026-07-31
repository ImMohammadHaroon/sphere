import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Ghost } from "lucide-react";

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.43, 0.13, 0.23, 0.96],
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const numberVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction * 40,
    y: 15,
    rotate: direction * 5,
  }),
  visible: {
    opacity: 0.7,
    x: 0,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const ghostVariants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
    y: 15,
    rotate: -5,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  hover: {
    scale: 1.1,
    y: -10,
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
      rotate: {
        duration: 2,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  },
  floating: {
    y: [-5, 5],
    transition: {
      y: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  },
};

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <AnimatePresence mode="wait">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="mb-8 flex items-center justify-center gap-4 md:mb-12 md:gap-6">
            <motion.span
              className="font-signika select-none text-[80px] font-bold text-[#222222] opacity-70 md:text-[120px]"
              variants={numberVariants}
              custom={-1}
            >
              4
            </motion.span>
            <motion.div
              variants={ghostVariants}
              whileHover="hover"
              animate={["visible", "floating"]}
              className="flex items-center justify-center"
            >
              <Ghost
                className="h-[80px] w-[80px] select-none text-[#222222] opacity-70 md:h-[120px] md:w-[120px]"
                strokeWidth={1.25}
                aria-hidden
              />
            </motion.div>
            <motion.span
              className="font-signika select-none text-[80px] font-bold text-[#222222] opacity-70 md:text-[120px]"
              variants={numberVariants}
              custom={1}
            >
              4
            </motion.span>
          </div>

          <motion.h1
            className="font-dm-sans mb-4 select-none text-3xl font-bold text-[#222222] opacity-70 md:mb-6 md:text-5xl"
            variants={itemVariants}
          >
            Boo! Page missing!
          </motion.h1>

          <motion.p
            className="font-dm-sans mb-8 select-none text-lg text-[#222222] opacity-50 md:mb-12 md:text-xl"
            variants={itemVariants}
          >
            Whoops! This page must be a ghost — it&apos;s not here!
          </motion.p>

          <motion.div
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: {
                duration: 0.3,
                ease: [0.43, 0.13, 0.23, 0.96],
              },
            }}
          >
            <Link
              to="/"
              className="font-dm-sans inline-block rounded-full bg-[#222222] px-8 py-3 text-lg font-medium text-white transition-colors select-none hover:bg-[#000000]"
            >
              Find shelter
            </Link>
          </motion.div>

          <motion.div className="mt-12" variants={itemVariants}>
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404"
              target="_blank"
              rel="noopener noreferrer"
              className="font-dm-sans text-[#222222] underline opacity-50 transition-opacity select-none hover:opacity-70"
            >
              What means 404?
            </a>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
