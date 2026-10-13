import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus, Star, Trash2, X } from "lucide-react";
import api from "../../api/axios";
import Modal from "./Modal";
import MultiImageDrop from "./MultiImageDrop";
import { Card, Field, inputClass } from "./ui";
import { ik } from "../../utils/image";
import { slugify } from "../../utils/slug";

const MAX_IMAGES = 8;

const EMPTY = {
  category_id: "", name: "", slug: "", short_description: "", description: "",
  material: "", gsm: "", size: "", colors: "", moq: "", packaging: "",
  is_active: true, is_featured: false,
};

const SPEC_FIELDS = [
  { name: "material", label: "Material", placeholder: "100% Cotton" },
  { name: "gsm", label: "GSM", placeholder: "180 - 220" },
  { name: "size", label: "Sizes", placeholder: "50 x 70 cm, custom sizes available" },
  { name: "colors", label: "Colours", placeholder: "White, Beige, Sage green" },
  { name: "moq", label: "MOQ", placeholder: "1000 pcs per design" },
  { name: "packaging", label: "Packaging", placeholder: "Polybag, 50 pcs per carton" },
];

export default function ProductForm({ productId, categories, onClose, onSaved }) {
  const isEdit = Boolean(productId);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState(EMPTY);
  const [specs, setSpecs] = useState([]);
  const [images, setImages] = useState([]);     // already uploaded
  const [newFiles, setNewFiles] = useState([]); // waiting for Save
  const [imageBusy, setImageBusy] = useState(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/admin/products/${productId}`)
      .then(({ data }) => {
        setForm({
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? ""])),
          category_id: String(data.category_id),
          is_active: Boolean(data.is_active),
          is_featured: Boolean(data.is_featured),
        });
        setSpecs(Array.isArray(data.specifications) ? data.specifications : []);
        setImages(data.images || []);
      })
      .catch(() => {
        toast.error("Failed to load product");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [isEdit, productId, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: type === "checkbox" ? checked : value };
      if (name === "name" && !slugTouched) next.slug = slugify(value);
      return next;
    });
    if (name === "slug") setSlugTouched(true);
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  /* Custom specs */
  const updateSpec = (i, key, value) =>
    setSpecs((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const addSpec = () => setSpecs((s) => [...s, { label: "", value: "" }]);
  const removeSpec = (i) => setSpecs((s) => s.filter((_, idx) => idx !== i));

  /* Existing images: these act immediately */
  const setCover = async (img) => {
    setImageBusy(img.id);
    try {
      const { data } = await api.patch(`/admin/products/${productId}/images/${img.id}/primary`);
      setImages(data.images);
      toast.success("Cover photo updated");
    } catch {
      toast.error("Failed to set cover photo");
    } finally {
      setImageBusy(null);
    }
  };

  const deleteImage = async (img) => {
    if (!window.confirm("Delete this photo permanently?")) return;
    setImageBusy(img.id);
    try {
      const { data } = await api.delete(`/admin/products/${productId}/images/${img.id}`);
      setImages(data.images);
      toast.success("Photo deleted");
    } catch {
      toast.error("Failed to delete photo");
    } finally {
      setImageBusy(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProgress(0);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("specifications", JSON.stringify(specs.filter((s) => s.label.trim() && s.value.trim())));
    newFiles.forEach((f) => fd.append("images", f));

    const config = {
      onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
    };

    try {
      const { data } = isEdit
        ? await api.put(`/admin/products/${productId}`, fd, config)
        : await api.post("/admin/products", fd, config);
      toast.success(isEdit ? "Product updated" : "Product added");
      onSaved(data);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const text = (name, label, opts = {}) => (
    <Field label={label} required={opts.required} error={errors[name]} hint={opts.hint}>
      {opts.rows ? (
        <textarea name={name} rows={opts.rows} value={form[name]} onChange={handleChange} placeholder={opts.placeholder} className={inputClass(errors[name])} />
      ) : (
        <input name={name} value={form[name]} onChange={handleChange} placeholder={opts.placeholder} className={`${inputClass(errors[name])} ${opts.mono ? "font-mono text-xs" : ""}`} />
      )}
    </Field>
  );

  return (
    <Modal open title={isEdit ? "Edit product" : "Add product"} onClose={saving ? () => {} : onClose} size="max-w-5xl">
      {loading ? (
        <div className="grid h-96 place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 bg-stone-50 p-6">
            {/* Basics */}
            <Card title="Basics">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" required error={errors.category_id}>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className={inputClass(errors.category_id)}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.is_active ? "" : " (hidden)"}
                      </option>
                    ))}
                  </select>
                </Field>
                {text("name", "Product name", { required: true, placeholder: "Waffle Weave Tea Towel" })}
                {text("slug", "Page URL", { mono: true, hint: `/products/.../${form.slug || "..."}` })}
                {text("short_description", "Short description", {
                  hint: `Shown on product cards · ${form.short_description.length}/255`,
                  placeholder: "Highly absorbent cotton waffle tea towel",
                })}
              </div>
            </Card>

            {/* Photos */}
            <Card title="Photos" description={`Up to ${MAX_IMAGES}. The cover photo is shown on product cards.`}>
              {images.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-white">
                      <img src={ik(img.image, "w-300,q-70")} alt="" className="h-full w-full object-cover" />
                      {img.is_primary ? (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
                          <Star className="h-3 w-3 fill-current" /> Cover
                        </span>
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-linear-to-t from-black/70 to-transparent p-1.5 transition sm:opacity-0 sm:group-hover:opacity-100">
                        {!img.is_primary ? (
                          <button type="button" onClick={() => setCover(img)} disabled={imageBusy === img.id} className="rounded bg-white/90 px-2 py-0.5 text-[11px] font-medium text-stone-800 hover:bg-white">
                            Set cover
                          </button>
                        ) : (
                          <span />
                        )}
                        <button type="button" onClick={() => deleteImage(img)} disabled={imageBusy === img.id} aria-label="Delete photo" className="grid h-6 w-6 place-items-center rounded bg-red-600 text-white hover:bg-red-700">
                          {imageBusy === img.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <MultiImageDrop
                files={newFiles}
                onChange={(files) => {
                  setNewFiles(files);
                  setErrors((er) => ({ ...er, images: undefined }));
                }}
                maxFiles={MAX_IMAGES - images.length}
                error={errors.images}
              />
              {!isEdit && newFiles.length > 0 && (
                <p className="mt-2 text-xs text-stone-500">The first photo becomes the cover. You can change it after saving.</p>
              )}
            </Card>

            {/* Specs */}
            <Card title="Specifications" description="Leave empty what doesn't apply. Empty fields are hidden on the website.">
              <div className="grid gap-5 sm:grid-cols-2">
                {SPEC_FIELDS.map((f) => (
                  <div key={f.name}>{text(f.name, f.label, { placeholder: f.placeholder })}</div>
                ))}
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-stone-700">More specifications</p>
                <div className="mt-2 space-y-2">
                  {specs.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} placeholder="e.g. Weave" maxLength={60} className={`${inputClass()} w-1/3`} />
                      <input value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="e.g. Waffle" maxLength={200} className={inputClass()} />
                      <button type="button" onClick={() => removeSpec(i)} aria-label="Remove" className="grid w-11 shrink-0 place-items-center rounded-lg border border-stone-300 text-stone-500 hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {specs.length < 15 && (
                  <button type="button" onClick={addSpec} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                    <Plus className="h-4 w-4" /> Add specification
                  </button>
                )}
                {errors.specifications && <p className="mt-1.5 text-sm text-red-600">{errors.specifications}</p>}
              </div>
            </Card>

            {/* Description */}
            <Card title="Description">
              {text("description", "Full description", { rows: 6, hint: "Leave an empty line between paragraphs" })}
            </Card>

            {/* Visibility */}
            <Card title="Visibility">
              <div className="flex flex-wrap gap-8">
                <Toggle name="is_active" checked={form.is_active} onChange={handleChange} label="Show on website" />
                <Toggle name="is_featured" checked={form.is_featured} onChange={handleChange} label="Featured on homepage ⭐" />
              </div>
            </Card>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-b-2xl border-t border-stone-100 bg-white px-6 py-4">
            <div className="flex-1 text-sm text-stone-500">
              {saving && newFiles.length > 0 && (progress < 100 ? `Uploading photos ${progress}%` : "Processing photos...")}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save changes" : "Add product"}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

function Toggle({ name, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-stone-300 transition peer-checked:bg-brand-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
      <span className="text-sm font-medium text-stone-700">{label}</span>
    </label>
  );
}