import { motion } from "motion/react";

const child = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

export default function SplitReveal({
  text = "",
  as = "h2",
  className = "",
  delay = 0,
  stagger = 0.07,
  inView = true, // false = animate immediately on mount (used in the hero)
}) {
  const Tag = motion[as];
  const words = text.split(" ");

  const parent = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const trigger = inView
    ? { whileInView: "show", viewport: { once: true, margin: "-80px" } }
    : { animate: "show" };

  return (
    <Tag className={className} initial="hidden" variants={parent} aria-label={text} {...trigger}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <motion.span variants={child} className="inline-block">
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}