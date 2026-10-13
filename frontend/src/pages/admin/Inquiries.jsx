import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Building2, Check, Copy, ExternalLink, Globe, Inbox, Loader2, Mail, Phone, Search, Trash2,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../../api/axios";
import { PageHeader, inputClass } from "../../components/admin/ui";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useSite } from "../../context/SiteContext";
import { formatDate, timeAgo } from "../../utils/time";

const STATUSES = [
  { value: "new", label: "New", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-800" },
  { value: "contacted", label: "Contacted", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-800" },
  { value: "closed", label: "Closed", dot: "bg-stone-400", badge: "bg-stone-200 text-stone-700" },
];
const statusOf = (v) => STATUSES.find((s) => s.value === v) || STATUSES[0];
const SOURCE_LABEL = { quote_modal: "Quote popup", contact_page: "Contact page", product_page: "Product page" };

// Tells the sidebar badge to refresh
const notifyChanged = () => window.dispatchEvent(new Event("inquiries:changed"));

export default function Inquiries() {
  const { settings } = useSite();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => Number(params.get("id")) || null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(
    () =>
      api
        .get("/admin/inquiries", { params: { status: filter || undefined, q: q || undefined } })
        .then(({ data }) => {
          setItems(data.items);
          setCounts(data.counts);
        })
        .catch(() => toast.error("Failed to load inquiries"))
        .finally(() => setLoading(false)),
    [filter, q]
  );

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const selected = items.find((i) => i.id === selectedId) || null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const replaceItem = (updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  const setStatus = async (item, status) => {
    if (item.status === status) return;
    try {
      const { data } = await api.patch(`/admin/inquiries/${item.id}/status`, { status });
      replaceItem(data);
      setCounts((c) => ({
        ...c,
        [item.status]: Math.max(0, (c[item.status] || 0) - 1),
        [status]: (c[status] || 0) + 1,
      }));
      notifyChanged();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const saveNote = async (item, note) => {
    const { data } = await api.patch(`/admin/inquiries/${item.id}/note`, { note });
    replaceItem(data);
    toast.success("Note saved");
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/inquiries/${deleting.id}`);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      setCounts((c) => ({ ...c, [deleting.status]: Math.max(0, (c[deleting.status] || 0) - 1) }));
      if (selectedId === deleting.id) setSelectedId(null);
      toast.success("Inquiry deleted");
      setDeleting(null);
      notifyChanged();
    } catch {
      toast.error("Failed to delete inquiry");
    } finally {
      setDeleteBusy(false);
    }
  };

  const tabs = [{ value: "", label: "All", count: total }, ...STATUSES.map((s) => ({ ...s, count: counts[s.value] || 0 }))];

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Every inquiry from the website, including buyers who never pressed Send in WhatsApp or Gmail."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setFilter(t.value);
              setSelectedId(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === t.value ? "bg-brand-700 text-white" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {t.label} <span className={filter === t.value ? "text-white/70" : "text-stone-400"}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, company or country..."
          className={`${inputClass()} pl-10`}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <Inbox className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-4 font-medium text-stone-700">
            {q || filter ? "No inquiries match" : "No inquiries yet"}
          </p>
          <p className="mt-1 text-sm text-stone-500">New inquiries from the website will appear here.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
          {/* List */}
          <div className={`space-y-2 ${selected ? "hidden lg:block" : ""}`}>
            {items.map((i) => {
              const s = statusOf(i.status);
              return (
                <button
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedId === i.id ? "border-brand-600 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate ${i.status === "new" ? "font-bold text-stone-900" : "font-medium text-stone-700"}`}>
                        {i.full_name}
                      </p>
                      <p className="truncate text-sm text-stone-500">
                        {[i.company, i.country].filter(Boolean).join(" · ") || i.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-stone-400">{timeAgo(i.created_at)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${s.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    {(i.product_name || i.category_name) && (
                      <span className="truncate text-stone-500">{i.product_name || i.category_name}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className={selected ? "" : "hidden lg:block"}>
            {selected ? (
              <Detail
                key={selected.id}
                item={selected}
                settings={settings}
                onBack={() => setSelectedId(null)}
                onStatus={setStatus}
                onNote={saveNote}
                onDelete={setDeleting}
              />
            ) : (
              <div className="grid h-64 place-items-center rounded-xl border border-dashed border-stone-300 bg-white text-stone-400">
                Select an inquiry to see the details
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete inquiry?"
        message={`The inquiry from "${deleting?.full_name}" will be permanently deleted. Consider marking it Closed instead.`}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function Detail({ item, settings, onBack, onStatus, onNote, onDelete }) {
  const [note, setNote] = useState(item.admin_note || "");
  const [savingNote, setSavingNote] = useState(false);
  const [copied, setCopied] = useState(null);

  const first = item.full_name.split(" ")[0];
  const about = item.product_name || item.category_name || "our products";
  const company = settings.site_name || "our company";

  // Indian 10-digit numbers without a country code get +91 added
  let digits = (item.phone || "").replace(/\D/g, "");
  const indian10 = digits.length === 10 && /india/i.test(item.country || "");
  if (indian10) digits = `91${digits}`;
  const maybeMissingCode = digits.length === 10;

  const waText = `Hello ${first}, thank you for your inquiry about ${about}. This is ${company}. `;
  const waLink = digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(waText)}` : null;
  const subject = `Re: Your inquiry about ${about}`;
  const body = `Dear ${first},\n\nThank you for your inquiry about ${about}.\n\n\n\nBest regards,\n${company}`;
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Replying moves a New inquiry to Contacted
  const markReplied = () => {
    if (item.status === "new") onStatus(item, "contacted");
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await onNote(item, note);
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const noteDirty = note !== (item.admin_note || "");

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-stone-100 p-6">
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 lg:hidden">
          <ArrowLeft className="h-4 w-4" /> All inquiries
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-stone-900">{item.full_name}</h2>
            <p className="mt-1 text-sm text-stone-500">
              #{item.id} · {formatDate(item.created_at)} · via {SOURCE_LABEL[item.source] || item.source}
              {item.channel && ` · chose ${item.channel === "whatsapp" ? "WhatsApp" : "Email"}`}
            </p>
          </div>
          <div className="flex rounded-lg border border-stone-200 p-1">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => onStatus(item, s.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  item.status === s.value ? "bg-brand-700 text-white" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markReplied}
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
            >
              <FaWhatsapp className="h-4 w-4" /> Reply on WhatsApp
            </a>
          )}
          <a
            href={gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markReplied}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Mail className="h-4 w-4" /> Reply by email
          </a>
          {item.phone && (
            <a
              href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}
              onClick={markReplied}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-stone-400">
          Replying marks a new inquiry as Contacted.
          {maybeMissingCode && " The phone number may be missing its country code. Check before sending on WhatsApp."}
        </p>
      </div>

      {/* Contact details */}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={item.email} copied={copied} onCopy={copy} />
        <InfoRow icon={Phone} label="Phone" value={item.phone} copied={copied} onCopy={copy} />
        {item.company && <InfoRow icon={Building2} label="Company" value={item.company} />}
        {item.country && <InfoRow icon={Globe} label="Country" value={item.country} />}
      </div>

      {/* Requirements */}
      <div className="border-t border-stone-100 p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500">Requirements</h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-stone-500">Product</dt>
            <dd className="mt-0.5 font-medium text-stone-900">
              {item.product_name ? (
                <a
                  href={`/products/${item.product_category_slug}/${item.product_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                >
                  {item.product_name} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Category</dt>
            <dd className="mt-0.5 font-medium text-stone-900">{item.category_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Quantity</dt>
            <dd className="mt-0.5 font-medium text-stone-900">{item.quantity || "—"}</dd>
          </div>
        </dl>
        <div className="mt-4 whitespace-pre-wrap rounded-lg bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
          {item.message || <span className="text-stone-400">No message</span>}
        </div>
      </div>

      {/* Private notes */}
      <div className="border-t border-stone-100 p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-stone-500">Private notes</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. Sent price list on 12 Oct. Follow up next week."
          className={`${inputClass()} mt-3`}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSaveNote}
            disabled={!noteDirty || savingNote}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
          >
            {savingNote && <Loader2 className="h-4 w-4 animate-spin" />}
            Save note
          </button>
        </div>
      </div>

      <div className="flex justify-end border-t border-stone-100 p-4">
        <button
          onClick={() => onDelete(item)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, copied, onCopy }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-stone-500">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="break-all font-medium text-stone-900">{value}</p>
          {onCopy && (
            <button
              onClick={() => onCopy(value)}
              aria-label={`Copy ${label}`}
              className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              {copied === value ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}