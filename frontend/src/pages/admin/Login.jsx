import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, Globe2, ShieldCheck, Package } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { admin, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (admin) return <Navigate to="/admin" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach server. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-brand-900 text-white p-12 flex-col justify-between">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-700/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-brand-600/30 blur-3xl" />

        <div className="relative">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-100/80">Admin Console</p>
          <h1 className="font-serif text-5xl leading-tight mt-6">
            Manage your<br />export business<br />in one place.
          </h1>
        </div>

        <ul className="relative space-y-5 text-brand-50/90">
          <li className="flex items-center gap-3"><Package className="w-5 h-5" /> Products, categories and banners</li>
          <li className="flex items-center gap-3"><Globe2 className="w-5 h-5" /> Track buyer inquiries worldwide</li>
          <li className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Secure, token-protected access</li>
        </ul>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-stone-50">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-3xl text-stone-900">Welcome back</h2>
          <p className="text-stone-500 mt-2">Sign in to your admin account</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="email" name="email" required autoComplete="email"
                  value={form.email} onChange={handleChange}
                  className="w-full rounded-lg border border-stone-300 bg-white pl-11 pr-4 py-3 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type={showPw ? "text" : "password"} name="password" required autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  className="w-full rounded-lg border border-stone-300 bg-white pl-11 pr-12 py-3 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}