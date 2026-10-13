import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Images, X, ZoomIn } from "lucide-react";
import api from "../../api/axios";
import SplitReveal from "../../components/public/SplitReveal";
import { useSite } from "../../context/SiteContext";
import { GALLERY_SECTIONS, sectionLabel } from "../../data/gallerySections";
import { ik } from "../../utils/image";

// 1 column on phones, 2 on tablets, 3 on desktop
function useColumnCount() {
  const get = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
  const [count, setCount] = useState(get);
  useEffect(() => {
    const onResize = () => setCount(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
}

export default function GalleryPage() {
  const { settings } = useSite();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const columnCount = useColumnCount();

  useEffect(() => {
    api
      .get("/public/gallery")
      .then((res) => setItems(res.data))
      .catch((err) => console.error("Failed to load gallery:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = `Gallery | ${settings.site_name || "DJ EXPORTS"}`;
  }, [settings.site_name]);

  const visible = useMemo(() => (filter ? items.filter((i) => i.section === filter) : items), [items, filter]);

  // Masonry: each photo goes into the currently shortest column
  const columns = useMemo(() => {
    const cols = Array.from({ length: columnCount }, () => ({ height: 0, entries: [] }));
    visible.forEach((item, index) => {
      const ratio = item.width && item.height ? item.height / item.width : 0.75;
      const shortest = cols.reduce((a, b) => (b.height < a.height ? b : a));
      shortest.entries.push({ item, index });
      shortest.height += ratio;
    });
    return cols;
  }, [visible, columnCount]);

  // Only sections that actually have photos
  const sections = GALLERY_SECTIONS.filter((s) => items.some((i) => i.section === s.value));

  return (
    <>
      <Banner items={items} />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {sections.length > 1 && (
            <div className="mb-12 flex flex-wrap justify-center gap-2">
              <Pill active={!filter} onClick={() => setFilter("")} label="All" count={items.length} />
              {sections.map((s) => (
                <Pill
                  key={s.value}
                  active={filter === s.value}
                  onClick={() => setFilter(s.value)}
                  label={s.label}
                  count={items.filter((i) => i.section === s.value).length}
                />
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={`animate-pulse rounded-2xl bg-stone-200 ${i % 2 ? "h-80" : "h-56"}`} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <Images className="mx-auto h-12 w-12 text-stone-400" strokeWidth={1.5} />
              <p className="mt-4 font-serif text-2xl text-stone-900">Photos coming soon</p>
              <p className="mt-2 text-stone-500">We're putting together a look behind the scenes.</p>
            </div>
          ) : (
            // key={filter} replays the reveal animation every time the filter changes
            <div key={filter} className="flex gap-5">
              {columns.map((col, ci) => (
                <div key={ci} className="flex min-w-0 flex-1 flex-col gap-5">
                  {col.entries.map(({ item, index }, ri) => (
                    <Tile key={item.id} item={item} delay={(ci + ri) * 0.08} onOpen={() => setOpenIndex(index)} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {openIndex !== null && visible[openIndex] && (
          <Lightbox items={visible} index={openIndex} setIndex={setOpenIndex} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Banner with a drifting photo wall ---------- */

function Banner({ items }) {
  const strip = items.slice(0, 12);
  const rowA = strip.filter((_, i) => i % 2 === 0);
  const rowB = strip.filter((_, i) => i % 2 === 1);

  return (
    <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-brand-900 pb-20 pt-40 text-white">
      {strip.length >= 4 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-5 opacity-35" aria-hidden="true">
          <MosaicRow images={rowA} />
          <MosaicRow images={rowB} reverse />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(20,46,17,0.55), rgba(20,46,17,0.97) 75%)" }}
      />

      <div className="relative px-6 text-center">
        <p className="animate-tracking-in text-xs font-medium uppercase tracking-[0.45em] text-brand-100 sm:text-sm">
          Behind the scenes
        </p>
        <SplitReveal
          as="h1"
          text="Our Gallery"
          inView={false}
          delay={0.3}
          className="mt-5 font-serif text-5xl font-medium sm:text-7xl"
        />
        <p className="animate-fade-up mx-auto mt-5 max-w-xl text-lg font-light text-brand-50/80" style={{ animationDelay: "800ms" }}>
          From the looms of Karur to the shipping carton: how our home textiles are made, checked and packed.
        </p>
        <nav
          aria-label="Breadcrumb"
          className="animate-fade-up mt-6 flex items-center justify-center gap-2 text-sm text-white/70"
          style={{ animationDelay: "950ms" }}
        >
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-white">Gallery</span>
        </nav>
      </div>
    </section>
  );
}

function MosaicRow({ images, reverse }) {
  // Repeat the photos so the row is wide enough, then double it for a seamless loop
  const list = [...images, ...images, ...images];
  return (
    <div className="overflow-hidden">
      <div className={`flex w-max animate-marquee gap-5 ${reverse ? "[animation-direction:reverse]" : ""}`}>
        {[...list, ...list].map((img, i) => (
          <img
            key={i}
            src={ik(img.image, "w-400,h-280,q-60")}
            alt=""
            loading="lazy"
            className="h-44 w-64 shrink-0 rounded-2xl object-cover"
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Filter pill ---------- */

function Pill({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
        active ? "text-white" : "border border-stone-200 bg-white text-stone-600 hover:text-brand-800"
      }`}
    >
      {active && (
        <motion.span
          layoutId="gallery-pill"
          className="absolute inset-0 rounded-full bg-brand-700"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative">
        {label} <span className={active ? "text-white/70" : "text-stone-400"}>{count}</span>
      </span>
    </button>
  );
}

/* ---------- A photo in the masonry ---------- */

function Tile({ item, delay, onOpen }) {
  const ratio = item.width && item.height ? `${item.width} / ${item.height}` : "4 / 3";
  const ease = [0.77, 0, 0.175, 1];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`View ${item.title || sectionLabel(item.section)}`}
      initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1, delay, ease }}
      className="group relative block w-full overflow-hidden rounded-2xl bg-stone-200 text-left"
      style={{ aspectRatio: ratio }}
    >
      {/* Outer div: hover zoom. Inner image: zooms out as it is revealed. */}
      <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
        <motion.img
          src={ik(item.image, "w-800,q-80")}
          alt={item.title || sectionLabel(item.section)}
          loading="lazy"
          initial={{ scale: 1.25 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-linear-to-t from-brand-900/85 via-brand-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <span className="absolute right-4 top-4 grid h-10 w-10 -translate-y-2 place-items-center rounded-full bg-white/90 text-brand-900 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <ZoomIn className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-100">{sectionLabel(item.section)}</p>
        {item.title && <p className="mt-1 font-serif text-xl">{item.title}</p>}
      </div>
    </motion.button>
  );
}

/* ---------- Fullscreen viewer ---------- */

function Lightbox({ items, index, setIndex }) {
  const touchX = useRef(null);
  const item = items[index];
  const total = items.length;
  const close = () => setIndex(null);
  const go = (dir) => setIndex((i) => (i + dir + total) % total);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % total);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + total) % total);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [total, setIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
      onClick={close}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
        <X className="h-6 w-6" />
      </button>

      <AnimatePresence mode="wait">
        <motion.figure
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-full flex-col items-center"
        >
          <img
            src={ik(item.image, "w-1800,q-85")}
            alt={item.title || sectionLabel(item.section)}
            className="max-h-[78vh] max-w-full rounded-lg object-contain"
          />
          <figcaption className="mt-4 text-center text-white">
            <span className="text-xs uppercase tracking-[0.3em] text-brand-100">{sectionLabel(item.section)}</span>
            {item.title && <p className="mt-1 font-serif text-xl">{item.title}</p>}
          </figcaption>
        </motion.figure>
      </AnimatePresence>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-stone-900 sm:grid"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-stone-900 sm:grid"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {index + 1} / {total}
          </span>
        </>
      )}
    </motion.div>
  );
}