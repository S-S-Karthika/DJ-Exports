import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { features } from "../../data/siteContent";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 60, rotateX: -35 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

function FeatureCard({ icon: Icon, title, text, index }) {
  const cardRef = useRef(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px" });

  // Feed the cursor position to CSS so the spotlight follows it
  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformPerspective: 1000 }}
      className="group relative rounded-2xl p-px shadow-[0_20px_50px_-20px_rgba(20,46,17,0.35)]"
    >
      {/* Static border */}
      <div className="absolute inset-0 rounded-2xl bg-stone-200" />

      {/* Light beam travelling around the border (hover) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,var(--color-brand-500)_50deg,transparent_100deg)]" />
      </div>

      {/* Card body */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="relative h-full overflow-hidden rounded-[15px] bg-white px-7 pb-9 pt-10 text-center"
      >
        {/* Cursor spotlight */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(320px circle at var(--x) var(--y), rgb(63 122 50 / 0.12), transparent 70%)",
          }}
        />

        {/* Outlined number */}
        <span className="absolute right-5 top-3 font-serif text-5xl font-semibold text-transparent transition-all duration-500 [-webkit-text-stroke:1px_var(--color-brand-200)] group-hover:[-webkit-text-stroke:1px_var(--color-brand-600)]">
          0{index + 1}
        </span>

        {/* Icon */}
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 rounded-full bg-brand-500 opacity-0 group-hover:animate-[ripple_1.2s_ease-out]" />
          <div className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700 transition-colors duration-500 group-hover:bg-brand-700 group-hover:text-white">
            <Icon
              className={`icon-draw h-7 w-7 ${inView ? "is-visible" : ""}`}
              strokeWidth={1.5}
              style={{ "--draw-delay": `${0.4 + index * 0.15}s` }}
            />
          </div>
        </div>

        <h3 className="relative mt-6 font-serif text-2xl font-semibold text-stone-900">{title}</h3>
        <p className="relative mt-2 text-sm text-stone-500">{text}</p>

        {/* Accent line */}
        <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-brand-600 transition-all duration-500 group-hover:w-1/2" />
      </div>
    </motion.div>
  );
}

export default function FeatureStrip() {
  return (
    <section className="relative z-30 -mt-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </motion.div>
    </section>
  );
}