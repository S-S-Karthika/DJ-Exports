import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { Card, Field, PageHeader, inputClass } from "../../components/admin/ui";
import ImageDropzone from "../../components/admin/ImageDropzone";
import { ik } from "../../utils/image";

const TEXT_FIELDS = [
  "story_title", "highlight", "story_text",
  "founder_name", "founder_title", "founder_message",
  "mission", "vision", "karur_title", "karur_text",
];
const IMAGE_FIELDS = ["banner_image", "story_image_main", "story_image_secondary", "founder_image", "karur_image"];

const emptyImages = () => Object.fromEntries(IMAGE_FIELDS.map((f) => [f, { file: null, remove: false }]));
const toForm = (d) => Object.fromEntries(TEXT_FIELDS.map((f) => [f, d?.[f] ?? ""]));

export default function AboutEditor() {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(toForm(null));
  const [images, setImages] = useState(emptyImages);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    api
      .get("/admin/about")
      .then((res) => {
        setSaved(res.data);
        setForm(toForm(res.data));
      })
      .catch(() => toast.error("Failed to load About content"))
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(
    () =>
      Boolean(saved) &&
      (JSON.stringify(form) !== JSON.stringify(toForm(saved)) ||
        Object.values(images).some((i) => i.file || i.remove)),
    [form, images, saved]
  );

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

  const setImageFile = (field, file) => {
    setImages((i) => ({ ...i, [field]: { file, remove: false } }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const removeImage = (field) => {
    setImages((i) => ({ ...i, [field]: { file: null, remove: true } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProgress(0);

    const fd = new FormData();
    TEXT_FIELDS.forEach((f) => fd.append(f, form[f]));
    IMAGE_FIELDS.forEach((f) => {
      if (images[f].file) fd.append(f, images[f].file);
      if (images[f].remove) fd.append(`remove_${f}`, "true");
    });

    try {
      const { data } = await api.put("/admin/about", fd, {
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setSaved(data);
      setForm(toForm(data));
      setImages(emptyImages());
      setErrors({});
      toast.success("About page saved");
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save About page");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setForm(toForm(saved));
    setImages(emptyImages());
    setErrors({});
  };

  const text = (name, label, opts = {}) => (
    <Field
      label={label}
      required={opts.required}
      error={errors[name]}
      hint={opts.max ? `${opts.hint ? opts.hint + " · " : ""}${form[name].length}/${opts.max}` : opts.hint}
    >
      {opts.rows ? (
        <textarea
          name={name}
          rows={opts.rows}
          value={form[name]}
          onChange={handleChange}
          maxLength={opts.max}
          className={inputClass(errors[name])}
        />
      ) : (
        <input name={name} value={form[name]} onChange={handleChange} maxLength={opts.max} className={inputClass(errors[name])} />
      )}
    </Field>
  );

  const image = (field, label, opts = {}) => (
    <ImageSlot
      field={field}
      label={label}
      hint={opts.hint}
      aspect={opts.aspect}
      minWidth={opts.minWidth}
      existing={saved?.[field]}
      state={images[field]}
      error={errors[field]}
      onFile={setImageFile}
      onRemove={removeImage}
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-stone-200" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader
        title="About Page"
        description="Everything shown on the public About page. Empty sections are hidden automatically."
        action={
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <ExternalLink className="h-4 w-4" /> View page
          </a>
        }
      />

      <div className="space-y-6">
        <Card title="Page banner" description="The wide image behind the 'About Us' title.">
          {image("banner_image", "Banner image", { aspect: "aspect-[3/1]", minWidth: 1600, hint: "Wide landscape, at least 1920px" })}
        </Card>

        <Card title="Our story">
          <div className="space-y-5">
            {text("story_title", "Heading", { max: 200 })}
            {text("highlight", "Highlight line", { max: 200, hint: "Shown in a green card" })}
            {text("story_text", "Story", { required: true, rows: 10, max: 5000, hint: "Leave an empty line between paragraphs" })}
            <div className="grid gap-5 sm:grid-cols-2">
              {image("story_image_main", "Main image", { aspect: "aspect-[4/5]", minWidth: 900 })}
              {image("story_image_secondary", "Second image", { aspect: "aspect-[4/3]", minWidth: 700 })}
            </div>
          </div>
        </Card>

        <Card title="Meet the founder" description="Hidden on the website until a founder name is entered.">
          <div className="grid gap-6 md:grid-cols-[260px_1fr]">
            {image("founder_image", "Founder photo", { aspect: "aspect-[3/4]", minWidth: 600, hint: "Professional portrait" })}
            <div className="space-y-5">
              {text("founder_name", "Name", { max: 100 })}
              {text("founder_title", "Title", { max: 100, hint: "e.g. Founder & Proprietor" })}
              {text("founder_message", "Message to buyers", { rows: 6, max: 1500, hint: "In her own words" })}
            </div>
          </div>
        </Card>

        <Card title="Mission & vision">
          <div className="grid gap-5 md:grid-cols-2">
            {text("mission", "Mission", { rows: 4, max: 1000 })}
            {text("vision", "Vision", { rows: 4, max: 1000 })}
          </div>
        </Card>

        <Card title="Why Karur" description="Hidden on the website if the text is empty.">
          <div className="space-y-5">
            {text("karur_title", "Heading", { max: 200 })}
            {text("karur_text", "Text", { rows: 6, max: 3000, hint: "Leave an empty line between paragraphs" })}
            <div className="max-w-md">{image("karur_image", "Image", { aspect: "aspect-[4/3]", minWidth: 900 })}</div>
          </div>
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-4 border-t border-stone-200 bg-white/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="text-sm">
          {saving ? (
            <span className="text-stone-500">{progress < 100 ? `Uploading ${progress}%` : "Processing images..."}</span>
          ) : (
            <span className={dirty ? "font-medium text-amber-600" : "text-stone-400"}>
              {dirty ? "You have unsaved changes" : "All changes saved"}
            </span>
          )}
        </div>
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

function ImageSlot({ field, label, hint, aspect, minWidth, existing, state, error, onFile, onRemove }) {
  const current = state.remove ? null : existing;
  return (
    <Field label={label} hint={hint}>
      <ImageDropzone
        file={state.file}
        existingUrl={current ? ik(current, "w-800,q-70") : null}
        onChange={(f) => onFile(field, f)}
        error={error}
        aspect={aspect}
        minWidth={minWidth}
      />
      {(state.file || current) && (
        <button
          type="button"
          onClick={() => onRemove(field)}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove image
        </button>
      )}
      {state.remove && existing && (
        <p className="mt-1 text-xs text-amber-600">This image will be removed when you save.</p>
      )}
    </Field>
  );
}