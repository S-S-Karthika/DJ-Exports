import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import InquiryForm from "./InquiryForm";
import CottonBranch from "./CottonBranch";
import SiteLogo from "./SiteLogo";
import { useSite } from "../../context/SiteContext";

const QuoteContext = createContext({ openQuote: () => {} });
export const useQuote = () => useContext(QuoteContext);

export function QuoteProvider({ children }) {
  const [state, setState] = useState({ open: false, prefill: {}, source: "quote_modal" });
  const openQuote = useCallback(
    (prefill = {}, source = "quote_modal") => setState({ open: true, prefill, source }),
    []
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return (
    <QuoteContext.Provider value={{ openQuote }}>
      {children}
      <AnimatePresence>
        {state.open && <QuoteModal prefill={state.prefill} source={state.source} onClose={close} />}
      </AnimatePresence>
    </QuoteContext.Provider>
  );
}

const points = ["Quality products", "Competitive pricing", "Transparent communication"];

function QuoteModal({ prefill, source, onClose }) {
  const { settings } = useSite();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Request a quote"
          className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[0.85fr_1.15fr]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:rotate-90 hover:bg-stone-200"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Brand panel */}
          <div className="relative hidden overflow-hidden bg-brand-900 p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-700/50 blur-3xl" />
            <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
            <CottonBranch className="absolute -right-6 bottom-0 h-72 w-56 text-white/15" />

            <SiteLogo className="relative h-16 w-16 rounded-full bg-white p-1" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-100">{settings.site_name}</p>
              <h2 className="mt-4 font-serif text-4xl font-medium leading-tight">
                Quality home textiles, from Karur to the world.
              </h2>
              <ul className="mt-8 space-y-3">
                {points.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.12 }}
                    className="flex items-center gap-3 text-brand-50"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-10">
            <h2 className="pr-12 font-serif text-3xl font-semibold text-stone-900">Request a Quote</h2>
            {prefill.product_name ? (
              <p className="mt-2 text-stone-500">
                Enquiring about <span className="font-semibold text-brand-700">{prefill.product_name}</span>
              </p>
            ) : (
              <p className="mt-2 text-stone-500">Share your requirements, and we'll get back to you.</p>
            )}
            <div className="mt-6">
              <InquiryForm source={source} prefill={prefill} compact />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}