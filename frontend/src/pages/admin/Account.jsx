import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, KeyRound, Loader2, Save, UserRound } from "lucide-react";
import api from "../../api/axios";
import { Card, Field, PageHeader, inputClass } from "../../components/admin/ui";
import { useAuth } from "../../context/AuthContext";

// Simple strength hint: length + variety of characters
const strengthOf = (pw) => {
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Okay", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-brand-600", width: "100%" };
};

export default function Account() {
  const { admin, updateAdmin } = useAuth();

  /* ---------- Profile ---------- */
  const [profile, setProfile] = useState({ name: admin?.name || "", email: admin?.email || "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const profileDirty = profile.name !== (admin?.name || "") || profile.email !== (admin?.email || "");

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put("/auth/me", profile);
      updateAdmin(data);
      setProfile({ name: data.name, email: data.email });
      setProfileErrors({});
      toast.success("Profile updated");
    } catch (err) {
      setProfileErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---------- Password ---------- */
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [show, setShow] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const changePw = (e) => {
    const { name, value } = e.target;
    setPw((p) => ({ ...p, [name]: value }));
    if (pwErrors[name]) setPwErrors((er) => ({ ...er, [name]: undefined }));
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      setPwErrors({ confirm: "Passwords don't match" });
      return;
    }
    setSavingPw(true);
    try {
      await api.put("/auth/password", {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setPwErrors({});
      toast.success("Password changed. Use the new one next time you log in.");
    } catch (err) {
      setPwErrors(err.response?.data?.errors || {});
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const strength = pw.new_password ? strengthOf(pw.new_password) : null;
  const pwType = show ? "text" : "password";

  return (
    <div>
      <PageHeader title="Account" description="Your admin login details." />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={saveProfile}>
          <Card title="Profile" description="Shown at the top of the admin panel. The email is what you log in with.">
            <div className="space-y-5">
              <Field label="Name" required error={profileErrors.name}>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  maxLength={100}
                  className={inputClass(profileErrors.name)}
                />
              </Field>
              <Field label="Login email" required error={profileErrors.email} hint="You'll use this email to log in from now on.">
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass(profileErrors.email)}
                />
              </Field>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!profileDirty || savingProfile}
                  className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
                >
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
                  Save profile
                </button>
              </div>
            </div>
          </Card>
        </form>

        {/* Password */}
        <form onSubmit={savePassword}>
          <Card title="Change password" description="At least 10 characters. A short phrase works well, e.g. Linen-Harbor-Tiger-58">
            <div className="space-y-5">
              <Field label="Current password" required error={pwErrors.current_password}>
                <input
                  type={pwType}
                  name="current_password"
                  value={pw.current_password}
                  onChange={changePw}
                  autoComplete="current-password"
                  className={inputClass(pwErrors.current_password)}
                />
              </Field>

              <Field label="New password" required error={pwErrors.new_password}>
                <input
                  type={pwType}
                  name="new_password"
                  value={pw.new_password}
                  onChange={changePw}
                  autoComplete="new-password"
                  className={inputClass(pwErrors.new_password)}
                />
              </Field>
              {strength && (
                <div className="-mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                    <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500">Strength: {strength.label}</p>
                </div>
              )}

              <Field label="Confirm new password" required error={pwErrors.confirm}>
                <input
                  type={pwType}
                  name="confirm"
                  value={pw.confirm}
                  onChange={changePw}
                  autoComplete="new-password"
                  className={inputClass(pwErrors.confirm)}
                />
              </Field>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {show ? "Hide passwords" : "Show passwords"}
                </button>
                <button
                  type="submit"
                  disabled={savingPw || !pw.current_password || !pw.new_password || !pw.confirm}
                  className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40"
                >
                  {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Change password
                </button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}