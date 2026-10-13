import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, X, ZoomIn,
} from "lucide-react";
import api from "../../api/axios";
import Reveal from "../../components/public/Reveal";
import SplitReveal from "../../components/public/SplitReveal";
import { useSite } from "../../context/SiteContext";
import { gstVerifyUrl } from "../../data/siteContent";
import { ik } from "../../utils/image";

// Gilded frame gradient
const GOLD =
  "linear-gradient(145deg, #8a6420 0%, #e9cc7a 22%, #b8913a 45%, #f6e3a1 62%, #9c7428 82%, #d9b45e 100%)";

const isGst = (c) => /gst/i.test(c.title) && c.cert_number;

export default function CertificatesPage() {
  const { settings } = useSite();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    api
      .get("/public/certificates")
      .then((res) => setItems(res.data))
      .catch((err) => console.error("Failed to load certificates:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = `Certificates | ${settings.site_name || "DJ EXPORTS"}`;
  }, [settings.site_name]);

  return (
    <>
      <Banner />

      <section className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Reveal>
            <p className="text-lg font-light leading-relaxed text-stone-600">
              Transparency builds trust. These are our official business registrations, so you can trade
              with us with confidence. Click any certificate to view it in full.
            </p>
          </Reveal>
        </div>

        {loading ? (
          <div className="mx-auto mt-28 flex max-w-6xl flex-wrap justify-center gap-14 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] w-full max-w-[340px] animate-pulse rounded bg-stone-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-stone-300 bg-white/70 p-10 text-center">
            <BadgeCheck className="mx-auto h-12 w-12 text-brand-600" strokeWidth={1.5} />
            <p className="mt-4 font-serif text-2xl text-stone-900">Coming soon</p>
            <p className="mt-2 text-stone-500">Our certificates will be published here shortly.</p>
            <Link to="/contact" className="mt-6 inline-block font-medium text-brand-700 hover:underline">
              Contact us for details →
            </Link>
          </div>
        ) : (
          <div className="mx-auto mt-32 flex max-w-6xl flex-wrap justify-center gap-x-14 gap-y-32 px-4 sm:px-6 lg:px-8">
            {items.map((c, i) => (
              <FramedCertificate key={c.id} cert={c} index={i} onOpen={() => setOpenIndex(i)} />
            ))}
          </div>
        )}
      </section>

      {items.some(isGst) && <VerifyBand />}

      <AnimatePresence>
        {openIndex !== null && <Lightbox items={items} index={openIndex} setIndex={setOpenIndex} />}
      </AnimatePresence>
    </>
  );
}

/* ---------- Banner with gold seal ---------- */

function Banner() {
  return (
    <section className="relative flex min-h-[480px] items-center overflow-hidden bg-brand-900 pb-16 pt-36 text-white">
      {/* Faint diagonal weave */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)" }}
      />
      <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-600/30 blur-3xl" />
      <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-[#c9a24a]/20 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="text-center lg:text-left">
          <p className="animate-tracking-in text-xs font-medium uppercase tracking-[0.45em] text-[#e9cc7a] sm:text-sm">
            Trust & Compliance
          </p>
          <SplitReveal
            as="h1"
            text="Certified & Registered"
            inView={false}
            delay={0.3}
            className="mt-5 font-serif text-5xl font-medium leading-[1.05] sm:text-7xl"
          />
          <nav
            aria-label="Breadcrumb"
            className="animate-fade-up mt-6 flex items-center justify-center gap-2 text-sm text-white/70 lg:justify-start"
            style={{ animationDelay: "700ms" }}
          >
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white">Certificates</span>
          </nav>
        </div>

        <Seal />
      </div>
    </section>
  );
}

function Seal() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 90, damping: 12, delay: 0.6 }}
      className="relative mx-auto grid h-44 w-44 place-items-center sm:h-52 sm:w-52"
    >
      <div className="absolute inset-0 rounded-full shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]" style={{ background: GOLD }} />
      <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#5c4415]/40" />
      <svg viewBox="0 0 100 100" className="absolute inset-3 animate-[spin_24s_linear_infinite]">
        <defs>
          <path id="seal-circle" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
        </defs>
        <text className="fill-[#3b2f14] text-[7.5px] font-semibold uppercase">
          <textPath href="#seal-circle" textLength="224" lengthAdjust="spacing">
            Verified • Registered • Trusted •
          </textPath>
        </text>
      </svg>
      <div className="relative grid h-20 w-20 place-items-center rounded-full bg-brand-900 text-[#e9cc7a] ring-4 ring-[#f6e3a1]/60 sm:h-24 sm:w-24">
        <BadgeCheck className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} />
      </div>
    </motion.div>
  );
}

/* ---------- A framed, hanging certificate ---------- */

const frameVariants = {
  hidden: { opacity: 0, y: -90, rotate: -12 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    // Low damping = it swings past centre and back, like a real hanging frame
    transition: { type: "spring", stiffness: 60, damping: 6, delay: i * 0.15 },
  }),
};

