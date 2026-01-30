import { type ComponentProps } from "react";
import { NavLink, useParams } from "react-router";

type I18nLinkProps = ComponentProps<typeof NavLink>;

export const I18nLink = function ({ to, ...props }: I18nLinkProps) {
  const { lang } = useParams();
  const localizedTo = `/${lang}${to}`;

  return <NavLink to={localizedTo} {...props} />;
};
