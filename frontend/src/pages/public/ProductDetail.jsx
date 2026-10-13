import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, ImageOff, MessageSquareText, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../api/axios";
import Reveal from "../../components/public/Reveal";
import SplitReveal from "../../components/public/SplitReveal";
import ProductCard from "../../components/public/ProductCard";
import { useQuote } from "../../components/public/QuoteModal";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

const paragraphs = (text) => (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export default function ProductDetail() {
  const { productSlug } = useParams();
  const { settings } = useSite();
  const { openQuote } = useQuote();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    api
      .get(`/public/products/${productSlug}`)
      .then((res) => {
        setProduct(res.data);
        setStatus("ok");
      })
      .catch((err) => setStatus(err.response?.status === 404 ? "notfound" : "error"));
  }, [productSlug]);

  useEffect(() => {
    if (product) document.title = `${product.name} | ${settings.site_name || "DJ EXPORTS"}`;
  }, [product, settings.site_name]);

  if (status === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="aspect-square animate-pulse rounded-3xl bg-stone-200" />
        <div className="space-y-4">
          <div className="h-12 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-64 animate-pulse rounded bg-stone-200" />
        </div>
      </div>
    );
  }

  if (status !== "ok") {
    return (
      <div className="px-4 pb-24 pt-40 text-center">
        <h1 className="font-serif text-4xl text-stone-900">
          {status === "notfound" ? "Product not found" : "Something went wrong"}
        </h1>
        <Link to="/products" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
          Browse all products →
        </Link>
      </div>
    );
  }

  const specs = [
    ["Material", product.material],
    ["GSM", product.gsm],
    ["Sizes", product.size],
    ["Colours", product.colors],
    ["MOQ", product.moq],
    ["Packaging", product.packaging],
    ...(Array.isArray(product.specifications) ? product.specifications.map((s) => [s.label, s.value]) : []),
  ].filter(([, v]) => v);

  const enquire = () =>
    openQuote(
      { category_id: String(product.category_id), product_id: String(product.id), product_name: product.name },
      "product_page"
    );

  const wa = settings.whatsapp?.replace(/\D/g, "");
  const waText = `Hello ${settings.site_name || ""}, I'm interested in "${product.name}".\n${window.location.href}\n\nPlease share details and pricing.`;
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(waText)}` : null;

  return (
    <div className="pb-24 pt-28 lg:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <Link to="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-700">Products</Link>
          <span>/</span>
          <Link to={`/products/${product.category_slug}`} className="hover:text-brand-700">{product.category_name}</Link>
          <span>/</span>
          <span className="text-stone-800">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Gallery images={product.images} name={product.name} />

          {/* Info stays pinned while the gallery scrolls */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Link
              to={`/products/${product.category_slug}`}
              className="text-xs font-medium uppercase tracking-[0.35em] text-brand-700 hover:underline"
            >
              {product.category_name}
            </Link>
            <SplitReveal
              key={product.slug}
              as="h1"
              text={product.name}
              inView={false}
              className="mt-3 font-serif text-4xl font-medium leading-[1.1] text-stone-900 sm:text-5xl"
            />
            {product.short_description && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-lg font-light text-stone-600"
              >
                {product.short_description}
              </motion.p>
            )}

            {specs.length > 0 && (
              <motion.dl
                key={product.slug}
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
                className="mt-8 divide-y divide-stone-200 border-y border-stone-200"
              >
                {specs.map(([label, value]) => (
                  <motion.div
                    key={label}
                    variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                    className="grid grid-cols-[130px_1fr] gap-4 py-3.5 text-sm"
                  >
                    <dt className="font-medium uppercase tracking-wider text-stone-500">{label}</dt>
                    <dd className="text-stone-900">{value}</dd>
                  </motion.div>
                ))}
              </motion.dl>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <button
                type="button"
                onClick={enquire}
                className="group relative inline-flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-full bg-brand-700 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-brand-800"
              >
                <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <MessageSquareText className="h-5 w-5" /> Enquire about this product
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#25D366] px-6 py-4 text-sm font-semibold text-[#128C4A] transition hover:bg-[#25D366] hover:text-white"
                >
                  <FaWhatsapp className="h-5 w-5" /> WhatsApp
                </a>
              )}
            </motion.div>
            <p className="mt-4 text-sm text-stone-500">
              Share your size, quantity and packaging needs, and we'll respond with details and pricing.
            </p>
          </div>
        </div>

        {paragraphs(product.description).length > 0 && (
          <section className="mx-auto mt-24 max-w-3xl">
            <Reveal>
              <h2 className="font-serif text-3xl font-semibold text-stone-900">About this product</h2>
            </Reveal>
            {paragraphs(product.description).map((p, i) => (
              <Reveal key={i} delay={0.05}>
                <p className="mt-5 text-lg font-light leading-relaxed text-stone-600">{p}</p>
              </Reveal>
            ))}
          </section>
        )}

        {product.related.length > 0 && (
          <section className="mt-24">
            <SplitReveal
              text={`More from ${product.category_name}`}
              className="font-serif text-3xl font-semibold text-stone-900 sm:text-4xl"
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {product.related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} inView />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ---------- Gallery: zoom, swipe, thumbnails, fullscreen ---------- */

function Gallery({ images, name }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef(null);

  // Reset when navigating to another product
  useEffect(() => setIndex(0), [images]);

  if (!images.length) {
    return (
      <div className="grid aspect-square place-items-center rounded-3xl bg-stone-100 text-stone-400">
        <ImageOff className="h-12 w-12" />
      </div>
    );
  }

  const current = images[Math.min(index, images.length - 1)];
  const go = (dir) => setIndex((i) => (i + dir + images.length) % images.length);

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ active: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div>
      <div
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl bg-white shadow-sm"
        onMouseMove={handleMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        onClick={() => setLightbox(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Outer div zooms toward the cursor; inner image crossfades between photos */}
        <div
          className="h-full w-full transition-transform duration-200 ease-out"
          style={{ transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: `scale(${zoom.active ? 2 : 1})` }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={current.id}
              src={ik(current.image, "w-1200,q-85")}
              alt={name}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
        </div>

        {images.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={(e) => { e.stopPropagation(); go(-1); }} />
            <GalleryArrow side="right" onClick={(e) => { e.stopPropagation(); go(1); }} />
            <span className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur">
              {index + 1} / {images.length}
            </span>
          </>
        )}
        <span className="absolute bottom-4 right-4 hidden rounded-full bg-white/85 px-3 py-1 text-xs text-stone-700 backdrop-blur transition-opacity group-hover:opacity-0 lg:block">
          Hover to zoom · click to expand
        </span>
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              className="relative aspect-square overflow-hidden rounded-xl bg-white"
            >
              <img
                src={ik(img.image, "w-200,q-70")}
                alt=""
                className={`h-full w-full object-cover transition ${i === index ? "" : "opacity-60 hover:opacity-100"}`}
              />
              {i === index && (
                <motion.span
                  layoutId="thumb-ring"
                  className="absolute inset-0 rounded-xl ring-2 ring-inset ring-brand-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <Lightbox images={images} index={index} setIndex={setIndex} name={name} onClose={() => setLightbox(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function GalleryArrow({ side, onClick }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-stone-800 shadow transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function Lightbox({ images, index, setIndex, name, onClose }) {
  const go = (dir) => setIndex((i) => (i + dir + images.length) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose, setIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
        <X className="h-6 w-6" />
      </button>

      <AnimatePresence mode="wait">
        <motion.img
          key={images[index].id}
          src={ik(images[index].image, "w-1800,q-85")}
          alt={name}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-stone-900"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 text-white hover:bg-white hover:text-stone-900"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </motion.div>
  );
}