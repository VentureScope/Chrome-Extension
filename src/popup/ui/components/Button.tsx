import React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  // Use the existing popup.css classnames so styles work without Tailwind
  const classes: string[] = [];
  if (variant === "primary") classes.push("btn", "btn-primary");
  else if (variant === "secondary") classes.push("btn", "btn-secondary");
  else if (variant === "icon") classes.push("btn-icon");
  else if (variant === "ghost") classes.push("btn-back");

  if (size === "sm") classes.push("btn-sm");
  // md/lg will use default sizing from CSS

  if (className) classes.push(className);

  return (
    <button className={classes.join(" ")} {...rest}>
      {children}
    </button>
  );
}

export default Button;
