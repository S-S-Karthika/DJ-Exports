import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Phone, Sparkles } from "lucide-react";
import api from "../../api/axios";
import Reveal from "./Reveal";
import SplitReveal from "./SplitReveal";
import CottonBranch from "./CottonBranch";
import { about as fallback } from "../../data/siteContent";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

const curtain = {
  initial: { clipPath: "inset(100% 0% 0% 0%)" },
  whileInView: { clipPath: "inset(0% 0% 0% 0%)" },
  viewport: { once: true, margin: "-100px" },
};

const toTel = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;
const paragraphs = (text) => (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export default function AboutSection() {
  const { settings } = useSite();
  const ref = useRef(null);
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Same content as the About page (Admin → About Page)
  useEffect(() => {
    api
      .get("/public/about")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to load about content:", err))
      .finally(() => setLoaded(true));
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yMain = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const ySmall = useTransform(scrollYProgress, [0, 1], [140, -140]);

  const title = data?.story_title || fallback.title;
  const highlight = data?.highlight || fallback.highlight;
  const paras = data?.story_text ? paragraphs(data.story_text).slice(0, 2) : fallback.short;
  const mainImg = data?.story_image_main;
  const secondImg = data?.story_image_secondary;
  const hasImages = Boolean(mainImg || secondImg);
  const phones = [settings.phone_primary, settings.phone_secondary].filter(Boolean);

  // Reserve space while loading so the page doesn't jump
  if (!loaded) return <section ref={ref} className="min-h-[600px]" />;

  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-36">
      <CottonBranch className="absolute -right-6 top-10 hidden h-72 w-56 text-brand-700/40 lg:block" />
      <CottonBranch className="absolute -left-10 bottom-0 hidden h-56 w-44 -scale-x-100 text-brand-700/25 xl:block" />

      <div
        className={`relative mx-auto grid items-center gap-16 px-4 sm:px-6 lg:px-8 ${
          hasImages ? "max-w-7xl lg:grid-cols-2 lg:gap-24" : "max-w-3xl"
        }`}
      >
        {/* Images (only if uploaded in Admin → About Page) */}
        {hasImages && (
          <div className="relative order-2 h-[460px] sm:h-[560px] lg:order-1">
            {mainImg && (
              <motion.div style={{ y: yMain }} className="absolute right-0 top-0 h-[85%] w-[78%]">
                <motion.div
                  {...curtain}
                  transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
                  className="group h-full w-full overflow-hidden rounded-2xl"
                >
                  <img
                    src={ik(mainImg, "w-900,q-80")}
                    alt={`${settings.site_name || "Our"} home textiles`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
                  />
                </motion.div>
              </motion.div>
            )}

            {secondImg && (
              <motion.div style={{ y: ySmall }} className="absolute bottom-0 left-0 h-[48%] w-[52%]">
                <motion.div
                  {...curtain}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.77, 0, 0.175, 1] }}
                  className="h-full w-full overflow-hidden rounded-2xl border-8 border-linen shadow-2xl"
                >
                  <img
                    src={ik(secondImg, "w-600,q-80")}
                    alt="Textile details"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Rotating badge */}
            <div className="absolute left-[6%] top-[4%] z-10 grid h-32 w-32 place-items-center rounded-full bg-white shadow-xl">
              <svg viewBox="0 0 100 100" className="absolute inset-1.5 animate-[spin_20s_linear_infinite]">
                <defs>
                  <path id="badge-circle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                </defs>
                <text className="fill-brand-800 text-[8px] font-medium uppercase">
                  <textPath href="#badge-circle" textLength="235" lengthAdjust="spacing">
                    Established • Karur Home Textiles •
                  </textPath>
                </text>
              </svg>
              <span className="font-serif text-3xl font-semibold text-brand-900">{fallback.established}</span>
            </div>
          </div>
        )}

        {/* Text */}
        <div className={hasImages ? "order-1 lg:order-2" : "text-center"}>
          <p
            className={`flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-brand-700 ${
              hasImages ? "" : "justify-center"
            }`}
          >
            <motion.span
              className="block h-px bg-brand-700"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            About {settings.site_name || "Us"}
          </p>

          <SplitReveal
            text={title}
            delay={0.1}
            className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-stone-900 sm:text-5xl lg:text-6xl"
          />

          {highlight && (
            <Reveal delay={0.3}>
              <div className="relative mt-8 overflow-hidden rounded-2xl bg-linear-to-r from-brand-900 to-brand-700 p-6 text-left text-white shadow-lg">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <p className="font-serif text-2xl italic leading-snug">{highlight}</p>
                </div>
              </div>
            </Reveal>
          )}

          {paras.map((para, i) => (
            <Reveal key={i} delay={0.4 + i * 0.1}>
              <p className="mt-6 text-lg font-light leading-relaxed text-stone-600">{para}</p>
            </Reveal>
          ))}

          <Reveal delay={0.6}>
            <div className={`mt-10 flex flex-wrap items-center gap-6 ${hasImages ? "" : "justify-center"}`}>
              <Link
                to="/about"
                className="group inline-flex items-center gap-3 rounded-full bg-brand-700 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-brand-800"
              >
                Explore More
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              {phones.length > 0 && (
                <div className="flex items-center gap-3 text-left">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-brand-200 text-brand-700">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-stone-500">Call us</span>
                    {phones.map((p) => (
                      <a key={p} href={toTel(p)} className="block font-medium text-stone-900 hover:text-brand-700">
                        {p}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}