import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, Loader2, Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../api/axios";
import { useSite } from "../../context/SiteContext";

const EMPTY = {
  full_name: "", email: "", phone: "", company: "", country: "",
  category_id: "", quantity: "", message: "", website: "",
  product_id: "", product_name: "",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryForm({ source = "contact_page", prefill = {}, compact = false }) {
  const { settings, categories } = useSite();
  const [form, setForm] = useState({ ...EMPTY, ...prefill });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(null); // "whatsapp" | "email" | null
  const [sent, setSent] = useState(null);       // { channel, links } after success
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Please enter your name";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Please enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 7) e.phone = "Please enter a valid phone number";
    return e;
  };

  // Builds the pre-filled WhatsApp and email links from the form
  const buildLinks = () => {
    const categoryName = categories.find((c) => String(c.id) === String(form.category_id))?.name;
    const lines = [
      `Name: ${form.full_name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      form.company && `Company: ${form.company}`,
      form.country && `Country: ${form.country}`,
      categoryName && `Product: ${categoryName}`,
      form.quantity && `Quantity: ${form.quantity}`,
            form.product_name && `Product: ${form.product_name}`,
      categoryName && `Category: ${categoryName}`,
    ].filter(Boolean);

    const text =
      "Hello,\n\nI would like to enquire about the following:\n\n" +
      lines.join("\n") +
      (form.message ? `\n\nRequirements: ${form.message}` : "") +
      "\n\nThank you!";

    const subject = `Website Enquiry from ${form.full_name}${form.country ? ` (${form.country})` : ""}`;
    const wa = settings.whatsapp?.replace(/\D/g, "");
    const to = settings.email;

    return {
      whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null,
      email: to
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
        : null,
      mailto: to
        ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
        : null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Which button was clicked? (Pressing Enter counts as the first button.)
    const channel = e.nativeEvent.submitter?.value === "email" ? "email" : "whatsapp";

    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    const links = buildLinks();
    const target = links[channel];
    if (!target) {
      setServerError(
        channel === "email"
          ? "Email isn't available right now. Please use WhatsApp."
          : "WhatsApp isn't available right now. Please use email."
      );
      return;
    }

    // Open the tab NOW, during the click, so the browser doesn't block it as a popup
    const win = window.open("", "_blank");
    if (win) win.opener = null;

    setSending(channel);
    setServerError("");
    try {
      await api.post("/inquiries", { ...form, source, channel });
      if (win) win.location.href = target;
      else window.location.href = target; // popup was blocked: open in this tab
      setSent({ channel, links });
    } catch (err) {
      win?.close();
      setErrors(err.response?.data?.errors || {});
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSending(null);
    }
  };

  if (sent) {
    return (
      <SuccessView
        name={form.full_name}
        sent={sent}
        onReset={() => {
          setForm({ ...EMPTY, ...prefill });
          setSent(null);
        }}
      />
    );
  }

  const hasWhatsApp = Boolean(settings.whatsapp);
  const hasEmail = Boolean(settings.email);

  return (
    <form onSubmit={handleSubmit} noValidate className="relative space-y-4">
      {/* Honeypot: hidden from people, bots fill it in */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={handleChange} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput label="Full name" name="full_name" required value={form.full_name} onChange={handleChange} error={errors.full_name} autoComplete="name" />
        <FloatInput label="Email" name="email" type="email" required value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
        <FloatInput label="Phone / WhatsApp" name="phone" type="tel" required value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
        <FloatInput label="Country" name="country" value={form.country} onChange={handleChange} error={errors.country} autoComplete="country-name" />
        {!compact && (
          <FloatInput label="Company" name="company" value={form.company} onChange={handleChange} error={errors.company} autoComplete="organization" />
        )}
        <FloatSelect
          label="Product category"
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          options={categories}
          className={compact ? "sm:col-span-2" : ""}
        />
        {!compact && (
          <FloatInput label="Approx. quantity (e.g. 2000 pcs)" name="quantity" value={form.quantity} onChange={handleChange} error={errors.quantity} className="sm:col-span-2" />
        )}
      </div>

      <FloatInput
        as="textarea"
        label="Your requirements (size, GSM, colours, packaging...)"
        name="message"
        value={form.message}
        onChange={handleChange}
        error={errors.message}
      />

      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}

      <div className={`grid gap-3 ${hasWhatsApp && hasEmail ? "sm:grid-cols-2" : ""}`}>
        {hasWhatsApp && (
          <button
            type="submit"
            value="whatsapp"
            disabled={Boolean(sending)}
            className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#25D366] py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:brightness-95 disabled:opacity-70"
          >
            <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {sending === "whatsapp" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FaWhatsapp className="h-5 w-5" />}
            Send via WhatsApp
          </button>
        )}
        {hasEmail && (
          <button
            type="submit"
            value="email"
            disabled={Boolean(sending)}
            className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-brand-700 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-brand-800 disabled:opacity-70"
          >
            <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {sending === "email" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Send via Email
          </button>
        )}
      </div>

      <p className="text-center text-xs text-stone-400">Your details are used only to respond to your inquiry.</p>
    </form>
  );
}

function FloatInput({ label, name, value, onChange, error, required, type = "text", as, className = "", ...rest }) {
  const Tag = as === "textarea" ? "textarea" : "input";
  return (
    <div className={`relative ${className}`}>
      <Tag
        id={name}
        name={name}
        type={as === "textarea" ? undefined : type}
        rows={as === "textarea" ? 4 : undefined}
        value={value}
        onChange={onChange}
        placeholder=" "
        className={`peer w-full rounded-xl border bg-white/80 px-4 pb-2.5 pt-6 text-stone-900 outline-none transition focus:bg-white focus:ring-4 ${
          as === "textarea" ? "resize-none" : ""
        } ${error ? "border-red-400 focus:ring-red-100" : "border-stone-300 focus:border-brand-600 focus:ring-brand-100"}`}
        {...rest}
      />
      <label
        htmlFor={name}
        className="pointer-events-none absolute left-4 top-4 text-stone-500 transition-all duration-200 peer-focus:top-2 peer-focus:text-xs peer-focus:text-brand-700 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function FloatSelect({ label, name, value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-xl border border-stone-300 bg-white/80 px-4 pb-2.5 pt-6 text-stone-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
      >
        <option value="">Not sure / Other</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <label htmlFor={name} className="pointer-events-none absolute left-4 top-2 text-xs text-stone-500">
        {label}
      </label>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
    </div>
  );
}

function SuccessView({ name, sent, onReset }) {
  const isWhatsApp = sent.channel === "whatsapp";

  return (
    <div className="py-6 text-center">
      <svg viewBox="0 0 52 52" className="mx-auto h-20 w-20 text-brand-600">
        <motion.circle
          cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }}
        />
        <motion.path
          d="M15 27 l7 7 l15 -15" fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }}
        />
      </svg>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <h3 className="mt-6 font-serif text-3xl font-semibold text-stone-900">
          Almost done, {name.split(" ")[0]}!
        </h3>
        <p className="mt-2 text-stone-600">
          {isWhatsApp ? "WhatsApp" : "Your email"} has opened in a new tab with your inquiry ready.
          <br />
          Press <strong>Send</strong> there to reach us.
        </p>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          {isWhatsApp ? (
            <a href={sent.links.whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
              WhatsApp didn't open? Tap here
            </a>
          ) : (
            <>
              <a href={sent.links.email} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                Gmail didn't open? Tap here
              </a>
              {sent.links.mailto && (
                <a href={sent.links.mailto} className="text-stone-500 hover:underline">
                  Use another email app
                </a>
              )}
            </>
          )}
        </div>

        <button type="button" onClick={onReset} className="mx-auto mt-8 block text-sm text-stone-500 hover:text-stone-800">
          Send another inquiry
        </button>
      </motion.div>
    </div>
  );
}