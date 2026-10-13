import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import Modal from "./Modal";
import ImageDropzone from "./ImageDropzone";
import { Field, inputClass } from "./ui";
import { ik } from "../../utils/image";
import {slugify} from "../../utils/slug";

export default function CategoryForm({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState(() => ({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    short_description: category?.short_description ?? "",
    description: category?.description ?? "",
    is_active: category ? Boolean(category.is_active) : true,
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: type === "checkbox" ? checked : value };
      // While creating, the URL follows the name until the admin edits it manually
      if (name === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
    if (name === "slug") setSlugTouched(true);
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        ? await api.put(`/admin/categories/${category.id}`, fd, config)
        : await api.post("/admin/categories", fd, config);
      toast.success(isEdit ? "Category updated" : "Category added");
      onSaved(data);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const slugChanged = isEdit && form.slug !== category.slug;

  return (
    <Modal open title={isEdit ? "Edit category" : "Add category"} onClose={saving ? () => {} : onClose} size="max-w-4xl">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 p-6 md:grid-cols-[300px_1fr]">
          <Field label="Category image" hint="Landscape 4:3, at least 800px wide. Shown on category cards.">
            <ImageDropzone
              file={file}
              existingUrl={category?.image ? ik(category.image, "w-600,q-75") : null}
              onChange={(f) => {
                setFile(f);
                setErrors((er) => ({ ...er, image: undefined }));
              }}
              error={errors.image}
              aspect="aspect-[4/3]"
              minWidth={800}
            />
          </Field>

          <div className="space-y-5">
            <Field label="Name" required error={errors.name}>
              <input name="name" value={form.name} onChange={handleChange} maxLength={100} className={inputClass(errors.name)} placeholder="Kitchen Linen" />
            </Field>

            <Field
              label="Page URL"
              error={errors.slug}
              hint={slugChanged ? "⚠ Changing the URL breaks old links shared with buyers." : `yoursite.com/products/${form.slug || "..."}`}
            >
              <input name="slug" value={form.slug} onChange={handleChange} maxLength={100} className={`${inputClass(errors.slug)} font-mono text-xs`} />
            </Field>

            <Field
              label="Short description"
              error={errors.short_description}
              hint={`Shown on category cards · ${form.short_description.length}/255`}
            >
              <input name="short_description" value={form.short_description} onChange={handleChange} maxLength={255} className={inputClass(errors.short_description)} placeholder="Tea towels, aprons, oven mitts and chef pads." />
            </Field>

            <Field label="Full description" error={errors.description} hint="Shown at the top of the category page. Optional.">
              <textarea name="description" rows={4} value={form.description} onChange={handleChange} maxLength={3000} className={inputClass(errors.description)} />
            </Field>

            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="peer sr-only" />
              <span className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-brand-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
              <span className="text-sm font-medium text-stone-700">Show on website</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-stone-100 px-6 py-4">
          <div className="flex-1">
            {saving && file && (
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
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add category"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}