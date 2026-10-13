import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import Reveal from "./Reveal";
import SplitReveal from "./SplitReveal";
import CottonBranch from "./CottonBranch";
import SiteLogo from "./SiteLogo";
import { useQuote } from "./QuoteModal";
import { useSite } from "../../context/SiteContext";
import { footerTagline } from "../../data/siteContent";

const exploreLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/products", label: "Products" },
  { to: "/gallery", label: "Gallery" },
  { to: "/certificates", label: "Certificates" },
  { to: "/contact", label: "Contact" },
];

// These pages already end with their own call to action
const HIDE_CTA_ON = ["/about", "/contact"];

const toTel = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;

export default function Footer() {
  const { settings, categories } = useSite();
  const { openQuote } = useQuote();
  const { pathname } = useLocation();

  const name = settings.site_name || "DJ EXPORTS";
  const phones = [settings.phone_primary, settings.phone_secondary].filter(Boolean);
  const wa = settings.whatsapp?.replace(/\D/g, "");
  const year = new Date().getFullYear();
  const showCta = !HIDE_CTA_ON.includes(pathname);
  const letters = name.split("");

  const socials = [
    { url: settings.facebook, icon: FaFacebookF, label: "Facebook" },
    { url: settings.instagram, icon: FaInstagram, label: "Instagram" },
    { url: settings.linkedin, icon: FaLinkedinIn, label: "LinkedIn" },
    { url: wa ? `https://wa.me/${wa}` : null, icon: FaWhatsapp, label: "WhatsApp" },
  ].filter((s) => s.url);

  return (
    <footer className="relative overflow-hidden bg-brand-900 text-white">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)" }}
      />
      <div className="absolute -left-40 top-20 h-[28rem] w-[28rem] rounded-full bg-brand-700/40 blur-3xl" />
      <div className="absolute -right-32 bottom-40 h-[28rem] w-[28rem] rounded-full bg-brand-600/25 blur-3xl" />
      <CottonBranch className="absolute -right-8 top-24 hidden h-80 w-60 text-white/[0.06] lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Call to action */}
        {showCta && (
          <div className="flex flex-col items-start justify-between gap-8 border-b border-white/10 py-16 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-brand-100">Start a conversation</p>
              <SplitReveal
                as="h2"
                text="Have a requirement? Let's talk."
                className="mt-4 font-serif text-4xl font-medium leading-tight sm:text-5xl"
              />
            </div>
            <Reveal delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => openQuote()}
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-brand-900 transition hover:bg-brand-50"
                >
                  Get a Quote
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                {wa && (
                  <a
                    href={`https://wa.me/${wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-full border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] transition hover:bg-white/10"
                  >
                    <FaWhatsapp className="h-5 w-5" /> WhatsApp
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        )}

        {/* Columns */}
        <div className={`grid gap-12 pb-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] ${showCta ? "pt-16" : "pt-24"}`}>
          {/* Brand */}
          <Reveal>
            <Link to="/" className="inline-flex items-center gap-3">
              <SiteLogo className="h-14 w-14 rounded-full bg-white p-1 text-lg" />
              <span className="font-serif text-2xl font-semibold">{name}</span>
            </Link>
            <p className="mt-5 max-w-xs font-light leading-relaxed text-brand-100/80">{footerTagline}</p>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-3">
                {socials.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-brand-100 transition hover:-translate-y-1 hover:border-white hover:bg-white hover:text-brand-900"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </Reveal>

          {/* Explore */}
          <Reveal delay={0.1}>
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="mt-6 space-y-3">
              {exploreLinks.map((l) => (
                <li key={l.to}>
                  <FooterLink to={l.to}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Products */}
          <Reveal delay={0.2}>
            <ColumnTitle>Products</ColumnTitle>
            <ul className="mt-6 space-y-3">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <FooterLink to={`/products/${c.slug}`}>{c.name}</FooterLink>
                </li>
              ))}
              <li>
                <FooterLink to="/products" strong>View all products</FooterLink>
              </li>
            </ul>
          </Reveal>

          {/* Contact */}
          <Reveal delay={0.3}>
            <ColumnTitle>Get in touch</ColumnTitle>
            <ul className="mt-6 space-y-4 text-brand-100/80">
              {phones.length > 0 && (
                <ContactItem icon={Phone}>
                  {phones.map((p) => (
                    <a key={p} href={toTel(p)} className="block transition hover:text-white">
                      {p}
                    </a>
                  ))}
                </ContactItem>
              )}
              {settings.email && (
                <ContactItem icon={Mail}>
                  <a href={`mailto:${settings.email}`} className="break-all transition hover:text-white">
                    {settings.email}
                  </a>
                </ContactItem>
              )}
              {settings.address && (
                <ContactItem icon={MapPin}>
                  <span className="leading-relaxed">{settings.address}</span>
                </ContactItem>
              )}
            </ul>
          </Reveal>
        </div>
      </div>

     

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-brand-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p className="sm:mr-20">Karur, Tamil Nadu, India</p>
        </div>
      </div>
    </footer>
  );
}

function ColumnTitle({ children }) {
  return (
    <h3 className="font-serif text-xl font-semibold">
      {children}
      <span className="mt-3 block h-px w-10 bg-brand-500" />
    </h3>
  );
}

function FooterLink({ to, children, strong }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 transition hover:text-white ${
        strong ? "font-medium text-white" : "text-brand-100/80"
      }`}
    >
      <span className="h-px w-0 bg-white transition-all duration-300 group-hover:w-4" />
      {children}
    </Link>
  );
}

function ContactItem({ icon: Icon, children }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-brand-100">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}