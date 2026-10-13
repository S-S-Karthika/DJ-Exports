import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "../../api/axios";
import Modal from "./Modal";
import ImageDropzone from "./ImageDropzone";
import { Field, inputClass } from "./ui";
import { ik } from "../../utils/image";

const EMPTY = { title: "", issuer: "", cert_number: "", description: "", is_active: true };

export default function CertificateForm({ certificate, onClose, onSaved }) {
  const isEdit = Boolean(certificate);
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: certificate.title ?? "",
          issuer: certificate.issuer ?? "",
          cert_number: certificate.cert_number ?? "",
          description: certificate.description ?? "",
          is_active: Boolean(certificate.is_active),
        }
      : EMPTY
  );
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !file) {
      setErrors((er) => ({ ...er, image: "Certificate image is required" }));
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
        ? await api.put(`/admin/certificates/${certificate.id}`, fd, config)
        : await api.post("/admin/certificates", fd, config);
      toast.success(isEdit ? "Certificate updated" : "Certificate added");
      onSaved(data);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to save certificate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={isEdit ? "Edit certificate" : "Add certificate"}
      onClose={saving ? () => {} : onClose}
      size="max-w-4xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr]">
          <Field label="Certificate image" required={!isEdit} hint="JPG/PNG, at least 1000px wide so text is readable. Watermark it first.">
            <ImageDropzone
              file={file}
              existingUrl={certificate?.image ? ik(certificate.image, "w-600,q-80") : null}
              onChange={(f) => {
                setFile(f);
                setErrors((er) => ({ ...er, image: undefined }));
              }}
              error={errors.image}
              minWidth={1000}
              aspect="aspect-[3/4]"
              fit="contain"
            />
          </Field>

          <div className="space-y-5">
            <Field label="Title" required hint="e.g. GST Registration Certificate" error={errors.title}>
              <input name="title" value={form.title} onChange={handleChange} maxLength={150} className={inputClass(errors.title)} />
            </Field>

            <Field label="Issued by" hint="e.g. Government of India" error={errors.issuer}>
              <input name="issuer" value={form.issuer} onChange={handleChange} maxLength={150} className={inputClass(errors.issuer)} />
            </Field>

            <Field label="Registration number" hint="e.g. GSTIN or IEC number. Leave empty to hide it." error={errors.cert_number}>
              <input name="cert_number" value={form.cert_number} onChange={handleChange} maxLength={100} className={inputClass(errors.cert_number)} />
            </Field>

            <Field label="Short description" hint="Optional" error={errors.description}>
              <textarea name="description" rows={3} value={form.description} onChange={handleChange} maxLength={1000} className={inputClass(errors.description)} />
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
              {isEdit ? "Save changes" : "Add certificate"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}