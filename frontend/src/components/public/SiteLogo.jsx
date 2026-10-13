import { useState } from "react";
import { useSite } from "../../context/SiteContext";
import { ik } from "../../utils/image";

// Shows the uploaded logo, or the company initials if there's none
export default function SiteLogo({ className = "" }) {
  const { settings } = useSite();
  const [failed, setFailed] = useState(false);
  const initials = (settings.site_name || "DJ").split(" ")[0].slice(0, 3).toUpperCase();

  if (!settings.logo || failed) {
    return (
      <span className={`grid place-items-center font-serif font-semibold text-brand-800 ${className}`}>
        {initials}
      </span>
    );
  }

  return (
    <img
      src={ik(settings.logo, "w-200,q-90")}
      alt={settings.site_name || "Logo"}
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  );
}