import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function LocoCta({ title, text, href = "/demo", label = "Prova la demo" }: { title: string; text?: string; href?: string; label?: string }) {
  return <section className="loco-cta-surface relative overflow-hidden bg-white py-20 sm:py-28">
    <div className="loco-container relative z-10 grid items-center gap-10 lg:grid-cols-2">
      <div>
        <h2 className="loco-display max-w-[620px] text-[clamp(40px,5.4vw,75px)] leading-[.98]">{title}</h2>
        {text && <p className="mt-5 max-w-[510px] text-lg text-black/75">{text}</p>}
        <Link href={href} className="loco-button loco-button-purple mt-9 inline-flex items-center gap-2">{label} <ArrowUpRight size={17} aria-hidden /></Link>
      </div>
      <img src="/marketing/faq-cta.webp" alt="Persona LOCO che cammina guardando il telefono" width="882" height="756" loading="lazy" className="mx-auto h-auto w-full max-w-[600px] object-contain mix-blend-multiply" />
    </div>
  </section>;
}
