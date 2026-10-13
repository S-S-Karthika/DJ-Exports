import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { useSite } from "../../context/SiteContext";
import { useQuote } from "./QuoteModal";
import SiteLogo from "./SiteLogo";

const leftLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
];
const rightLinks = [
  { to: "/gallery", label: "Gallery" },
  { to: "/certificates", label: "Certified" },
  { to: "/contact", label: "Contact" },
];

// Pages with a dark banner at the top, where the navbar starts transparent
const TRANSPARENT_PAGES = ["/", "/about", "/certificates", "/contact", "/gallery"];
const toTel = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;

export default function Navbar() {
  const { settings, categories } = useSite();
  const { openQuote } = useQuote();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

    // Catalog and category pages also have a dark banner (not product detail pages)
  const isCatalog = /^\/products(\/[^/]+)?\/?$/.test(pathname);
  const transparent = (TRANSPARENT_PAGES.includes(pathname) || isCatalog) && !scrolled;
  const phones = [settings.phone_primary, settings.phone_secondary].filter(Boolean);

  const linkClass = ({ isActive }) =>
    `relative py-2 text-[15px] font-medium tracking-wide transition-colors
     after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:origin-left after:transition-transform after:duration-300
     ${transparent ? "text-white after:bg-white" : "text-stone-800 after:bg-brand-700"}
     ${isActive ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"}`;

  const logo = (sizeClass) => (
    <SiteLogo className={`${sizeClass} rounded-full bg-white p-1 text-xl shadow-md transition-all duration-500`} />
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          transparent
            ? "bg-transparent py-5"
            : "bg-white/90 py-2 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: phone */}
          <div className="hidden flex-1 lg:flex">
            {phones[0] && (
              <a
                href={toTel(phones[0])}
                className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition hover:bg-brand-800"
              >
                <Phone className="h-4 w-4" />
                {phones[0]}
              </a>
            )}
          </div>

          {/* Center: links + logo */}
          <nav className="hidden items-center gap-8 lg:flex">
            {leftLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}

            <div className="group relative">
              <NavLink to="/products" className={(s) => `${linkClass(s)} flex items-center gap-1`}>
                Products
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </NavLink>
              <div className="invisible absolute left-1/2 top-full -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="w-60 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/products/${c.slug}`}
                      className="block rounded-lg px-4 py-2.5 text-sm text-stone-700 transition hover:bg-brand-50 hover:text-brand-800"
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    to="/products"
                    className="mt-1 block border-t border-stone-100 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    View all products →
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/" className="mx-4" aria-label="Home">
              {logo(transparent ? "h-20 w-20" : "h-14 w-14")}
            </Link>

            {rightLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile: logo */}
          <Link to="/" className="lg:hidden" aria-label="Home">
            {logo("h-14 w-14")}
          </Link>

          {/* Right: Get Quote */}
          <div className="hidden flex-1 justify-end lg:flex">
            <button
              type="button"
              onClick={() => openQuote()}
              className={`rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition ${
                transparent
                  ? "bg-white text-brand-900 hover:bg-brand-50"
                  : "bg-brand-700 text-white hover:bg-brand-800"
              }`}
            >
              Get Quote
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`lg:hidden ${transparent ? "text-white" : "text-stone-800"}`}
            aria-label="Open menu"
          >
            <Menu className="h-7 w-7" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}>
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-white shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-100 p-5">
            <span className="font-serif text-xl text-brand-900">{settings.site_name || "Menu"}</span>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6 text-stone-700" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-5">
            {leftLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className="block border-b border-stone-100 py-3.5 text-lg text-stone-800">
                {l.label}
              </NavLink>
            ))}

            <button
              onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
              className="flex w-full items-center justify-between border-b border-stone-100 py-3.5 text-lg text-stone-800"
            >
              Products
              <ChevronDown className={`h-5 w-5 transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileProductsOpen && (
              <div className="border-b border-stone-100 py-2 pl-4">
                {categories.map((c) => (
                  <Link key={c.id} to={`/products/${c.slug}`} className="block py-2 text-stone-600">
                    {c.name}
                  </Link>
                ))}
                <Link to="/products" className="block py-2 font-semibold text-brand-700">
                  View all products →
                </Link>
              </div>
            )}

            {rightLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className="block border-b border-stone-100 py-3.5 text-lg text-stone-800">
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-3 border-t border-stone-100 p-5">
            {phones.map((p) => (
              <a
                key={p}
                href={toTel(p)}
                className="flex items-center justify-center gap-2 rounded-full border border-brand-700 py-3 font-semibold text-brand-700"
              >
                <Phone className="h-4 w-4" /> {p}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openQuote();
              }}
              className="block w-full rounded-full bg-brand-700 py-3 text-center text-sm font-bold uppercase tracking-[0.2em] text-white"
            >
              Get Quote
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}