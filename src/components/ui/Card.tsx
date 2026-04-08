import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "bordered" | "gradient";
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: boolean;
}

export function Card({
  children,
  variant = "default",
  className = "",
  onClick,
  hover = false,
  padding = true,
}: CardProps) {
  const base = "rounded-xl transition-all duration-200";
  const variants = {
    default: "bg-surface border border-border",
    bordered:
      "bg-surface border-2 border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
    gradient:
      "bg-gradient-to-br from-surface via-surface to-background border border-border",
  };

  return (
    <div
      onClick={onClick}
      className={`${base} ${variants[variant]} ${
        hover
          ? "hover:bg-surface-hover hover:border-primary/30 cursor-pointer"
          : ""
      } ${onClick ? "cursor-pointer" : ""} ${
        padding ? "p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export default Card;
