import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { ArrowRight, Eye, Quote, Sparkles, Target, X, ZoomIn } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../api/axios";
import Reveal from "../../components/public/Reveal";
import SplitReveal from "../../components/public/SplitReveal";
import CottonBranch from "../../components/public/CottonBranch";
import { useSite } from "../../context/SiteContext";
import { whyChooseUs, processSteps } from "../../data/siteContent";
import { ik } from "../../utils/image";

const curtain = {
  initial: { clipPath: "inset(100% 0% 0% 0%)" },
  whileInView: { clipPath: "inset(0% 0% 0% 0%)" },
  viewport: { once: true, margin: "-100px" },
};
const curtainTransition = { duration: 1.2, ease: [0.77, 0, 0.175, 1] };

// Split text into paragraphs on empty lines
const paragraphs = (text) =>
  (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export default function About() {
  const { settings } = useSite();
  const [about, setAbout] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/public/about"), api.get("/public/certificates")])
      .then(([a, c]) => {
        setAbout(a.data);
        setCertificates(c.data);
      })
      .catch((err) => console.error("Failed to load About page:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = `About Us | ${settings.site_name || "DJ EXPORTS"}`;
  }, [settings.site_name]);

  if (loading) return <div className="h-[60vh] animate-pulse bg-brand-900" />;

  const a = about || {};

  return (
    <>
      <PageBanner image={a.banner_image} />
      <StorySection a={a} />
      {a.founder_name && <FounderSection a={a} />}
      {(a.mission || a.vision) && <MissionVision a={a} />}
      {a.karur_text && <KarurSection a={a} />}
      {processSteps.length > 0 && <ProcessSection />}
      <WhyChooseSection />
      {certificates.length > 0 && <CertificatesSection items={certificates} />}
      <CtaSection />
    </>
  );
}

/* ---------- Shared ---------- */

function Eyebrow({ children, light, center }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] ${
        light ? "text-brand-100" : "text-brand-700"
      } ${center ? "justify-center" : ""}`}
    >
      <motion.span
        className={`block h-px ${light ? "bg-brand-100" : "bg-brand-700"}`}
        initial={{ width: 0 }}
        whileInView={{ width: 40 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {children}
    </p>
  );
}

/* ---------- 1. Banner ---------- */

function PageBanner({ image }) {
  return (
    <section className="relative flex h-[60vh] min-h-[420px] items-center justify-center overflow-hidden bg-brand-900">
      {image && (
        <img
          src={ik(image, "w-1920,q-80")}
          alt=""
          className="absolute inset-0 h-full w-full animate-kenburns object-cover"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/40 to-black/60" />
      <div className="relative px-6 pt-16 text-center text-white">
        <p className="animate-tracking-in text-xs font-medium uppercase tracking-[0.45em] text-white/80 sm:text-sm">
          Who we are
        </p>
        <SplitReveal
          as="h1"
          text="About Us"
          inView={false}
          delay={0.3}
          className="mt-5 font-serif text-5xl font-medium sm:text-7xl"
        />
        <nav
          aria-label="Breadcrumb"
          className="animate-fade-up mt-6 flex items-center justify-center gap-2 text-sm text-white/80"
          style={{ animationDelay: "700ms" }}
        >
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-white">About</span>
        </nav>
      </div>
    </section>
  );
}

/* ---------- 2. Story ---------- */

function StorySection({ a }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yMain = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const ySmall = useTransform(scrollYProgress, [0, 1], [140, -140]);
  const hasImages = a.story_image_main || a.story_image_secondary;

  return (
    <section ref={ref} className="relative overflow-hidden py-24 lg:py-32">
      <CottonBranch className="absolute -right-6 top-10 hidden h-72 w-56 text-brand-700/30 lg:block" />

      <div
        className={`relative mx-auto grid items-center gap-16 px-4 sm:px-6 lg:px-8 ${
          hasImages ? "max-w-7xl lg:grid-cols-2 lg:gap-24" : "max-w-3xl"
        }`}
      >
        <div>
          <Eyebrow>Our Story</Eyebrow>
          {a.story_title && (
            <SplitReveal
              text={a.story_title}
              delay={0.1}
              className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-stone-900 sm:text-5xl"
            />
          )}

          {a.highlight && (
            <Reveal delay={0.2}>
              <div className="relative mt-8 overflow-hidden rounded-2xl bg-linear-to-r from-brand-900 to-brand-700 p-6 text-white shadow-lg">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <p className="font-serif text-2xl italic leading-snug">{a.highlight}</p>
                </div>
              </div>
            </Reveal>
          )}

          {paragraphs(a.story_text).map((p, i) => (
            <Reveal key={i} delay={0.1}>
              <p className="mt-6 text-lg font-light leading-relaxed text-stone-600">{p}</p>
            </Reveal>
          ))}
        </div>

        {hasImages && (
          <div className="relative h-[460px] sm:h-[560px]">
            {a.story_image_main && (
              <motion.div style={{ y: yMain }} className="absolute right-0 top-0 h-[85%] w-[78%]">
                <motion.div {...curtain} transition={curtainTransition} className="group h-full w-full overflow-hidden rounded-2xl">
                  <img
                    src={ik(a.story_image_main, "w-900,q-80")}
                    alt="Our textiles"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1500ms] group-hover:scale-105"
                  />
                </motion.div>
              </motion.div>
            )}
            {a.story_image_secondary && (
              <motion.div style={{ y: ySmall }} className="absolute bottom-0 left-0 h-[48%] w-[52%]">
                <motion.div
                  {...curtain}
                  transition={{ ...curtainTransition, delay: 0.3 }}
                  className="h-full w-full overflow-hidden rounded-2xl border-8 border-linen shadow-2xl"
                >
                  <img
                    src={ik(a.story_image_secondary, "w-700,q-80")}
                    alt="Textile details"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- 3. Founder ---------- */

function FounderSection({ a }) {
  const hasPhoto = Boolean(a.founder_image);

  return (
    <section className="relative overflow-hidden bg-brand-900 py-24 text-white lg:py-32">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" />
      <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />

      <div
        className={`relative mx-auto grid items-center gap-14 px-4 sm:px-6 lg:px-8 ${
          hasPhoto ? "max-w-6xl lg:grid-cols-[400px_1fr] lg:gap-20" : "max-w-3xl text-center"
        }`}
      >
        {hasPhoto && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute -right-4 -top-4 h-full w-full rounded-2xl border border-brand-200/40" />
            <motion.div {...curtain} transition={curtainTransition} className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <img src={ik(a.founder_image, "w-800,q-80")} alt={a.founder_name} className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>
        )}

        <div>
          <Eyebrow light center={!hasPhoto}>Meet the Founder</Eyebrow>
          <Quote className={`mt-8 h-12 w-12 text-brand-200/50 ${hasPhoto ? "" : "mx-auto"}`} />
          {a.founder_message && (
            <Reveal delay={0.2}>
              <p className="mt-4 font-serif text-2xl italic leading-relaxed text-white/90 sm:text-3xl">
                {a.founder_message}
              </p>
            </Reveal>
          )}
          <Reveal delay={0.35}>
            <div className={`mt-10 flex items-center gap-4 ${hasPhoto ? "" : "justify-center"}`}>
              <span className="h-px w-12 bg-brand-200" />
              <div className="text-left">
                <p className="font-serif text-2xl font-semibold">{a.founder_name}</p>
                {a.founder_title && (
                  <p className="text-sm uppercase tracking-[0.25em] text-brand-100">{a.founder_title}</p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Mission & Vision ---------- */

function MissionVision({ a }) {
  const cards = [
    a.mission && { icon: Target, label: "Our Mission", text: a.mission },
    a.vision && { icon: Eye, label: "Our Vision", text: a.vision },
  ].filter(Boolean);

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-6 ${cards.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-2xl"}`}>
          {cards.map(({ icon: Icon, label, text }, i) => (
            <Reveal key={label} delay={i * 0.15}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-10 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand-600 transition-transform duration-500 group-hover:scale-x-100" />
                <span className="absolute -right-4 -top-8 font-serif text-[9rem] leading-none text-brand-50 transition-colors duration-500 group-hover:text-brand-100">
                  0{i + 1}
                </span>
                <div className="relative grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="relative mt-6 font-serif text-3xl font-semibold text-stone-900">{label}</h3>
                <p className="relative mt-4 text-lg font-light leading-relaxed text-stone-600">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. Why Karur ---------- */

function KarurSection({ a }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const hasImage = Boolean(a.karur_image);

  return (
    <section ref={ref} className="relative overflow-hidden bg-white/60 py-24 lg:py-32">
      <CottonBranch className="absolute -left-10 bottom-0 hidden h-64 w-48 -scale-x-100 text-brand-700/25 xl:block" />

      <div
        className={`relative mx-auto grid items-center gap-16 px-4 sm:px-6 lg:px-8 ${
          hasImage ? "max-w-7xl lg:grid-cols-2 lg:gap-24" : "max-w-3xl text-center"
        }`}
      >
        {hasImage && (
          <motion.div {...curtain} transition={curtainTransition} className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
            <motion.img
              style={{ y, scale: 1.2 }}
              src={ik(a.karur_image, "w-1000,q-80")}
              alt="Karur textiles"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </motion.div>
        )}

        <div>
          <Eyebrow center={!hasImage}>Our Roots</Eyebrow>
          {a.karur_title && (
            <SplitReveal
              text={a.karur_title}
              delay={0.1}
              className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-stone-900 sm:text-5xl"
            />
          )}
          {paragraphs(a.karur_text).map((p, i) => (
            <Reveal key={i} delay={0.1}>
              <p className="mt-6 text-lg font-light leading-relaxed text-stone-600">{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Process ---------- */

function ProcessSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Eyebrow center>How We Work</Eyebrow>
          <SplitReveal
            text="From inquiry to dispatch"
            className="mt-5 font-serif text-4xl font-medium text-stone-900 sm:text-5xl"
          />
        </div>

        <div className="relative mt-16">
          <motion.div
            className="absolute left-0 right-0 top-7 hidden h-px origin-left bg-brand-200 lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
          <div className="grid gap-10 sm:grid-cols-2 lg:flex lg:justify-between">
            {processSteps.map((step, i) => (
              <Reveal key={step.title} delay={0.2 + i * 0.15} className="relative text-center lg:flex-1 lg:px-4">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-700 font-serif text-xl font-semibold text-white ring-8 ring-linen">
                  {i + 1}
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm text-stone-500">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. Why choose us ---------- */

function WhyItem({ icon: Icon, title, text, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <Reveal delay={(index % 3) * 0.12}>
      <div
        ref={ref}
        className="group h-full rounded-2xl border border-white/10 p-8 transition-all duration-500 hover:border-white/25 hover:bg-white/5"
      >
        <div className="grid h-14 w-14 place-items-center rounded-full border border-brand-200/40 text-brand-100 transition-colors duration-500 group-hover:bg-brand-100 group-hover:text-brand-900">
          <Icon
            className={`icon-draw h-6 w-6 ${inView ? "is-visible" : ""}`}
            strokeWidth={1.5}
            style={{ "--draw-delay": `${0.3 + (index % 3) * 0.15}s` }}
          />
        </div>
        <h3 className="mt-6 font-serif text-2xl font-semibold">{title}</h3>
        <p className="mt-2 font-light text-brand-100/80">{text}</p>
      </div>
    </Reveal>
  );
}

function WhyChooseSection() {
  return (
    <section className="relative overflow-hidden bg-brand-900 py-24 text-white lg:py-32">
      <div className="absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-brand-700/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Eyebrow light center>Why Choose Us</Eyebrow>
          <SplitReveal
            text="A partner you can rely on"
            className="mt-5 font-serif text-4xl font-medium sm:text-5xl"
          />
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item, i) => (
            <WhyItem key={item.title} {...item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 8. Certificates ---------- */

function CertificatesSection({ items }) {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Eyebrow center>Registered & Verified</Eyebrow>
          <SplitReveal
            text="Our Registrations"
            className="mt-5 font-serif text-4xl font-medium text-stone-900 sm:text-5xl"
          />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.1}>
              <button
                type="button"
                onClick={() => setOpen(c)}
                className="group block w-full overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
                  <img
                    src={ik(c.image, "w-600,q-80")}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-brand-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-900">
                      <ZoomIn className="h-4 w-4" /> View
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-serif text-xl font-semibold text-stone-900">{c.title}</p>
                  {c.issuer && <p className="text-sm text-stone-500">{c.issuer}</p>}
                  {c.cert_number && (
                    <p className="mt-2 inline-block rounded bg-brand-50 px-2 py-1 font-mono text-xs text-brand-800">
                      {c.cert_number}
                    </p>
                  )}
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            src={ik(open.image, "w-1600,q-85")}
            alt={open.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-full rounded-lg bg-white object-contain"
          />
          <p className="mt-4 text-center text-white">
            {open.title}
            {open.cert_number && <span className="ml-2 font-mono text-sm text-white/70">{open.cert_number}</span>}
          </p>
        </motion.div>
      )}
    </section>
  );
}

/* ---------- 9. Call to action ---------- */

function CtaSection() {
  const { settings } = useSite();
  const wa = settings.whatsapp?.replace(/\D/g, "");

  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-linear-to-br from-brand-800 to-brand-900 px-8 py-16 text-center text-white sm:px-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5" />
          <h2 className="relative font-serif text-4xl font-medium sm:text-5xl">
            Ready to source quality home textiles from India?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl font-light text-brand-100">
            Tell us what you need, and we will get back to you with details and pricing.
          </p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-brand-900 transition hover:bg-brand-50"
            >
              Request a Quote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-white/10"
              >
                <FaWhatsapp className="h-5 w-5" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}