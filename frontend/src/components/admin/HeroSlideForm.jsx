import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import Modal from "./Modal";
import ImageDropzone from "./ImageDropzone";
import { Field, inputClass } from "./ui";
import { ik } from "../../utils/image";

const EMPTY = {
  subtitle: "",
  title: "",
  button_text: "Enquire Now",
  button_link: "/contact",
  is_active: true,
};

export default function HeroSlideForm({ slide, onClose, onSaved }) {
  const isEdit = Boolean(slide);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          subtitle: slide.subtitle ?? "",
          title: slide.title ?? "",
          button_text: slide.button_text ?? "",
          button_link: slide.button_link ?? "",
          is_active: Boolean(slide.is_active),
        }
      : EMPTY
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !file) {
      setErrors((er) => ({ ...er, image: "Banner image is required" }));
      return;
    }

    setSaving(true);
    setProgress(0);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);

    const config = {
      onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
    };

    try {
      const { data } = isEdit
        ? await api.put(`/admin/hero-slides/${slide.id}`, fd, config)
        : await api.post("/admin/hero-slides", fd, config);
      toast.success(isEdit ? "Banner updated" : "Banner added");
      onSaved(data);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const existingUrl = slide?.image ? ik(slide.image, "w-1200,q-70") : null;
  const previewImage = preview || existingUrl;

  return (
    <Modal open title={isEdit ? "Edit banner" : "Add banner"} onClose={saving ? () => {} : onClose} size="max-w-5xl">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 p-6 lg:grid-cols-2">
          {/* Left: inputs */}
          <div className="space-y-5">
            <Field
              label="Banner image"
              required={!isEdit}
              hint="Landscape, at least 1920px wide. Darker images keep white text readable."
            >
              <ImageDropzone
                file={file}
                existingUrl={existingUrl}
                onChange={(f) => {
                  setFile(f);
                  setErrors((er) => ({ ...er, image: undefined }));
                }}
                error={errors.image}
                minWidth={1600}
              />
            </Field>

            <Field label="Small text above title" hint="Optional, e.g. FINEST CRAFTSMANSHIP" error={errors.subtitle}>
              <input name="subtitle" value={form.subtitle} onChange={handleChange} maxLength={150} className={inputClass(errors.subtitle)} />
            </Field>

            <Field label="Title" required error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange} maxLength={200} className={inputClass(errors.title)} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Button text" hint="Leave empty for no button" error={errors.button_text}>
                <input name="button_text" value={form.button_text} onChange={handleChange} maxLength={50} className={inputClass(errors.button_text)} />
              </Field>
              <Field label="Button link" hint="e.g. /contact or /products" error={errors.button_link}>
                <input name="button_link" value={form.button_link} onChange={handleChange} className={inputClass(errors.button_link)} />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="peer sr-only" />
              <span className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-brand-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
              <span className="text-sm font-medium text-stone-700">Show on website</span>
            </label>
          </div>

          {/* Right: live preview */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-stone-700">Live preview</p>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-brand-900">
              {previewImage && (
                <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/25 to-black/60" />
              <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
                {form.subtitle && (
                  <p className="text-[9px] uppercase tracking-[0.4em] text-white/90">{form.subtitle}</p>
                )}
                <p className="mt-2 font-serif text-2xl font-medium leading-tight sm:text-3xl">
                  {form.title || "Your banner title"}
                </p>
                {form.button_text && (
                  <span className="mt-4 rounded-full bg-brand-700 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em]">
                    {form.button_text}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Approximate preview. On the website the banner is full-screen and animated.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-stone-100 px-6 py-4">
          <div className="flex-1">
            {saving && (
              <div>
                <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {progress < 100 ? `Uploading ${progress}%` : "Processing image..."}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add banner"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}