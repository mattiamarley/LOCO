import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Area riservata in sviluppo", robots: { index: false, follow: false } };

export default function AppPlaceholder() {
  return <main className="flex min-h-screen items-center justify-center bg-loco-lavender/30 px-5 py-20">
    <section className="w-full max-w-[760px] rounded-[34px] border border-loco-purple/20 bg-white p-9 text-center shadow-lg shadow-loco-purple/5 sm:p-16">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-loco-purple"><ArrowLeft size={17} aria-hidden /> Torna al sito</Link>
      <h1 className="loco-display text-[clamp(44px,7vw,83px)] leading-[.98]">Il tuo spazio LOCO sta arrivando.</h1>
      <p className="mx-auto mt-7 max-w-[560px] text-lg leading-relaxed text-black/75">Questa rotta è riservata alla futura web app. Il login e i percorsi personali non sono ancora collegati a Next.js: l&apos;attuale laboratorio Node/SQLite rimane separato e invariato.</p>
      <Link href="/demo" className="loco-button loco-button-purple mt-9">Prova intanto la demo <ArrowRight size={17} aria-hidden /></Link>
    </section>
  </main>;
}
