import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#contenuto" className="loco-skip">Salta al contenuto</a>
      <SiteHeader />
      <main id="contenuto">{children}</main>
      <SiteFooter />
    </>
  );
}
