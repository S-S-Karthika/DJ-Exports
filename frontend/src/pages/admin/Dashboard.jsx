import { FolderTree, Package, Images, Inbox } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const stats = [
  { label: "Products", icon: Package },
  { label: "Categories", icon: FolderTree },
  { label: "Hero Banners", icon: Images },
  { label: "New Inquiries", icon: Inbox },
];

export default function Dashboard() {
  const { admin } = useAuth();

  return (
    <div>
      <h1 className="font-serif text-3xl text-stone-900">Hello, {admin?.name}</h1>
      <p className="text-stone-500 mt-1">Here's an overview of your website.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-white p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-500">{label}</p>
              <div className="w-10 h-10 rounded-lg bg-brand-50 grid place-items-center">
                <Icon className="w-5 h-5 text-brand-700" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-stone-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}