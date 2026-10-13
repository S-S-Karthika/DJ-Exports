import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import SplitReveal from "./SplitReveal";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

const countLabel = (c) =>
  c.product_count > 0 ? `${c.product_count} product${c.product_count === 1 ? "" : "s"}` : "Coming soon";

export default function CategoryShowcase() {
  const { categories } = useSite();
  const [active, setActive] = useState(0);

  if (!categories.length) return null;

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:px-8">
        <div>
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-brand-700">
            <span className="h-px w-10 bg-brand-700" /> Our Collections
          </p>
          <SplitReveal
            text="Explore our home textile range"
            className="mt-5 max-w-2xl font-serif text-4xl font-medium leading-[1.1] text-stone-900 sm:text-5xl"
          />
        </div>
        <Reveal delay={0.2}>
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 font-semibold text-brand-700 hover:text-brand-900"
          >
            View all products
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>

      {/* Desktop: expanding panels */}
      <Reveal className="mx-auto mt-14 hidden h-[560px] max-w-7xl gap-4 px-8 lg:flex">
        {categories.map((c, i) => {
          const isActive = active === i;
          return (
            <motion.div
              key={c.id}
              onMouseEnter={() => setActive(i)}
              animate={{ flexGrow: isActive ? 4 : 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-w-0 basis-0 overflow-hidden rounded-3xl bg-brand-800"
            >
              <Link
                to={`/products/${c.slug}`}
                onFocus={() => setActive(i)}
                aria-label={c.name}
                className="absolute inset-0 block"
              >
                {c.image && (
                  <img
                    src={ik(c.image, "w-1200,q-80")}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out ${
                      isActive ? "scale-100" : "scale-125"
                    }`}
                  />
                )}
                <div
                  className="absolute inset-0 bg-brand-900/55 transition-opacity duration-700"
                  style={{ opacity: isActive ? 0 : 1 }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-brand-900/90 via-brand-900/20 to-transparent" />

                <span className="absolute left-6 top-6 font-serif text-lg text-white/70">0{i + 1}</span>

                {/* Collapsed: vertical title */}
                <span
                  className={`absolute bottom-10 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap font-serif text-2xl font-medium text-white transition-opacity duration-300 [writing-mode:vertical-rl] ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                >
                  {c.name}
                </span>

                {/* Expanded: details */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      className="absolute inset-x-0 bottom-0 p-10 text-white"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-100">{countLabel(c)}</p>
                      <h3 className="mt-3 font-serif text-5xl font-medium">{c.name}</h3>
                      {c.short_description && (
                        <p className="mt-3 max-w-md font-light text-white/80">{c.short_description}</p>
                      )}
                      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-brand-900">
                        Explore <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </Reveal>

      {/* Mobile & tablet: cards */}
      <div className="mx-auto mt-12 grid max-w-7xl gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:hidden">
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 0.1}>
            <Link
              to={`/products/${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-brand-800"
            >
              {c.image && (
                <img
                  src={ik(c.image, "w-800,q-80")}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-brand-900/90 via-brand-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-100">{countLabel(c)}</p>
                <h3 className="mt-2 font-serif text-3xl font-medium">{c.name}</h3>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}