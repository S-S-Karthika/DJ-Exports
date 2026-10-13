import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SplitReveal from "./SplitReveal";
import api from "../../api/axios";
import { ik } from "../../utils/image";


const DURATION = 6000; // ms per slide
const pad = (n) => String(n).padStart(2, "0");

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const touchX = useRef(null);

  useEffect(() => {
    api
      .get("/public/hero-slides")
      .then((res) => setSlides(res.data))
      .catch((err) => console.error("Failed to load slides:", err))
      .finally(() => setLoading(false));
  }, []);

  const total = slides.length;
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Autoplay: restarts whenever the slide changes (including manual clicks)
  useEffect(() => {
    if (total < 2) return;
    const timer = setTimeout(next, DURATION);
    return () => clearTimeout(timer);
  }, [current, total, next]);

  // Swipe support on mobile
  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
    touchX.current = null;
  };

  if (loading) {
    return <section className="h-[100svh] min-h-[600px] animate-pulse bg-brand-900" />;
  }

  // Fallback if the admin hasn't added any slides yet
  if (!total) {
    return (
      <section className="grid h-[100svh] min-h-[600px] place-items-center bg-linear-to-br from-brand-900 to-brand-700 px-6 text-center text-white">
        <div>
          <p className="text-sm uppercase tracking-[0.45em] text-white/80">Global Exporters</p>
          <h1 className="mt-6 font-serif text-5xl sm:text-7xl">Premium Textiles from India</h1>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  return (
    <section
      className="relative h-[100svh] min-h-[600px] overflow-hidden bg-brand-900"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      {/* Images (stacked, crossfade) */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ${
            i === current ? "z-10 opacity-100" : "z-0 opacity-0"
          }`}
          aria-hidden={i !== current}
        >
          <img
            src={ik(s.image, "w-1920,q-80")}
            alt={s.title}
            loading={i === 0 ? "eager" : "lazy"}
            className={`h-full w-full object-cover ${i === current ? "animate-kenburns" : ""}`}
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-20 bg-linear-to-b from-black/50 via-black/25 to-black/60" />

      {/* Text: key={current} replays the animation on every slide */}
            <div className="relative z-30 flex h-full items-center justify-center px-6 pb-28 text-center">
                <div key={current} className="max-w-5xl">
          {slide.subtitle && (
            <p className="animate-tracking-in text-xs font-medium uppercase tracking-[0.45em] text-white/90 sm:text-sm">
              {slide.subtitle}
            </p>
          )}

          <SplitReveal
            as="h1"
            text={slide.title}
            inView={false}
            delay={0.3}
            className="mt-6 font-serif text-5xl font-medium leading-[1.05] text-white sm:text-7xl lg:text-[6.5rem]"
          />

          {slide.button_text && (
            <Link
              to={slide.button_link || "/contact"}
              className="animate-fade-up mt-10 inline-flex items-center gap-3 rounded-full bg-brand-700 px-9 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-black/20 transition-all hover:gap-5 hover:bg-brand-600"
              style={{ animationDelay: "900ms" }}
            >
              {slide.button_text}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {total > 1 && (
        <>
          {/* Arrows (desktop) */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-brand-900 md:grid lg:left-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white hover:text-brand-900 md:grid lg:right-8"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Numbered pagination with progress line */}
          <div className="absolute bottom-32 left-1/2 z-30 flex -translate-x-1/2 items-center gap-5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="flex items-center gap-3"
              >
                <span
                  className={`text-sm font-semibold transition-colors ${
                    i === current ? "text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {pad(i + 1)}
                </span>
                {i === current && (
                  <span className="relative h-0.5 w-16 overflow-hidden bg-white/30">
                    <span
                      key={current}
                      className="absolute inset-y-0 left-0 animate-progress bg-white"
                      style={{ animationDuration: `${DURATION}ms` }}
                    />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}