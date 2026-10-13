import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { PageHeader } from "../../components/admin/ui";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import CertificateForm from "../../components/admin/CertificateForm";
import { ik } from "../../utils/image";

export default function Certificates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    api
      .get("/admin/certificates")
      .then((res) => setItems(res.data))
      .catch(() => toast.error("Failed to load certificates"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleSaved = (saved) => {
    setItems((prev) =>
      prev.some((c) => c.id === saved.id) ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    );
    setEditing(undefined);
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    try {
      await api.put("/admin/certificates/reorder", { ids: reordered.map((c) => c.id) });
    } catch {
      toast.error("Failed to save order");
      load();
    }
  };

  const toggle = async (item) => {
    try {
      const { data } = await api.patch(`/admin/certificates/${item.id}/toggle`);
      setItems((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      toast.success(data.is_active ? "Certificate is now visible" : "Certificate hidden from website");
    } catch {
      toast.error("Failed to update certificate");
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/certificates/${deleting.id}`);
      setItems((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.success("Certificate deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete certificate");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Registrations and certificates shown on the About and Certified pages."
        action={
          <button
            onClick={() => setEditing(null)}
            className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" /> Add certificate
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
          <BadgeCheck className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-4 font-medium text-stone-700">No certificates yet</p>
          <p className="mt-1 text-sm text-stone-500">Add your GST, IEC or other registrations to build buyer trust.</p>
          <button
            onClick={() => setEditing(null)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Plus className="h-4 w-4" /> Add certificate
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <div
              key={c.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
                c.is_active ? "border-stone-200" : "border-dashed border-stone-300 opacity-60"
              }`}
            >
              <div className="relative aspect-[4/3] bg-stone-50">
                <img src={ik(c.image, "w-500,q-75")} alt={c.title} className="h-full w-full object-contain p-3" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    c.is_active ? "bg-brand-50 text-brand-700" : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {c.is_active ? "Live" : "Hidden"}
                </span>
              </div>

              <div className="flex-1 p-4">
                <p className="font-serif text-xl font-semibold text-stone-900">{c.title}</p>
                {c.issuer && <p className="text-sm text-stone-500">{c.issuer}</p>}
                {c.cert_number && (
                  <p className="mt-2 inline-block rounded bg-stone-100 px-2 py-1 font-mono text-xs text-stone-700">
                    {c.cert_number}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 px-2 py-1.5">
                <div className="flex">
                  <IconButton label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Move right" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>
                <div className="flex">
                  <IconButton label={c.is_active ? "Hide" : "Show"} onClick={() => toggle(c)}>
                    {c.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                  <IconButton label="Edit" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" onClick={() => setDeleting(c)} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <CertificateForm certificate={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete certificate?"
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