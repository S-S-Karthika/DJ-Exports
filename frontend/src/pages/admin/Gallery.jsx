import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Images, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import api from "../../api/axios";
import { Card, Field, PageHeader, inputClass } from "../../components/admin/ui";
import Modal from "../../components/admin/Modal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import MultiImageDrop from "../../components/admin/MultiImageDrop";
import { GALLERY_SECTIONS, sectionLabel } from "../../data/gallerySections";
import { ik } from "../../utils/image";

const MAX_BATCH = 20;

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // Upload panel
  const [section, setSection] = useState(GALLERY_SECTIONS[0].value);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    api
      .get("/admin/gallery")
      .then((res) => setItems(res.data))
      .catch(() => toast.error("Failed to load gallery"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("section", section);
    files.forEach((f) => fd.append("images", f));
    try {
      const { data } = await api.post("/admin/gallery", fd, {
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setItems((prev) => [...prev, ...data.created]);
      setFiles([]);
      if (data.failed) toast.error(`${data.created.length} uploaded, ${data.failed} failed. Try those again.`);
      else toast.success(`${data.created.length} photo${data.created.length === 1 ? "" : "s"} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const visible = filter ? items.filter((i) => i.section === filter) : items;

  // Swap with the neighbour in the current (possibly filtered) view
  const move = async (item, dir) => {
    const vIndex = visible.findIndex((i) => i.id === item.id);
    const neighbour = visible[vIndex + dir];
    if (!neighbour) return;
    const next = [...items];
    const a = next.findIndex((i) => i.id === item.id);
    const b = next.findIndex((i) => i.id === neighbour.id);
    [next[a], next[b]] = [next[b], next[a]];
    setItems(next);
    try {
      await api.put("/admin/gallery/reorder", { ids: next.map((i) => i.id) });
    } catch {
      toast.error("Failed to save order");
      load();
    }
  };

  const toggle = async (item) => {
    try {
      const { data } = await api.patch(`/admin/gallery/${item.id}/toggle`);
      setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
    } catch {
      toast.error("Failed to update photo");
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/gallery/${deleting.id}`);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      toast.success("Photo deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete photo");
    } finally {
      setDeleteBusy(false);
    }
  };

  const counts = Object.fromEntries(GALLERY_SECTIONS.map((s) => [s.value, items.filter((i) => i.section === s.value).length]));

  return (
    <div>
      <PageHeader title="Gallery" description="Behind-the-scenes photos: how your products are made, checked and packed." />

      <Card title="Upload photos" description={`Up to ${MAX_BATCH} at once. Real photos only: no stock images.`}>
        <div className="grid gap-5 md:grid-cols-[240px_1fr]">
          <Field label="Section">
            <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClass()}>
              {GALLERY_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <MultiImageDrop files={files} onChange={setFiles} maxFiles={MAX_BATCH} />
            {files.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm text-stone-500">
                  {uploading
                    ? progress < 100 ? `Uploading ${progress}%` : "Processing photos..."
                    : `${files.length} photo${files.length === 1 ? "" : "s"} → ${sectionLabel(section)}`}
                </p>
                <button
                  onClick={upload}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload {files.length}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Section tabs */}
      <div className="mb-4 mt-8 flex flex-wrap gap-2">
        {[{ value: "", label: "All", count: items.length }, ...GALLERY_SECTIONS.map((s) => ({ ...s, count: counts[s.value] }))].map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === t.value ? "bg-brand-700 text-white" : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {t.label} <span className={filter === t.value ? "text-white/70" : "text-stone-400"}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <Images className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-4 font-medium text-stone-700">No photos {filter ? `in ${sectionLabel(filter)}` : "yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item, vi) => (
            <div
              key={item.id}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm ${
                item.is_active ? "border-stone-200" : "border-dashed border-stone-300 opacity-60"
              }`}
            >
              <div className="relative aspect-square bg-stone-100">
                <img src={ik(item.image, "w-400,h-400,q-70")} alt={item.title || ""} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                  {sectionLabel(item.section)}
                </span>
                {!item.is_active && (
                  <span className="absolute right-2 top-2 rounded-full bg-stone-800/80 px-2 py-0.5 text-[11px] text-white">Hidden</span>
                )}
              </div>
              <p className="truncate px-3 pt-2 text-sm text-stone-600">{item.title || <span className="text-stone-400">No caption</span>}</p>
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex">
                  <IconButton label="Move left" onClick={() => move(item, -1)} disabled={vi === 0}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Move right" onClick={() => move(item, 1)} disabled={vi === visible.length - 1}>
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="flex">
                  <IconButton label={item.is_active ? "Hide" : "Show"} onClick={() => toggle(item)}>
                    {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Edit" onClick={() => setEditing(item)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" onClick={() => setDeleting(item)} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditPhoto
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(data) => {
            setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete photo?"
        message="This photo will be permanently deleted from the website and from storage. To remove it temporarily, use Hide instead."
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function EditPhoto({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item.title || "");
  const [section, setSection] = useState(item.section);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/gallery/${item.id}`, { title, section });
      toast.success("Photo updated");
      onSaved(data);
    } catch (err) {
      setError(err.response?.data?.errors?.title || err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Edit photo" onClose={saving ? () => {} : onClose} size="max-w-2xl">
      <form onSubmit={save}>
        <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
          <img src={ik(item.image, "w-400,q-75")} alt="" className="w-full rounded-lg object-cover" />
          <div className="space-y-5">
            <Field label="Caption" hint="Optional. e.g. Final inspection before packing" error={error}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} className={inputClass(error)} />
            </Field>
            <Field label="Section">
              <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClass()}>
                {GALLERY_SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function IconButton({ children, label, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 transition disabled:opacity-30 ${danger ? "text-red-600 hover:bg-red-50" : "text-stone-600 hover:bg-stone-100"}`}
    >
      {children}
    </button>
  );
}