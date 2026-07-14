import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Trash2, Pencil, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { Cross } from "@/components/motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const LANGS = ["ro", "de", "en"];
const emptyML = { ro: "", de: "", en: "" };

function MLField({ label, value, onChange, textarea }) {
  const Comp = textarea ? Textarea : Input;
  return (
    <div>
      <label className="text-sm font-semibold text-inkbrown block mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {LANGS.map((l) => (
          <Comp key={l} placeholder={l.toUpperCase()} value={value?.[l] || ""}
            onChange={(e) => onChange({ ...value, [l]: e.target.value })}
            className="bg-creamalt border-byzgold/30 text-sm" rows={textarea ? 3 : undefined} />
        ))}
      </div>
    </div>
  );
}

const CATS = [
  { v: "calendar", l: "Calendar" }, { v: "patron", l: "Hram" },
  { v: "priest", l: "Cuvântul Preotului" }, { v: "catechesis", l: "Catehizare" },
  { v: "prayers", l: "Rugăciuni" },
];

function ContentManager({ kind, withCategory }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const blank = { kind, category: withCategory ? "prayers" : null, title: { ...emptyML }, excerpt: { ...emptyML }, body: { ...emptyML }, image: "", published: true };

  const load = () => api.get("/content", { params: { kind, all: true } }).then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, [kind]);

  const save = async () => {
    try {
      const payload = { ...editing };
      if (editing.id) await api.put(`/content/${editing.id}`, payload);
      else await api.post("/content", payload);
      toast.success("Salvat");
      setEditing(null); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/content/${id}`); toast.success("Șters"); load(); };

  return (
    <div>
      {!editing && (
        <button onClick={() => setEditing({ ...blank })} data-testid={`add-${kind}`} className="mb-6 inline-flex items-center gap-2 bg-byzgold text-inkbrown px-5 py-2.5 rounded-sm font-semibold hover:bg-inkbrown hover:text-byzgold transition-colors">
          <Plus className="w-4 h-4" /> Adaugă
        </button>
      )}

      {editing ? (
        <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-4" data-testid="content-editor">
          {withCategory && (
            <div>
              <label className="text-sm font-semibold block mb-1">Categorie</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="bg-creamalt border border-byzgold/30 rounded-sm px-3 py-2" data-testid="content-category">
                {CATS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
          )}
          <MLField label="Titlu" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
          <MLField label="Rezumat" value={editing.excerpt} onChange={(v) => setEditing({ ...editing, excerpt: v })} />
          <MLField label="Conținut" value={editing.body} onChange={(v) => setEditing({ ...editing, body: v })} textarea />
          <div>
            <label className="text-sm font-semibold block mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> URL imagine</label>
            <Input value={editing.image || ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="bg-creamalt border-byzgold/30" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={editing.published} onCheckedChange={(c) => setEditing({ ...editing, published: c })} data-testid="content-published" />
            <span className="text-sm">Publicat</span>
          </div>
          <div className="flex gap-3">
            <button onClick={save} data-testid="content-save" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-5 py-2.5 rounded-sm hover:bg-byzgold hover:text-inkbrown transition-colors"><Save className="w-4 h-4" /> Salvează</button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-byzgold/40 rounded-sm">Anulează</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-inkbrown/50">Nicio înregistrare.</p>}
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between bg-cream border border-byzgold/30 rounded-sm p-4" data-testid={`admin-item-${it.id}`}>
              <div>
                <div className="font-serif text-lg text-inkbrown">{it.title?.ro || "(fără titlu)"}</div>
                <div className="text-xs text-inkbrown/50">{it.category || kind}{it.published ? "" : " · nepublicat"}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(it)} data-testid={`edit-${it.id}`} className="p-2 text-royal hover:text-byzgold"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(it.id)} data-testid={`delete-${it.id}`} className="p-2 text-burgundy hover:text-inkbrown"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RenovationManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ image: "", caption: { ...emptyML } });
  const load = () => api.get("/renovation").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.image) return toast.error("Adaugă un URL de imagine");
    await api.post("/renovation", form); toast.success("Adăugat"); setForm({ image: "", caption: { ...emptyML } }); load();
  };
  const del = async (id) => { await api.delete(`/renovation/${id}`); load(); };
  return (
    <div className="space-y-6">
      <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-4">
        <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="URL imagine" className="bg-creamalt border-byzgold/30" data-testid="renov-image" />
        <MLField label="Descriere" value={form.caption} onChange={(v) => setForm({ ...form, caption: v })} />
        <button onClick={add} data-testid="renov-add" className="inline-flex items-center gap-2 bg-byzgold text-inkbrown px-5 py-2.5 rounded-sm font-semibold"><Plus className="w-4 h-4" /> Adaugă în galerie</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {items.map((g) => (
          <div key={g.id} className="relative border border-byzgold/30 rounded-sm overflow-hidden">
            <img src={g.image} alt="" className="w-full h-32 object-cover" />
            <button onClick={() => del(g.id)} className="absolute top-2 right-2 bg-burgundy text-cream p-1.5 rounded-sm" data-testid={`renov-del-${g.id}`}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingField({ label, k, s, setS }) {
  return (
    <div>
      <label className="text-sm font-semibold block mb-1">{label}</label>
      <Input value={s[k] || ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} className="bg-creamalt border-byzgold/30" data-testid={`set-${k}`} />
    </div>
  );
}

function SettingsManager() {
  const { settings, refresh } = useSettings();
  const [s, setS] = useState(null);
  useEffect(() => { if (settings) setS(settings); }, [settings]);
  if (!s) return <p>Se încarcă...</p>;
  const save = async () => {
    try { await api.put("/settings", s); toast.success("Setări salvate"); refresh(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const F = (label, k) => <SettingField label={label} k={k} s={s} setS={setS} />;
  return (
    <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Switch checked={s.donation_enabled} onCheckedChange={(c) => setS({ ...s, donation_enabled: c })} data-testid="set-donation-enabled" />
        <span className="text-sm">Buton donații activ</span>
      </div>
      <MLField label="Text buton donații" value={s.donation_button_text} onChange={(v) => setS({ ...s, donation_button_text: v })} />
      {F("Link donații extern", "donation_external_link")}
      {F("IBAN", "iban")}
      {F("Titular cont", "account_holder")}
      {F("Bancă", "bank_name")}
      {F("Număr WhatsApp (ex. 40787867540)", "whatsapp_number")}
      {F("Telefon", "phone")}
      {F("Email", "email")}
      {F("Adresă", "address")}
      <MLField label="Program oficiu" value={s.office_hours} onChange={(v) => setS({ ...s, office_hours: v })} />
      <button onClick={save} data-testid="settings-save" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-6 py-3 rounded-sm hover:bg-byzgold hover:text-inkbrown transition-colors"><Save className="w-4 h-4" /> Salvează setările</button>
    </div>
  );
}

function Messages() {
  const [msgs, setMsgs] = useState([]);
  useEffect(() => { api.get("/contact").then((r) => setMsgs(r.data)).catch(() => {}); }, []);
  return (
    <div className="space-y-3">
      {msgs.length === 0 && <p className="text-inkbrown/50">Niciun mesaj.</p>}
      {msgs.map((m) => (
        <div key={m.id} className="bg-cream border border-byzgold/30 rounded-sm p-4">
          <div className="font-semibold text-inkbrown">{m.name} · <span className="text-royal">{m.email}</span></div>
          <p className="text-inkbrown/80 mt-1">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (user === false) nav("/admin/login"); }, [user, nav]);
  if (!user || user === null) return <div className="min-h-screen flex items-center justify-center text-inkbrown/60">Se încarcă...</div>;
  if (!user.email) return null;

  return (
    <div className="min-h-screen bg-creamalt" data-testid="admin-page">
      <header className="bg-inkbrown text-cream">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3"><Cross className="w-5 h-8" /><span className="font-serif text-xl">Administrare Parohie</span></div>
          <button onClick={() => { logout(); nav("/admin/login"); }} data-testid="logout-btn" className="inline-flex items-center gap-2 text-cream/80 hover:text-byzgold transition-colors"><LogOut className="w-4 h-4" /> Ieșire</button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-5 py-10">
        <Tabs defaultValue="announcements">
          <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto mb-6">
            {[["announcements","Anunțuri"],["magazine","Revistă"],["resources","Resurse"],["renovation","Renovare"],["messages","Mesaje"],["settings","Setări"]].map(([v,l]) => (
              <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="data-[state=active]:bg-byzgold data-[state=active]:text-inkbrown border border-byzgold/30 rounded-sm px-4 py-2">{l}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="announcements"><ContentManager kind="announcement" /></TabsContent>
          <TabsContent value="magazine"><ContentManager kind="magazine" /></TabsContent>
          <TabsContent value="resources"><ContentManager kind="resource" withCategory /></TabsContent>
          <TabsContent value="renovation"><RenovationManager /></TabsContent>
          <TabsContent value="messages"><Messages /></TabsContent>
          <TabsContent value="settings"><SettingsManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
