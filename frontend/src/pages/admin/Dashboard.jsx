import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, FolderTree, Inbox, MessageSquareText, Package } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../utils/time";

const STATUS_BADGE = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-blue-100 text-blue-800",
  closed: "bg-stone-200 text-stone-700",
};

export default function Dashboard() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load dashboard"));
  }, []);

  const cards = [
    { label: "New inquiries", value: stats?.new_inquiries, icon: Inbox, to: "/admin/inquiries", alert: stats?.new_inquiries > 0 },
    { label: "Inquiries (7 days)", value: stats?.inquiries_week, icon: MessageSquareText, to: "/admin/inquiries" },
    { label: "Live products", value: stats ? `${stats.products_live} / ${stats.products}` : undefined, icon: Package, to: "/admin/products" },
    { label: "Categories", value: stats?.categories, icon: FolderTree, to: "/admin/categories" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-stone-900">Hello, {admin?.name}</h1>
      <p className="mt-1 text-stone-500">
        {stats?.new_inquiries
          ? `You have ${stats.new_inquiries} new inquir${stats.new_inquiries === 1 ? "y" : "ies"} waiting.`
          : "Everything is up to date."}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to, alert }) => (
          <Link
            key={label}
            to={to}
            className={`rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              alert ? "border-amber-300 ring-2 ring-amber-100" : "border-stone-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-500">{label}</p>
              <div className={`grid h-10 w-10 place-items-center rounded-lg ${alert ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-700"}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-stone-900">{value ?? "…"}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="font-semibold text-stone-900">Latest inquiries</h2>
          <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {!stats ? (
          <div className="h-40 animate-pulse" />
        ) : stats.recent.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">No inquiries yet.</p>
        ) : (
          stats.recent.map((i) => (
            <Link
              key={i.id}
              to={`/admin/inquiries?id=${i.id}`}
              className="flex items-center justify-between gap-4 border-b border-stone-100 px-6 py-4 last:border-0 hover:bg-stone-50"
            >
              <div className="min-w-0">
                <p className={`truncate ${i.status === "new" ? "font-bold text-stone-900" : "font-medium text-stone-700"}`}>
                  {i.full_name}
                </p>
                <p className="truncate text-sm text-stone-500">{[i.company, i.country].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                <span className="text-xs text-stone-400">{timeAgo(i.created_at)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}