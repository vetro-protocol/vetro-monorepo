import { type ComponentProps } from "react";
import { isRelativeUrl } from "utils/url";

import { ExternalLink } from "../externalLink";
import { I18nLink } from "../i18nLink";

import "./button.css";

const variants = {
  primary: "button-primary",
  secondary: "button-secondary",
  tertiary: "button-tertiary",
} as const;

export type ButtonSize = "xSmall" | "small" | "xLarge";

/* eslint-disable sort-keys */
const buttonSizePresets = {
  xSmall: {
    icon: "button-x-small button-icon",
    regular: "button-x-small button-regular",
  },
  small: {
    icon: "button-small button-icon",
    regular: "button-small button-regular",
  },
  xLarge: {
    icon: "button-x-large button-icon",
    regular: "button-x-large button-regular",
  },
} as const;
/* eslint-enable sort-keys */

type ButtonStyleProps = {
  variant?: keyof typeof variants;
  size?: ButtonSize;
};

type ButtonProps = Omit<ComponentProps<"button">, "className"> &
  ButtonStyleProps;

type ButtonLinkProps = Omit<ComponentProps<"a">, "href" | "ref" | "className"> &
  Required<{ href: ComponentProps<typeof I18nLink>["to"] }> & {
    size?: ButtonSize;
  };

export const Button = ({
  size = "small",
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={`button--base ${buttonSizePresets[size].regular} ${variants[variant]}`}
    {...props}
  />
);

export const ButtonIcon = ({
  size = "xSmall",
  variant = "primary",
  ...props
}: ButtonProps) => (
  <button
    className={`button--base ${buttonSizePresets[size].icon} ${variants[variant]}`}
    {...props}
  />
);

export const ButtonLink = function ({
  size = "xSmall",
  ...props
}: ButtonLinkProps) {
  const sizeClass = buttonSizePresets[size].regular;

  if (
    !props.href ||
    (typeof props.href === "string" && !isRelativeUrl(props.href))
  ) {
    return (
      <ExternalLink
        // External links can't be active
        className={`button--base button-nav-tertiary ${sizeClass}`}
        {...props}
        href={props.href}
      />
    );
  }

  // ButtonLink always uses navbar-style active state detection
  const navClassName = ({ isActive }: { isActive: boolean }) =>
    `button--base ${isActive ? "button-nav-primary" : "button-nav-tertiary"} ${sizeClass}`;

  // Internal links use NavLink's active state detection
  return <I18nLink className={navClassName} {...props} to={props.href} />;
};
