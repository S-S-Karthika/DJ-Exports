import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Loader2, Save } from "lucide-react";
import api from "../../api/axios";
import { Card, Field, PageHeader, inputClass } from "../../components/admin/ui";

const EMPTY = {
  site_name: "", phone_primary: "", phone_secondary: "", email: "", whatsapp: "",
  address: "", facebook: "", instagram: "", linkedin: "", map_embed: "",
};

// Convert DB data (which has NULLs and extra columns) into clean form values
const toForm = (data) =>
  Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data?.[k] ?? ""]));

export default function Settings() {
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then((res) => {
        const f = toForm(res.data);
        setForm(f);
        setOriginal(f);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);

  // Warn before closing or refreshing the tab with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/admin/settings", form);
      const f = toForm(data);
      setForm(f);
      setOriginal(f);
      setErrors({});
      toast.success("Settings saved");
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setForm(original);
    setErrors({});
  };

  const field = (name, label, opts = {}) => (
    <Field label={label} hint={opts.hint} error={errors[name]} required={opts.required}>
      {opts.textarea ? (
        <textarea
          name={name}
          rows={opts.rows || 3}
          value={form[name]}
          onChange={handleChange}
          placeholder={opts.placeholder}
          className={inputClass(errors[name])}
        />
      ) : (
        <input
          type={opts.type || "text"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={opts.placeholder}
          className={inputClass(errors[name])}
        />
      )}
    </Field>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const waNumber = form.whatsapp.replace(/\D/g, "");

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="Settings"
        description="Contact details shown across the website, navbar, footer and contact page."
      />

      <div className="space-y-6">
        <Card title="Company">
          {field("site_name", "Company name", { required: true, placeholder: "DJ EXPORTS" })}
        </Card>

        <Card title="Contact details" description="Phone 2 is optional. Leave it empty to hide it on the website.">
          <div className="grid gap-5 sm:grid-cols-2">
            {field("phone_primary", "Phone 1", { required: true, placeholder: "+91 98765 43210" })}
            {field("phone_secondary", "Phone 2", { placeholder: "+91 98765 43210" })}
            {field("email", "Email", { type: "email", required: true, placeholder: "info@djexports.com" })}
            <Field
              label="WhatsApp number"
              required
              error={errors.whatsapp}
              hint="Country code + number. Spaces and + are removed automatically."
            >
              <div className="flex gap-2">
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="919876543210"
                  className={inputClass(errors.whatsapp)}
                />
                {waNumber.length >= 11 && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Test this WhatsApp link"
                    className="grid shrink-0 place-items-center rounded-lg border border-stone-300 px-3 text-stone-600 hover:bg-stone-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </Field>
          </div>
          <div className="mt-5">
            {field("address", "Address", { textarea: true, placeholder: "Full address with PIN code" })}
          </div>
        </Card>

        <Card title="Social media" description="Full links. Leave empty to hide the icon on the website.">
          <div className="grid gap-5 sm:grid-cols-3">
            {field("facebook", "Facebook", { placeholder: "https://facebook.com/..." })}
            {field("instagram", "Instagram", { placeholder: "https://instagram.com/..." })}
            {field("linkedin", "LinkedIn", { placeholder: "https://linkedin.com/..." })}
          </div>
        </Card>

        <Card
          title="Google Map"
          description='Google Maps → Share → "Embed a map" → Copy HTML, then paste it here.'
        >
          {field("map_embed", "Map embed code", { textarea: true, rows: 3, placeholder: '<iframe src="https://www.google.com/maps/embed?..."' })}
          {original.map_embed && (
            <iframe
              src={original.map_embed}
              title="Saved map preview"
              className="mt-4 h-64 w-full rounded-lg border border-stone-200"
              loading="lazy"
            />
          )}
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-stone-200 bg-white/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <p className={`text-sm ${dirty ? "font-medium text-amber-600" : "text-stone-400"}`}>
          {dirty ? "You have unsaved changes" : "All changes saved"}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={discard}
            disabled={!dirty || saving}
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}