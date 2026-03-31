import { type ComponentProps } from "react";
import { isRelativeUrl } from "utils/url";

import { ExternalLink } from "../externalLink";
import { I18nLink } from "../i18nLink";

import "./button.css";

/* eslint-disable sort-keys */
const variants = {
  primary: "button-primary",
  secondary: "button-secondary",
  tertiary: "button-tertiary",
  danger: "button-danger",
} as const;
/* eslint-enable sort-keys */

type ButtonSize = "xSmall" | "small" | "xLarge";

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
    variant?: keyof typeof variants;
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
  variant,
  ...props
}: ButtonLinkProps) {
  const sizeClass = buttonSizePresets[size].regular;

  if (
    !props.href ||
    (typeof props.href === "string" && !isRelativeUrl(props.href))
  ) {
    return (
      <ExternalLink
        className={`button--base ${variant ? variants[variant] : "button-nav-secondary"} ${sizeClass}`}
        {...props}
        href={props.href}
      />
    );
  }

  // If variant is not provided, use primary/secondary styles mixed
  // This was designed for links in the navbar.
  const className = variant
    ? `button--base ${variants[variant]} ${sizeClass}`
    : ({ isActive }: { isActive: boolean }) =>
        `button--base ${isActive ? "button-nav-primary" : "button-nav-secondary"} ${sizeClass}`;

  return <I18nLink className={className} {...props} to={props.href} />;
};
