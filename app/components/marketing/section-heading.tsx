import type { ReactNode } from "react";

export function SectionHeading({ children, description, className = "" }: { children: ReactNode; description?: string; className?: string }) {
  return <div className={`mx-auto max-w-[820px] text-center ${className}`}>
    <h2 className="loco-display text-[clamp(36px,5.8vw,65px)] leading-[0.98]">{children}</h2>
    {description && <p className="mx-auto mt-5 max-w-[670px] text-[clamp(16px,1.8vw,20px)] leading-relaxed text-black/75">{description}</p>}
  </div>;
}
