import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useSite } from "../../context/SiteContext";

export default function FloatingButtons() {
  const { settings } = useSite();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const number = settings.whatsapp?.replace(/\D/g, "");
  const greeting = settings.site_name ? `Hello ${settings.site_name}, ` : "Hello, ";
  const waLink = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(greeting + "I would like to know more about your products.")}`
    : null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />
          <FaWhatsapp className="relative h-7 w-7" />
        </a>
      )}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={`grid h-12 w-12 place-items-center rounded-full bg-brand-800 text-white shadow-lg transition-all duration-300 hover:bg-brand-700 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}