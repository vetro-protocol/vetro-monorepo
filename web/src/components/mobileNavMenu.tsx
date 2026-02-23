import { useOverlay } from "hooks/useOverlay";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { I18nLink } from "./base/i18nLink";
import { navLinks } from "./navbar/links";

type Props = {
  onClose: VoidFunction;
};

export function MobileNavMenu({ onClose }: Props) {
  const { handleClose, handleTransitionEnd, isOpen, ref } =
    useOverlay<HTMLDivElement>(onClose);
  const location = useLocation();
  const { t } = useTranslation();

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-white p-4 shadow-xl transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        onTransitionEnd={handleTransitionEnd}
        ref={ref}
      >
        <nav className="grid grid-cols-2 gap-4">
          {navLinks.map(function ({ href, Icon, translationKey }) {
            const active = location.pathname.endsWith(href);
            return (
              <I18nLink
                className={`flex flex-col items-center gap-1 rounded-lg py-6 ${active ? "bg-blue-50 [&_path]:fill-blue-500" : "bg-gray-50 [&_path]:fill-gray-600"}`}
                key={href}
                onClick={handleClose}
                to={href}
              >
                <Icon className="size-12" />
                <span
                  className={`text-base leading-[22px] font-semibold tracking-[-0.16px] ${active ? "text-blue-500" : "text-gray-600"}`}
                >
                  {t(translationKey)}
                </span>
              </I18nLink>
            );
          })}
        </nav>
      </div>
    </>,
    document.body,
  );
}
