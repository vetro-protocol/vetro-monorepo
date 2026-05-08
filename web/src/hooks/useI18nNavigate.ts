import { useCallback } from "react";
import { type NavigateOptions, useNavigate, useParams } from "react-router";

export function useI18nNavigate() {
  const { lang } = useParams();
  const navigate = useNavigate();

  return useCallback(
    function navigateLocalized(to: string, options?: NavigateOptions) {
      navigate(`/${lang}${to}`, options);
    },
    [lang, navigate],
  );
}
