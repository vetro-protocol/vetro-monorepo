import { useTranslation } from "hooks/useTranslation";
import { useLocation, useNavigate } from "react-router";

export const SwitchLanguage = function () {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitch = function () {
    const newLang = i18n.language === "en" ? "es" : "en";
    const newPath = location.pathname.replace(/^\/[^/]+/, `/${newLang}`);
    navigate(newPath);
  };

  return (
    <button className="cursor-pointer" onClick={handleSwitch}>
      {t("language.switchTo")}
    </button>
  );
};
