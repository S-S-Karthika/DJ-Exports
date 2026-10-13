import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, ImageOff, MessageSquareText } from "lucide-react";
import { useQuote } from "./QuoteModal";
import { ik } from "../../utils/image";

export default function ProductCard({ product, index = 0, inView = false }) {
  const { openQuote } = useQuote();
  const ref = useRef(null);

  // Cursor position over the card, 0 to 1
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spring = { stiffness: 200, damping: 20 };
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-7, 7]), spring);
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.35), transparent 55%)`;

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const url = `/products/${product.category_slug}/${product.slug}`;
  const shown = { opacity: 1, y: 0, scale: 1 };
  const reveal = inView ? { whileInView: shown, viewport: { once: true, margin: "-50px" } } : { animate: shown };

  const enquire = () =>
    openQuote(
      { category_id: String(product.category_id), product_id: String(product.id), product_name: product.name },
      "product_page"
    );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      {...reveal}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.08,
        ease: [0.22, 1, 0.36, 1],
        layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY }}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_15px_40px_-20px_rgba(20,46,17,0.35)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(20,46,17,0.5)]"
      >
        <Link to={url} className="block">
          <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
            {product.image ? (
              <>
                <img
                  src={ik(product.image, "w-600,h-750,q-80")}
                  alt={product.name}
                  loading="lazy"
                  className={`h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
                    product.image_hover ? "group-hover:opacity-0" : ""
                  }`}
                />
                {product.image_hover && (
                  <img
                    src={ik(product.image_hover, "w-600,h-750,q-80")}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
                  />
                )}
              </>
            ) : (
              <div className="grid h-full place-items-center text-stone-400">
                <ImageOff className="h-10 w-10" />
              </div>
            )}

            {/* Moving light glare */}
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: glare }}
            />

            <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-brand-800 backdrop-blur">
              {product.category_name}
            </span>
            {product.gsm && (
              <span className="absolute right-4 top-4 rounded-full bg-brand-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {product.gsm} GSM
              </span>
            )}
            <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-4 place-items-center rounded-full bg-white text-brand-900 opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>

          <div className="p-5">
            <h3 className="font-serif text-2xl font-semibold leading-tight text-stone-900 transition-colors group-hover:text-brand-700">
              {product.name}
            </h3>
            {product.short_description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-stone-500">{product.short_description}</p>
            )}
          </div>
        </Link>

        <div className="mt-auto flex items-center justify-between border-t border-stone-100 px-5 py-3">
          <span className="text-xs uppercase tracking-wider text-stone-400">
            {product.moq ? `MOQ ${product.moq}` : product.material || ""}
          </span>
          <button
            type="button"
            onClick={enquire}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-900"
          >
            <MessageSquareText className="h-4 w-4" /> Enquire
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}