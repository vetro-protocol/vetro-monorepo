import { type ComponentProps } from "react";
import { NavLink, useParams } from "react-router";

type Props = ComponentProps<typeof NavLink>;

export const I18nLink = function ({ to, ...props }: Props) {
  const { lang } = useParams();
  const localizedTo = `/${lang}${to}`;

  return <NavLink to={localizedTo} {...props} />;
};
