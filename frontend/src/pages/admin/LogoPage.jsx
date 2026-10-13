import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Trash2, Upload } from "lucide-react";
import api from "../../api/axios";
import { Card, PageHeader } from "../../components/admin/ui";
import ImageDropzone from "../../components/admin/ImageDropzone";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

export default function LogoPage() {
  const { refresh } = useSite();
  const [logo, setLogo] = useState(null);
  const [siteName, setSiteName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/brand")
      .then(({ data }) => {
        setLogo(data.logo || null);
        setSiteName(data.site_name || "");
      })
      .catch(() => toast.error("Failed to load logo"))
      .finally(() => setLoading(false));
  }, []);

  // Local preview of the chosen file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const { data } = await api.put("/admin/brand", fd);
      setLogo(data.logo);
      setFile(null);
      refresh?.(); // updates the logo everywhere without reloading
      toast.success("Logo updated");
    } catch (err) {
      const msg = err.response?.data?.errors?.logo || err.response?.data?.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove the logo? The website will show the company initials instead.")) return;
    setBusy(true);
    try {
      await api.delete("/admin/brand");
      setLogo(null);
      refresh?.();
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    } finally {
      setBusy(false);
    }
  };

  const shown = preview || (logo ? ik(logo, "w-300") : null);
  const initials = (siteName || "DJ").split(" ")[0].slice(0, 3).toUpperCase();

  if (loading) return <div className="h-80 animate-pulse rounded-xl bg-stone-200" />;

  return (
    <div>
      <PageHeader title="Logo" description="Shown in the website navbar, footer, quote popup and this admin panel." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upload" description="Square PNG with a transparent background, at least 500 × 500 px.">
          <div className="mx-auto max-w-xs">
            <ImageDropzone
              file={file}
              existingUrl={logo ? ik(logo, "w-300") : null}
              onChange={(f) => {
                setFile(f);
                setError("");
              }}
              error={error}
              aspect="aspect-square"
              fit="contain"
              minWidth={300}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={upload}
              disabled={!file || busy}
              className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {logo ? "Replace logo" : "Upload logo"}
            </button>
            {logo && (
              <button
                onClick={remove}
                disabled={busy}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </Card>

        <Card title="Preview" description="How it will look on the website.">
          {/* On the dark banner (transparent navbar) */}
          <div className="flex items-center justify-center gap-6 rounded-xl bg-brand-900 p-8">
            <LogoCircle src={shown} initials={initials} size="h-20 w-20" />
            <span className="font-serif text-2xl text-white">{siteName}</span>
          </div>
          {/* On white (scrolled navbar) */}
          <div className="mt-4 flex items-center justify-center gap-6 rounded-xl border border-stone-200 bg-white p-6">
            <LogoCircle src={shown} initials={initials} size="h-14 w-14" />
            <span className="font-serif text-xl text-stone-900">{siteName}</span>
          </div>
          {preview && <p className="mt-4 text-center text-sm text-amber-600">Preview only. Click "Upload logo" to save it.</p>}
        </Card>
      </div>
    </div>
  );
}

function LogoCircle({ src, initials, size }) {
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-md`}>
      {src ? (
        <img src={src} alt="Logo preview" className="h-full w-full object-contain" />
      ) : (
        <span className="font-serif text-lg font-semibold text-brand-800">{initials}</span>
      )}
    </div>
  );
}