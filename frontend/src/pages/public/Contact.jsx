import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Copy, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import Reveal from "../../components/public/Reveal";
import SplitReveal from "../../components/public/SplitReveal";
import CottonBranch from "../../components/public/CottonBranch";
import InquiryForm from "../../components/public/InquiryForm";
import { useSite } from "../../context/SiteContext";

const toTel = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;

export default function Contact() {
  const { settings } = useSite();

  useEffect(() => {
    document.title = `Contact | ${settings.site_name || "DJ EXPORTS"}`;
  }, [settings.site_name]);

  const phones = [settings.phone_primary, settings.phone_secondary].filter(Boolean);
  const wa = settings.whatsapp?.replace(/\D/g, "");
  const mapsLink = settings.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;

  const cards = [
    phones.length > 0 && {
      icon: Phone,
      label: "Call us",
      lines: phones.map((p) => ({ text: p, href: toTel(p), copy: p })),
    },
    settings.email && {
      icon: Mail,
      label: "Email us",
      lines: [{ text: settings.email, href: `mailto:${settings.email}`, copy: settings.email }],
    },
    wa && {
      icon: FaWhatsapp,
      label: "WhatsApp",
      lines: [{ text: "Chat with us", href: `https://wa.me/${wa}`, external: true }],
    },
    settings.address && {
      icon: MapPin,
      label: "Visit us",
      lines: [{ text: settings.address, href: mapsLink, external: true, small: true }],
    },
  ].filter(Boolean);

  const socials = [
    { url: settings.facebook, icon: FaFacebookF, label: "Facebook" },
    { url: settings.instagram, icon: FaInstagram, label: "Instagram" },
    { url: settings.linkedin, icon: FaLinkedinIn, label: "LinkedIn" },
  ].filter((s) => s.url);

  const marqueeText = "Let's Talk · Get in Touch · ";

  return (
    <>
      {/* Banner */}
      <section className="relative overflow-hidden bg-brand-900 pb-32 pt-40 text-white">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-brand-500/20 blur-3xl" />

        {/* Giant outlined words drifting behind */}
        <div className="pointer-events-none absolute inset-x-0 bottom-10 select-none overflow-hidden whitespace-nowrap" aria-hidden="true">
          <div className="inline-block animate-marquee font-serif text-[8rem] font-semibold leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)] sm:text-[12rem]">
            {marqueeText.repeat(4)}
            {marqueeText.repeat(4)}
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <p className="animate-tracking-in text-xs font-medium uppercase tracking-[0.45em] text-brand-100 sm:text-sm">
            Contact Us
          </p>
          <SplitReveal
            as="h1"
            text="Let's talk business"
            inView={false}
            delay={0.3}
            className="mt-5 font-serif text-5xl font-medium leading-[1.05] sm:text-7xl"
          />
          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-lg font-light text-brand-50/80"
            style={{ animationDelay: "800ms" }}
          >
            Share your requirements, and we'll respond with product details and pricing.
          </p>
          <nav
            aria-label="Breadcrumb"
            className="animate-fade-up mt-6 flex items-center justify-center gap-2 text-sm text-white/70"
            style={{ animationDelay: "950ms" }}
          >
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white">Contact</span>
          </nav>
        </div>
      </section>

      {/* Cards + form */}
      <section className="relative z-10 -mt-16 pb-24">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="space-y-4">
            {cards.map((c, i) => (
              <ContactCard key={c.label} {...c} index={i} />
            ))}

            {socials.length > 0 && (
              <Reveal delay={0.4}>
                <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">Follow us</p>
                  <div className="flex gap-2">
                    {socials.map(({ url, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 transition hover:-translate-y-1 hover:border-brand-700 hover:bg-brand-700 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          <Reveal delay={0.15}>
            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_30px_70px_-25px_rgba(20,46,17,0.35)] sm:p-10">
              <CottonBranch className="absolute -right-10 -top-6 h-48 w-40 text-brand-700/10" />
              <p className="relative flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-brand-700">
                <span className="h-px w-10 bg-brand-700" /> Send an inquiry
              </p>
              <h2 className="relative mt-3 font-serif text-4xl font-medium text-stone-900">Tell us what you need</h2>
              <p className="relative mt-2 text-stone-500">
                Product, size, quantity, packaging: the more you share, the more accurate our quote.
              </p>
              <div className="relative mt-8">
                <InquiryForm source="contact_page" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Map */}
      {settings.map_embed && (
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border-8 border-white shadow-xl">
              <iframe
                src={settings.map_embed}
                title="Our location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[450px] w-full grayscale transition duration-700 hover:grayscale-0"
              />
              {settings.address && (
                <div className="pointer-events-none absolute bottom-6 left-6 max-w-xs rounded-2xl bg-white/95 p-5 shadow-lg backdrop-blur">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
                    <p className="text-sm text-stone-700">{settings.address}</p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}

function ContactCard({ icon: Icon, label, lines, index }) {
  const [copied, setCopied] = useState(null);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex gap-5 overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow duration-500 hover:shadow-xl"
    >
      <span className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-brand-600 transition-transform duration-500 group-hover:scale-y-100" />
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-all duration-500 group-hover:rotate-6 group-hover:bg-brand-700 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-stone-500">{label}</p>
        {lines.map((l) => (
          <div key={l.text} className="mt-1.5 flex items-center gap-2">
            <a
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`break-words transition-colors hover:text-brand-700 ${
                l.small ? "text-stone-700" : "font-serif text-xl font-semibold text-stone-900"
              }`}
            >
              {l.text}
            </a>
            {l.copy && (
              <button
                type="button"
                onClick={() => copy(l.copy)}
                aria-label={`Copy ${l.copy}`}
                className="shrink-0 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              >
                {copied === l.copy ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}