function FramedCertificate({ cert, index, onOpen }) {
  return (
    <div className="relative w-full max-w-[340px]">
      {/* Museum spotlight */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-[150%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,236,190,0.55),transparent_65%)]" />

      <motion.div
        custom={index}
        variants={frameVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        whileHover={{ rotate: [0, 2.5, -2, 1, 0], transition: { duration: 1.4, ease: "easeInOut" } }}
        style={{ transformOrigin: "50% -48px" }} // pivot on the nail
        className="group relative"
      >
        {/* Hanging wire */}
        <svg
          aria-hidden="true"
          className="absolute -top-12 left-0 h-12 w-full overflow-visible"
          viewBox="0 0 100 48"
          preserveAspectRatio="none"
        >
          <path d="M18 48 L50 2 L82 48" fill="none" stroke="#6b5a3c" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* Nail */}
        <span className="absolute -top-[54px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-linear-to-br from-stone-300 to-stone-600 shadow" />

        {/* Gold frame */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View ${cert.title}`}
          className="relative block w-full rounded-[3px] p-3.5 text-left shadow-[0_35px_60px_-15px_rgba(40,30,10,0.5)] transition-shadow duration-500 group-hover:shadow-[0_45px_80px_-15px_rgba(40,30,10,0.6)]"
          style={{ background: GOLD }}
        >
          {/* Inner bevel */}
          <div
            className="rounded-[2px] p-1 shadow-[inset_0_0_0_1px_rgba(60,40,10,0.45)]"
            style={{ background: "linear-gradient(145deg, #6e5018, #c9a24a, #7a5a1c)" }}
          >
            {/* Recessed cream mat */}
            <div className="relative overflow-hidden bg-[#fbf8f1] p-6 shadow-[inset_0_3px_10px_rgba(0,0,0,0.18)]">
              <div className="relative aspect-[3/4] overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
                <img
                  src={ik(cert.image, "w-600,q-80")}
                  alt={cert.title}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Glass reflection sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

              {/* View hint */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-brand-900/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-brand-900 shadow">
                  <ZoomIn className="h-4 w-4" /> View
                </span>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Brass nameplate */}
      <Reveal delay={0.5 + index * 0.15} className="mt-8 text-center">
        <div
          className="inline-block rounded-sm px-6 py-2.5 shadow-md"
          style={{ background: "linear-gradient(180deg, #f0d78f, #c9a24a 55%, #a9863a)" }}
        >
          <p className="font-serif text-lg font-semibold uppercase tracking-wider text-[#3b2f14] [text-shadow:0_1px_0_rgba(255,255,255,0.4)]">
            {cert.title}
          </p>
          {cert.cert_number && <p className="font-mono text-xs text-[#4a3a17]">{cert.cert_number}</p>}
        </div>
        {cert.issuer && <p className="mt-3 text-sm text-stone-500">Issued by {cert.issuer}</p>}
      </Reveal>
    </div>
  );
}

/* ---------- Full-screen viewer ---------- */

function Lightbox({ items, index, setIndex }) {
  const cert = items[index];
  const total = items.length;

  const close = useCallback(() => setIndex(null), [setIndex]);
  const go = useCallback((dir) => setIndex((i) => (i + dir + total) % total), [setIndex, total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close, go]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/90 backdrop-blur-sm"
      onClick={close}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex min-h-full items-center justify-center p-4 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_320px]"
          >
            <div className="mx-auto w-full max-w-xl rounded-[3px] p-3 sm:p-4" style={{ background: GOLD }}>
              <div className="bg-[#fbf8f1] p-3 sm:p-5">
                <img
                  src={ik(cert.image, "w-1600,q-85")}
                  alt={cert.title}
                  className="mx-auto max-h-[70vh] w-auto object-contain"
                />
              </div>
            </div>

            <div className="text-white">
              <p className="text-xs uppercase tracking-[0.35em] text-[#e9cc7a]">
                Certificate {index + 1} of {total}
              </p>
              <h2 className="mt-3 font-serif text-4xl font-medium">{cert.title}</h2>
              {cert.issuer && <p className="mt-2 text-white/70">Issued by {cert.issuer}</p>}
              {cert.cert_number && (
                <p className="mt-5 inline-block rounded bg-white/10 px-3 py-1.5 font-mono text-sm">{cert.cert_number}</p>
              )}
              {cert.description && <p className="mt-5 font-light leading-relaxed text-white/80">{cert.description}</p>}
              {isGst(cert) && (
                <a
                  href={gstVerifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-2 text-sm font-medium text-[#e9cc7a] hover:underline"
                >
                  <ExternalLink className="h-4 w-4" /> Verify on the official GST portal
                </a>
              )}

              {total > 1 && (
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous certificate"
                    className="grid h-12 w-12 place-items-center rounded-full border border-white/30 hover:bg-white hover:text-brand-900"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next certificate"
                    className="grid h-12 w-12 place-items-center rounded-full border border-white/30 hover:bg-white hover:text-brand-900"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ---------- Verification band ---------- */

function VerifyBand() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-left">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <div className="flex-1">
            <p className="font-serif text-2xl font-semibold text-stone-900">Verify us independently</p>
            <p className="mt-1 text-stone-600">
              Our GSTIN can be checked on the official GST portal using "Search Taxpayer".
            </p>
          </div>
          <a
            href={gstVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Open GST portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}