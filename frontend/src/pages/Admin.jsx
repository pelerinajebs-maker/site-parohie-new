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
import { useSiteContent } from "@/context/SiteContentContext";

const emptyML = { ro: "", de: "", en: "" };

// Editable page config: which text blocks + media each page exposes
const PAGE_CONFIG = {
  home: {
    label: "Pagina principală",
    texts: [
      { k: "hero_kicker", l: "Hero — supratitlu" },
      { k: "hero_title", l: "Hero — titlu (câte o linie pe rând)", textarea: true },
      { k: "hero_subtitle", l: "Hero — subtitlu", textarea: true },
      { k: "about_title", l: "Despre — titlu" },
      { k: "about_text", l: "Despre — text", textarea: true },
      { k: "news_title", l: "Anunțuri/Revistă — titlu" },
      { k: "news_text", l: "Anunțuri/Revistă — text", textarea: true },
      { k: "renov_title", l: "Renovare — titlu" },
      { k: "renov_text", l: "Renovare — text", textarea: true },
      { k: "contact_title", l: "Contact — titlu" },
      { k: "contact_text", l: "Contact — text", textarea: true },
    ],
    media: [
      { k: "hero_image", l: "Imagine hero (fundal biserică)" },
      { k: "about_image", l: "Imagine secțiune Despre" },
      { k: "renovation_image", l: "Imagine secțiune Renovare" },
    ],
  },
  history: {
    label: "Istoric biserică",
    texts: [
      { k: "title", l: "Titlu" },
      { k: "intro", l: "Introducere", textarea: true },
      { k: "p1", l: "Paragraf 1", textarea: true },
      { k: "p2", l: "Paragraf 2", textarea: true },
    ],
    media: [{ k: "image", l: "Imagine principală" }],
  },
  about: {
    label: "Despre parohie",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  community: {
    label: "Comunitate",
    texts: [
      { k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true },
      { k: "groups", l: "Titlu grupuri" },
      { k: "g1", l: "Grup 1" }, { k: "g2", l: "Grup 2" }, { k: "g3", l: "Grup 3" },
      { k: "activities", l: "Titlu activități" },
      { k: "a1", l: "Activitate 1" }, { k: "a2", l: "Activitate 2" }, { k: "a3", l: "Activitate 3" },
    ],
    media: [],
  },
  resources: {
    label: "Resurse duhovnicești (hub)",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  renovation: {
    label: "Renovare biserică",
    texts: [
      { k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true },
      { k: "state", l: "Titlu — Starea actuală" }, { k: "stateText", l: "Text — Starea actuală", textarea: true },
      { k: "goals", l: "Titlu — Obiective" },
      { k: "g1", l: "Obiectiv 1" }, { k: "g2", l: "Obiectiv 2" }, { k: "g3", l: "Obiectiv 3" },
      { k: "gallery", l: "Titlu — Galerie" },
      { k: "support", l: "Titlu — Cum ajuți" }, { k: "supportText", l: "Text — Cum ajuți", textarea: true },
    ],
    media: [],
  },
  contact: {
    label: "Contact",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  donate: {
    label: "Donează",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  newsletter: {
    label: "Newsletter",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  calendar: {
    label: "Calendar ortodox",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  patron: {
    label: "Hramul parohiei",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  priest: {
    label: "Cuvântul Preotului",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  catechesis: {
    label: "Catehizare",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  prayers: {
    label: "Rugăciuni",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  announcements: {
    label: "Anunțuri (pagina listă)",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
  magazine: {
    label: "Revista parohială (listă)",
    texts: [{ k: "title", l: "Titlu" }, { k: "intro", l: "Introducere", textarea: true }],
    media: [],
  },
};

function MLField({ label, value, onChange, textarea }) {
  const Comp = textarea ? Textarea : Input;
  return (
    <div>
      <label className="text-sm font-semibold text-inkbrown block mb-1">{label}</label>
      <Comp placeholder="Text în română" value={value?.ro || ""}
        onChange={(e) => onChange({ ...value, ro: e.target.value })}
        className="bg-creamalt border-byzgold/30 text-sm" rows={textarea ? 3 : undefined} />
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

function PagesManager() {
  const { refresh } = useSiteContent();
  const [page, setPage] = useState("home");
  const [texts, setTexts] = useState({});
  const [media, setMedia] = useState({});
  const cfg = PAGE_CONFIG[page];

  const load = (pg) => {
    api.get(`/pages/${pg}`).then((r) => {
      setTexts(r.data.texts || {});
      setMedia(r.data.media || {});
    }).catch(() => { setTexts({}); setMedia({}); });
  };
  useEffect(() => { load(page); }, [page]);

  const save = async () => {
    try {
      await api.put(`/pages/${page}`, { texts, media });
      toast.success("Conținut salvat");
      refresh();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(PAGE_CONFIG).map((pg) => (
          <button key={pg} onClick={() => setPage(pg)} data-testid={`page-tab-${pg}`}
            className={`px-4 py-2 rounded-sm border text-sm transition-colors ${page === pg ? "bg-byzgold border-byzgold text-inkbrown" : "border-byzgold/30 hover:border-byzgold"}`}>
            {PAGE_CONFIG[pg].label}
          </button>
        ))}
      </div>
      <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-5" data-testid="pages-editor">
        <p className="text-sm text-inkbrown/60">Lasă un câmp gol pentru a folosi textul implicit. Poți completa RO / DE / EN.</p>
        {cfg.texts.map((f) => (
          <MLField key={f.k} label={f.l} value={texts[f.k] || { ...emptyML }} onChange={(v) => setTexts({ ...texts, [f.k]: v })} textarea={f.textarea} />
        ))}
        {cfg.media.map((m) => (
          <div key={m.k}>
            <label className="text-sm font-semibold block mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> {m.l} (URL)</label>
            <Input value={media[m.k] || ""} onChange={(e) => setMedia({ ...media, [m.k]: e.target.value })} placeholder="https://..." className="bg-creamalt border-byzgold/30" data-testid={`media-${m.k}`} />
            {media[m.k] && <img src={media[m.k]} alt="" className="mt-2 h-24 rounded-sm object-cover" />}
          </div>
        ))}
        <button onClick={save} data-testid="pages-save" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-6 py-3 rounded-sm hover:bg-byzgold hover:text-inkbrown transition-colors"><Save className="w-4 h-4" /> Salvează</button>
      </div>
    </div>
  );
}

function NewsletterManager() {
  const [subs, setSubs] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const load = () => api.get("/newsletter/subscribers").then((r) => setSubs(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async (id) => { await api.delete(`/newsletter/subscribers/${id}`); load(); };
  const broadcast = async () => {
    if (!subject || !body) return toast.error("Completează subiect și mesaj");
    setSending(true);
    try {
      const { data } = await api.post("/newsletter/broadcast", { subject, body });
      toast.success(`Trimis către ${data.sent} abonați`);
      setSubject(""); setBody("");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setSending(false); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div>
        <h3 className="font-serif text-2xl text-inkbrown mb-4">Abonați ({subs.length})</h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {subs.length === 0 && <p className="text-inkbrown/50">Niciun abonat.</p>}
          {subs.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-cream border border-byzgold/30 rounded-sm px-4 py-3" data-testid={`sub-${s.id}`}>
              <div><span className="text-inkbrown">{s.email}</span>{s.name && <span className="text-inkbrown/50 text-sm"> · {s.name}</span>}</div>
              <button onClick={() => del(s.id)} className="text-burgundy hover:text-inkbrown"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-4 h-fit">
        <h3 className="font-serif text-2xl text-inkbrown">Trimite newsletter</h3>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subiect" className="bg-creamalt border-byzgold/30" data-testid="broadcast-subject" />
        <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mesaj (poți folosi HTML simplu)" className="bg-creamalt border-byzgold/30" data-testid="broadcast-body" />
        <button onClick={broadcast} disabled={sending} data-testid="broadcast-send" className="inline-flex items-center gap-2 bg-inkbrown text-cream px-6 py-3 rounded-sm hover:bg-byzgold hover:text-inkbrown transition-colors disabled:opacity-60"><Save className="w-4 h-4" /> Trimite tuturor</button>
      </div>
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
  return (
    <div className="bg-cream border border-byzgold/30 rounded-sm p-6 space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Switch checked={s.donation_enabled} onCheckedChange={(c) => setS({ ...s, donation_enabled: c })} data-testid="set-donation-enabled" />
        <span className="text-sm">Buton donații activ</span>
      </div>
      <MLField label="Text buton donații" value={s.donation_button_text} onChange={(v) => setS({ ...s, donation_button_text: v })} />
      <SettingField label="Link donații extern" k="donation_external_link" s={s} setS={setS} />
      <SettingField label="IBAN" k="iban" s={s} setS={setS} />
      <SettingField label="Titular cont" k="account_holder" s={s} setS={setS} />
      <SettingField label="Bancă" k="bank_name" s={s} setS={setS} />
      <SettingField label="Număr WhatsApp (ex. 40787867540)" k="whatsapp_number" s={s} setS={setS} />
      <SettingField label="Telefon" k="phone" s={s} setS={setS} />
      <SettingField label="Email" k="email" s={s} setS={setS} />
      <SettingField label="Adresă" k="address" s={s} setS={setS} />
      <MLField label="Program oficiu" value={s.office_hours} onChange={(v) => setS({ ...s, office_hours: v })} />

      <div className="pt-4 border-t border-byzgold/20">
        <div className="font-semibold text-inkbrown mb-3">Fondul de renovare (bara de progres)</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-inkbrown/60">Obiectiv (RON)</label>
            <Input type="number" value={s.renov_goal ?? 0} onChange={(e) => setS({ ...s, renov_goal: parseFloat(e.target.value) || 0 })} className="bg-creamalt border-byzgold/30" data-testid="set-renov-goal" />
          </div>
          <div>
            <label className="text-xs text-inkbrown/60">Strâns până acum (RON)</label>
            <Input type="number" value={s.renov_raised ?? 0} onChange={(e) => setS({ ...s, renov_raised: parseFloat(e.target.value) || 0 })} className="bg-creamalt border-byzgold/30" data-testid="set-renov-raised" />
          </div>
        </div>
        <div className="mt-3">
          <MLField label="Mesaj sub bară" value={s.renov_note} onChange={(v) => setS({ ...s, renov_note: v })} textarea />
        </div>
      </div>

      <div className="pt-4 border-t border-byzgold/20">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-inkbrown">Sume donații (RON)</span>
          <button onClick={() => setS({ ...s, donation_packages: [...(s.donation_packages || []), { id: `pkg${Date.now()}`, amount: 0, label: { ...emptyML } }] })}
            data-testid="add-package" className="inline-flex items-center gap-1 text-sm bg-byzgold text-inkbrown px-3 py-1.5 rounded-sm"><Plus className="w-3 h-3" /> Adaugă</button>
        </div>
        <div className="space-y-3">
          {(s.donation_packages || []).map((pkg, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 bg-creamalt border border-byzgold/20 rounded-sm p-3" data-testid={`package-row-${idx}`}>
              <div className="w-28">
                <label className="text-xs text-inkbrown/60">Sumă</label>
                <Input type="number" value={pkg.amount} onChange={(e) => { const arr = [...s.donation_packages]; arr[idx] = { ...pkg, amount: parseFloat(e.target.value) || 0 }; setS({ ...s, donation_packages: arr }); }} className="bg-cream border-byzgold/30" data-testid={`package-amount-${idx}`} />
              </div>
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs text-inkbrown/60">Etichetă</label>
                <Input placeholder="ex. Lumânare" value={pkg.label?.ro || ""} onChange={(e) => { const arr = [...s.donation_packages]; arr[idx] = { ...pkg, label: { ...pkg.label, ro: e.target.value } }; setS({ ...s, donation_packages: arr }); }} className="bg-cream border-byzgold/30 text-sm" />
              </div>
              <button onClick={() => { const arr = s.donation_packages.filter((_, i) => i !== idx); setS({ ...s, donation_packages: arr }); }} className="p-2 text-burgundy" data-testid={`package-del-${idx}`}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

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
            {[["announcements","Anunțuri"],["magazine","Revistă"],["resources","Resurse"],["renovation","Renovare"],["pages","Pagini"],["newsletter","Newsletter"],["messages","Mesaje"],["settings","Setări"]].map(([v,l]) => (
              <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="data-[state=active]:bg-byzgold data-[state=active]:text-inkbrown border border-byzgold/30 rounded-sm px-4 py-2">{l}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="announcements"><ContentManager kind="announcement" /></TabsContent>
          <TabsContent value="magazine"><ContentManager kind="magazine" /></TabsContent>
          <TabsContent value="resources"><ContentManager kind="resource" withCategory /></TabsContent>
          <TabsContent value="renovation"><RenovationManager /></TabsContent>
          <TabsContent value="pages"><PagesManager /></TabsContent>
          <TabsContent value="newsletter"><NewsletterManager /></TabsContent>
          <TabsContent value="messages"><Messages /></TabsContent>
          <TabsContent value="settings"><SettingsManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
