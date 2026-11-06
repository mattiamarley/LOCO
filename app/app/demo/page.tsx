import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";
import { MemoryDemo } from "@/components/marketing/memory-demo";

export const metadata: Metadata = {
  title: "Demo interattiva",
  description: "Prova LOCO: scegli un luogo, aggiungi una nozione, inventa un'associazione e testa il richiamo. Nessuna registrazione, nessuna AI finta.",
};

export default function DemoPage() {
  return <SiteShell>
    <section className="loco-blob-left loco-blob-right relative overflow-hidden pb-14 pt-16 sm:pb-20 sm:pt-24">
      <div className="loco-container relative z-10 text-center">
        <h1 className="loco-display mx-auto max-w-[880px] text-[clamp(46px,7vw,88px)] leading-[.96]">Vuoi mettere la tua<br />mente alla prova?</h1>
        <p className="mx-auto mt-6 max-w-[600px] text-[clamp(17px,1.9vw,22px)] font-semibold leading-snug">Sperimenta il principio di LOCO: libera la tua immaginazione e associa ciò che vuoi ricordare a un posto.</p>
      </div>
    </section>
    <section className="pb-24 pt-2 sm:pb-32"><MemoryDemo /></section>
    <section className="loco-blob-right relative overflow-hidden py-20 sm:py-28">
      <div className="loco-container relative z-10 grid items-center gap-7 md:grid-cols-[1.05fr_.95fr]">
        <div><h2 className="loco-display text-[clamp(39px,5.2vw,70px)] leading-[.98]">Smetti di usare promemoria, sblocca una memoria pro.</h2><p className="mt-6 max-w-[520px] text-lg">Vuoi sapere perché le associazioni possono aiutare il richiamo? Scopri le tecniche dietro il progetto.</p><Link className="loco-button loco-button-purple mt-8" href="/about">Scopri il metodo <ArrowRight size={17} aria-hidden /></Link></div>
        <img src="/marketing/method-link.webp" alt="Illustrazione LOCO di persone che leggono vicino a un gatto" width="742" height="553" loading="lazy" className="mx-auto h-auto w-full max-w-[470px] mix-blend-multiply" />
      </div>
    </section>
  </SiteShell>;
}
