import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderTree, Package, Images, Inbox, Settings, LogOut, Menu, X, BadgeCheck, FileText, LayoutGrid,Palette,UserRound,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SiteLogo from "../components/public/SiteLogo";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/banners", label: "Hero Banners", icon: Images },
  { to: "/admin/about", label: "About Page", icon: FileText },
  { to: "/admin/certificates", label: "Certificates", icon: BadgeCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/admin/logo", label: "Logo", icon: Palette },
    { to: "/admin/gallery", label: "Gallery", icon: LayoutGrid },
      { to: "/admin/account", label: "Account", icon: UserRound },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  // New-inquiries badge: reloads on every page change and whenever the inbox changes something
  useEffect(() => {
    const loadCount = () =>
      api.get("/admin/stats").then((res) => setNewCount(res.data.new_inquiries)).catch(() => {});
    loadCount();
    window.addEventListener("inquiries:changed", loadCount);
    return () => window.removeEventListener("inquiries:changed", loadCount);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-100">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-9 w-9 rounded-full bg-white p-0.5 text-sm" />
            <span className="font-serif text-xl">Admin</span>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-white text-brand-900" : "text-brand-100 hover:bg-white/10"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              {to === "/admin/inquiries" && newCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
                  {newCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link
            to="/admin/account"
            className="ml-auto flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-stone-100"
            title="Account"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-stone-800">{admin?.name}</p>
              <p className="text-xs text-stone-500">{admin?.email}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-semibold text-white">
              {admin?.name?.[0]?.toUpperCase()}
            </div>
          </Link>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}