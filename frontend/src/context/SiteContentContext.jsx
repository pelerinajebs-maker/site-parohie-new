import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState({});
  const refresh = useCallback(() => {
    api.get("/pages").then((r) => setContent(r.data || {})).catch(() => {});
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return (
    <SiteContentContext.Provider value={{ content, refresh }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  const { content } = ctx || { content: {} };
  // text getter with fallback
  const pc = (page, key, lang, fallback = "") => {
    const block = content?.[page]?.texts?.[key];
    if (!block) return fallback;
    return block[lang] || block.ro || fallback;
  };
  const media = (page, key, fallback = "") => content?.[page]?.media?.[key] || fallback;
  return { ...ctx, pc, media };
}
