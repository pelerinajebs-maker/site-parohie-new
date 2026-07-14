import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useLang } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Cross } from "@/components/motion";
import { Input } from "@/components/ui/input";

export default function Login() {
  const { t } = useLang();
  const p = t.pages.login;
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user && user.email) nav("/admin"); }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email, password);
      nav("/admin");
    } catch (e2) {
      setErr(formatApiErrorDetail(e2.response?.data?.detail) || p.error);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-creamalt relative grain px-5" data-testid="login-page">
      <div className="relative z-10 w-full max-w-md bg-cream border border-byzgold/30 rounded-sm p-10">
        <div className="flex flex-col items-center mb-8">
          <Cross className="w-8 h-12 mb-4" />
          <h1 className="font-serif text-3xl text-inkbrown">{p.title}</h1>
          <p className="text-inkbrown/60 text-sm mt-1">{p.subtitle}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input type="email" required placeholder={p.email} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" className="bg-creamalt border-byzgold/30 h-12 text-base" />
          <Input type="password" required placeholder={p.password} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" className="bg-creamalt border-byzgold/30 h-12 text-base" />
          {err && <p className="text-burgundy text-sm" data-testid="login-error">{err}</p>}
          <button type="submit" disabled={loading} data-testid="login-submit" className="w-full inline-flex items-center justify-center gap-2 bg-inkbrown text-cream py-3.5 rounded-sm font-medium hover:bg-byzgold hover:text-inkbrown transition-colors disabled:opacity-60">
            <LogIn className="w-4 h-4" /> {p.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
