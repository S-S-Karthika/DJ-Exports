import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../api/axios";
import Reveal from "./Reveal";
import SplitReveal from "./SplitReveal";
import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/public/products", { params: { featured: 1, limit: 8 } })
      .then((res) => setItems(res.data))
      .catch((err) => console.error("Failed to load featured products:", err));
  }, []);

  // Hidden until the owner marks products as Featured
  if (!items.length) return null;

  return (
    <section className="bg-white/60 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-brand-700">
            <span className="h-px w-10 bg-brand-700" /> Featured
          </p>
          <SplitReveal
            text="Handpicked for international buyers"
            className="mt-5 font-serif text-4xl font-medium text-stone-900 sm:text-5xl"
          />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} inView />
          ))}
        </div>

        <Reveal delay={0.2} className="mt-14 text-center">
          <Link
            to="/products"
            className="group inline-flex items-center gap-3 rounded-full bg-brand-700 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-brand-800"
          >
            View full catalogue
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}