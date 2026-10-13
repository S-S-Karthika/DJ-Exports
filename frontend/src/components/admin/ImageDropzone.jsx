import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, RefreshCw } from "lucide-react";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ImageDropzone({
  file, existingUrl, onChange, error, minWidth = 0, aspect = "aspect-video", fit = "cover",
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState("");
  const [localError, setLocalError] = useState("");

  // Local preview + resolution check (warns, doesn't block)
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setWarning("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (minWidth) {
      const img = new Image();
      img.onload = () =>
        setWarning(
          img.naturalWidth < minWidth
            ? `This image is ${img.naturalWidth}px wide. Use at least ${minWidth}px or it will look blurry on large screens.`
            : ""
        );
      img.src = url;
    }
    return () => URL.revokeObjectURL(url);
  }, [file, minWidth]);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setLocalError("Only JPG, PNG or WEBP images");
    if (f.size > MAX) return setLocalError("Image must be under 5 MB");
    setLocalError("");
    onChange(f);
  };

  const shown = preview || existingUrl;
  const err = localError || error;

  return (
    <div>
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`group relative ${aspect} cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging
            ? "border-brand-600 bg-brand-50"
            : err
            ? "border-red-400"
            : "border-stone-300 hover:border-brand-500"
        }`}
      >
        {shown ? (
          <>
                        <img
              src={shown}
              alt="Preview"
              className={`h-full w-full ${fit === "contain" ? "object-contain bg-stone-50" : "object-cover"}`}
            />
            <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-800">
                <RefreshCw className="h-4 w-4" /> Change image
              </span>
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-stone-500">
            <div>
              <ImagePlus className="mx-auto h-10 w-10 text-stone-400" />
              <p className="mt-3 font-medium text-stone-700">Click or drag an image here</p>
              <p className="mt-1 text-xs">JPG, PNG or WEBP · max 5 MB</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          pick(e.target.files[0]);
          e.target.value = "";
        }}
      />

      {err && <p className="mt-1.5 text-sm text-red-600">{err}</p>}
      {warning && (
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-amber-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {warning}
        </p>
      )}
    </div>
  );
}