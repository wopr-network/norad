import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={`rounded border ${className}`}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
