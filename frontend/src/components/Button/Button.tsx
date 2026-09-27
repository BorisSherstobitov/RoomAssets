import { type ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import s from "./Button.module.css";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

type NativeButtonProps = ComponentPropsWithoutRef<"button">;

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={clsx(
        s.button,
        s[variant],
        s[size],
        rest.disabled && s.disabled,
        rest.className
      )}
    >
      {children}
    </button>
  );
}
