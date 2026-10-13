import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, ImageOff, Package, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { PageHeader, inputClass } from "../../components/admin/ui";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import ProductForm from "../../components/admin/ProductForm";
import { ik } from "../../utils/image";

export default function Products() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, id = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get("/admin/products", { params: { q: q || undefined, category_id: categoryId || undefined } })
      .then((res) => setItems(res.data))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [q, categoryId]);

  // Search waits until typing pauses
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.get("/admin/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const closeForm = useCallback(() => setEditing(undefined), []);

  const handleSaved = () => {
    setEditing(undefined);
    load();
  };

  const toggle = async (item, kind) => {
    try {
      const { data } = await api.patch(`/admin/products/${item.id}/${kind === "featured" ? "featured" : "toggle"}`);
      setItems((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, is_active: data.is_active, is_featured: data.is_featured } : p))
      );
      toast.success(
        kind === "featured"
          ? data.is_featured ? "Featured on homepage" : "Removed from featured"
          : data.is_active ? "Product is now visible" : "Product hidden from website"
      );
    } catch {
      toast.error("Failed to update product");
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/products/${deleting.id}`);
      setItems((prev) => prev.filter((p) => p.id !== deleting.id));
      toast.success("Product deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Everything buyers can browse and enquire about."
        action={
          <button
            onClick={() => setEditing(null)}
            disabled={categories.length === 0}
            title={categories.length === 0 ? "Add a category first" : ""}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className={`${inputClass()} pl-10`} />
        </div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${inputClass()} sm:w-56`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-4 font-medium text-stone-700">{q || categoryId ? "No products match your search" : "No products yet"}</p>
          {!q && !categoryId && (
            <button onClick={() => setEditing(null)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              <Plus className="h-4 w-4" /> Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          {items.map((p) => (
            <div key={p.id} className={`flex items-center gap-4 border-b border-stone-100 p-3 last:border-0 sm:p-4 ${p.is_active ? "" : "opacity-60"}`}>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {p.image ? (
                  <img src={ik(p.image, "w-160,q-70")} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-stone-400">
                    <ImageOff className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-stone-900">{p.name}</p>
                  {!p.is_active && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">Hidden</span>}
                  {p.image_count === 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">No photos</span>}
                </div>
                <p className="mt-0.5 text-sm text-stone-500">
                  {p.category_name}
                  {p.gsm && ` · ${p.gsm} GSM`}
                  {p.moq && ` · MOQ ${p.moq}`}
                  {` · ${p.image_count} photo${p.image_count === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <IconButton label={p.is_featured ? "Remove from featured" : "Feature on homepage"} onClick={() => toggle(p, "featured")}>
                  <Star className={`h-4 w-4 ${p.is_featured ? "fill-amber-400 text-amber-400" : ""}`} />
                </IconButton>
                <IconButton label={p.is_active ? "Hide" : "Show"} onClick={() => toggle(p, "active")}>
                  {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </IconButton>
                <IconButton label="Edit" onClick={() => setEditing(p.id)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton label="Delete" onClick={() => setDeleting(p)} danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ProductForm productId={editing} categories={categories} onClose={closeForm} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        message={`"${deleting?.name}" and all its photos will be permanently deleted. To remove it temporarily, use Hide instead.`}
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function IconButton({ children, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-2 transition ${danger ? "text-red-600 hover:bg-red-50" : "text-stone-600 hover:bg-stone-100"}`}
    >
      {children}
    </button>
  );
}