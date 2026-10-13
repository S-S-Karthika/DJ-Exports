import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { PackageSearch } from "lucide-react";
import api from "../../api/axios";
import SplitReveal from "../../components/public/SplitReveal";
import ProductCard from "../../components/public/ProductCard";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

export default function ProductsPage() {
  const { categorySlug } = useParams();
  const { categories, settings } = useSite();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/public/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoading(false));
  }, []);

  const category = categories.find((c) => c.slug === categorySlug);
  const visible = categorySlug ? products.filter((p) => p.category_slug === categorySlug) : products;

  useEffect(() => {
    document.title = `${category?.name || "Products"} | ${settings.site_name || "DJ EXPORTS"}`;
  }, [category?.name, settings.site_name]);

  // Unknown category URL (only decide once categories have loaded)
  if (categorySlug && categories.length && !category) {
    return (
      <div className="px-4 pb-24 pt-40 text-center">
        <h1 className="font-serif text-4xl text-stone-900">Category not found</h1>
        <Link to="/products" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
          Browse all products →
        </Link>
      </div>
    );
  }

  return (
    <>
      <Banner category={category} />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2">
            <FilterPill to="/products" active={!categorySlug} label="All" count={products.length} />
            {categories.map((c) => (
              <FilterPill
                key={c.id}
                to={`/products/${c.slug}`}
                active={c.slug === categorySlug}
                label={c.name}
                count={products.filter((p) => p.category_slug === c.slug).length}
              />
            ))}
          </div>

          {category?.description && (
            <motion.p
              key={category.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-10 max-w-3xl text-center text-lg font-light leading-relaxed text-stone-600"
            >
              {category.description}
            </motion.p>
          )}

          {loading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/6] animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <PackageSearch className="mx-auto h-12 w-12 text-stone-400" strokeWidth={1.5} />
              <p className="mt-4 font-serif text-2xl text-stone-900">Products coming soon</p>
              <p className="mt-2 text-stone-500">Contact us for details on this range.</p>
              <Link to="/contact" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">
                Contact us →
              </Link>
            </div>
          ) : (
            <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {visible.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

function Banner({ category }) {
  const title = category?.name || "Our Products";
  const text =
    category?.short_description || "Kitchen, table, bath and bed linen from Karur, for buyers around the world.";

  return (
    <section className="relative flex min-h-[440px] items-end overflow-hidden bg-brand-900 pb-16 pt-40 text-white">
      <AnimatePresence mode="wait">
        {category?.image && (
          <motion.img
            key={category.image}
            src={ik(category.image, "w-1920,q-80")}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 h-full w-full animate-kenburns object-cover"
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-linear-to-t from-brand-900 via-brand-900/60 to-brand-900/30" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          {category ? (
            <>
              <Link to="/products" state={{ keepScroll: true }} className="hover:text-white">Products</Link>
              <span>/</span>
              <span className="text-white">{category.name}</span>
            </>
          ) : (
            <span className="text-white">Products</span>
          )}
        </nav>
        <SplitReveal
          key={title}
          as="h1"
          text={title}
          inView={false}
          className="mt-4 font-serif text-5xl font-medium leading-[1.05] sm:text-7xl"
        />
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 max-w-2xl text-lg font-light text-brand-50/80"
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}

function FilterPill({ to, active, label, count }) {
  return (
    <Link
      to={to}
      state={{ keepScroll: true }}
      className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
        active ? "text-white" : "border border-stone-200 bg-white text-stone-600 hover:text-brand-800"
      }`}
    >
      {active && (
        <motion.span
          layoutId="filter-pill"
          className="absolute inset-0 rounded-full bg-brand-700"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative">
        {label} <span className={active ? "text-white/70" : "text-stone-400"}>{count}</span>
      </span>
    </Link>
  );
}