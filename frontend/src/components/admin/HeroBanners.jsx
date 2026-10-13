import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { PageHeader } from "../../components/admin/ui";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import HeroSlideForm from "../../components/admin/HeroSlideForm";
import { ik } from "../../utils/image";

export default function HeroBanners() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    api
      .get("/admin/hero-slides")
      .then((res) => setSlides(res.data))
      .catch(() => toast.error("Failed to load banners"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleSaved = (saved) => {
    setSlides((prev) =>
      prev.some((s) => s.id === saved.id) ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved]
    );
    setEditing(undefined);
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSlides(reordered); // update the screen immediately
    try {
      await api.put("/admin/hero-slides/reorder", { ids: reordered.map((s) => s.id) });
    } catch {
      toast.error("Failed to save order");
      load(); // revert to the real order
    }
  };

  const toggle = async (slide) => {
    try {
      const { data } = await api.patch(`/admin/hero-slides/${slide.id}/toggle`);
      setSlides((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      toast.success(data.is_active ? "Banner is now live" : "Banner hidden from website");
    } catch {
      toast.error("Failed to update banner");
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/hero-slides/${deleting.id}`);
      setSlides((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success("Banner deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeleteBusy(false);
    }
  };

  const activeCount = slides.filter((s) => s.is_active).length;

  return (
    <div>
      <PageHeader
        title="Hero Banners"
        description="The full-screen slides at the top of the homepage. They play in this order."
        action={
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" /> Add banner
          </button>
        }
      />

      {!loading && slides.length > 0 && activeCount === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          All banners are hidden. The website will show a plain fallback banner.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <ImagePlus className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-4 font-medium text-stone-700">No banners yet</p>
          <p className="mt-1 text-sm text-stone-500">Add your first banner to show it on the homepage.</p>
          <button
            onClick={() => setEditing(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" /> Add banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center ${
                s.is_active ? "border-stone-200" : "border-dashed border-stone-300 opacity-60"
              }`}
            >
              <span className="hidden w-8 text-center font-serif text-2xl text-stone-400 sm:block">{i + 1}</span>

              <img
                src={ik(s.image, "w-480,q-70")}
                alt={s.title}
                className="aspect-video w-full rounded-lg object-cover sm:w-56"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.is_active ? "bg-brand-50 text-brand-700" : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {s.is_active ? "Live" : "Hidden"}
                  </span>
                  {s.subtitle && (
                    <span className="truncate text-xs uppercase tracking-widest text-stone-500">{s.subtitle}</span>
                  )}
                </div>
                <p className="mt-1.5 truncate font-serif text-xl font-semibold text-stone-900">{s.title}</p>
                {s.button_text && (
                  <p className="mt-1 text-sm text-stone-500">
                    Button: <span className="font-medium text-stone-700">{s.button_text}</span> → {s.button_link}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </IconButton>
                <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === slides.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </IconButton>
                <IconButton label={s.is_active ? "Hide" : "Show"} onClick={() => toggle(s)}>
                  {s.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
                <IconButton label="Edit" onClick={() => setEditing(s)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton label="Delete" onClick={() => setDeleting(s)} danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <HeroSlideForm slide={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete banner?"
        message={`"${deleting?.title}" and its image will be permanently deleted. To remove it temporarily, use Hide instead.`}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
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
      className={`rounded-lg p-2 transition disabled:opacity-30 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}