import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const SiteContext = createContext({ settings: {}, categories: [], refresh: () => {} });

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);

  const refresh = useCallback(
    () =>
      Promise.all([api.get("/public/settings"), api.get("/public/categories")])
        .then(([s, c]) => {
          setSettings(s.data);
          setCategories(c.data);
        })
        .catch((err) => console.error("Failed to load site data:", err)),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteContext.Provider value={{ settings, categories, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);