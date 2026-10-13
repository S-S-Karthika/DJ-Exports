import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function MultiImageDrop({ files, onChange, maxFiles, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const add = (list) => {
    const incoming = Array.from(list || []);
    const valid = [];
    let msg = "";
    for (const f of incoming) {
      if (!TYPES.includes(f.type)) {
        msg = "Only JPG, PNG or WEBP images";
        continue;
      }
      if (f.size > MAX_SIZE) {
        msg = `${f.name} is over 5 MB`;
        continue;
      }
      valid.push(f);
    }
    const room = maxFiles - files.length;
    if (valid.length > room) msg = room > 0 ? `Only ${room} more image(s) allowed` : "Image limit reached";
    setLocalError(msg);
    if (room > 0 && valid.length) onChange([...files, ...valid.slice(0, room)]);
  };

  const remove = (index) => onChange(files.filter((_, i) => i !== index));
  const err = localError || error;

  return (
    <div>
      {previews.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {previews.map((src, i) => (
            <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                New
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < maxFiles ? (
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
            add(e.dataTransfer.files);
          }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragging ? "border-brand-600 bg-brand-50" : err ? "border-red-400" : "border-stone-300 hover:border-brand-500"
          }`}
        >
          <ImagePlus className="mx-auto h-8 w-8 text-stone-400" />
          <p className="mt-2 font-medium text-stone-700">Click or drag images here</p>
          <p className="mt-1 text-xs text-stone-500">
            JPG, PNG or WEBP · max 5 MB each · {maxFiles - files.length} more allowed
          </p>
        </div>
      ) : (
        <p className="text-sm text-stone-500">Image limit reached. Remove one to add another.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      {err && <p className="mt-1.5 text-sm text-red-600">{err}</p>}
    </div>
  );
}