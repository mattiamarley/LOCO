import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "Piani",
  description: "Scopri i livelli di utilizzo previsti dal concept LOCO. Prezzi, abbonamenti e quote non sono ancora attivi: puoi iniziare dalla demo gratuita.",
};

const plans = [
  { title: "LOCOMPRO DOPO", subtitle: "Per esplorare", tag: "IDEA DI PIANO INIZIALE", description: "Conosci il metodo e scopri come costruire il tuo primo percorso di memoria.", features: ["Percorsi mnemonici essenziali", "Associazioni create da te", "Studio e richiamo manuali"], tone: "white" },
  { title: "POCO LOCO", subtitle: "Per prendere ritmo", tag: "IDEA DI PIANO INTERMEDIO", description: "Più spazio per organizzare nozioni e tornare ad allenarti con regolarità.", features: ["Più percorsi e loci", "Ripassi e cronologia personale", "Eventuali strumenti AI a consumo"], tone: "lavender" },
  { title: "PRO LOCO", subtitle: "Per andare oltre", tag: "VISIONE FUTURA", description: "Ambienti, strumenti e personalizzazioni più avanzati, da verificare prima del lancio.", features: ["Percorsi più complessi", "Funzionalità AI con quote definite", "Esperienze 3D e VR da validare"], tone: "white" },
] as const;

export default function PianiPage() {
  return <SiteShell>
    <section className="relative overflow-hidden bg-loco-lavender/80 py-14 sm:py-24">
      <div className="loco-container grid items-center gap-8 lg:grid-cols-[.48fr_1fr]">
        <img src="/marketing/hero-piani.webp" width="511" height="546" alt="Persona LOCO che studia seduta a una scrivania con lampada gialla" className="mx-auto h-auto w-full max-w-[310px] mix-blend-multiply" />
        <div><h1 className="loco-display text-[clamp(52px,6vw,85px)] leading-[.95]">Scegli il <strong>piano</strong><br />che preferisci</h1><p className="mt-5 text-xl">Consulta le opzioni del concept LOCO.</p></div>
      </div>
    </section>

    <section className="py-16 sm:py-28">
      <div className="loco-container">
        <div className="mx-auto mb-16 max-w-[770px] rounded-[20px] border border-loco-purple/40 bg-[#f8f6ff] px-7 py-6 text-center">
          <p className="text-lg font-bold text-loco-purple">Questi non sono abbonamenti acquistabili.</p>
          <p className="mt-2 text-[15px] text-black/75">I nomi provengono dai materiali originali. Prezzi, limiti, eventuali scan 3D e benefici commerciali verranno definiti dopo le verifiche tecniche ed economiche.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => <article key={plan.title} className={`flex flex-col rounded-[28px] border-[2px] p-7 sm:p-8 ${plan.tone === "lavender" ? "border-loco-purple bg-loco-lavender/25" : "border-loco-lavender bg-white"}`}>
            <span className="w-fit rounded-full bg-loco-cream px-4 py-2 text-xs font-bold tracking-wide">{plan.tag}</span>
            <h2 className="loco-display mt-9 text-[clamp(35px,3vw,47px)] uppercase leading-[.92]">{plan.title}</h2>
            <p className="mt-3 text-lg font-bold">{plan.subtitle}</p>
            <p className="mt-4 min-h-[92px] text-[15px] leading-relaxed text-black/75">{plan.description}</p>
            <div className="my-6 h-px bg-black/10" />
            <ul className="flex-1 space-y-4">
              {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-[15px] leading-snug"><Check aria-hidden className="shrink-0 text-loco-purple" size={19} /> {feature}</li>)}
            </ul>
            <Link href={index === 0 ? "/demo" : "/faq"} className={`loco-button mt-10 ${index === 1 ? "loco-button-purple" : "loco-button-outline"}`}>{index === 0 ? "Prova la demo" : "Approfondisci"}<ArrowRight size={17} aria-hidden /></Link>
          </article>)}
        </div>
      </div>
    </section>

    <section className="loco-blob-left relative overflow-hidden py-20 sm:py-28">
      <div className="loco-container text-center">
        <h2 className="loco-display text-[clamp(38px,5.3vw,67px)] leading-[1.02]">Non perdere l&apos;ocasione.</h2>
        <p className="mx-auto mt-5 max-w-[580px] text-xl">Per ora non c&apos;è nulla da comprare: LOCO sta costruendo la sua prima versione utilizzabile.</p>
        <Link href="/faq" className="loco-button loco-button-purple mt-9">Vai alle FAQ <ArrowRight size={17} aria-hidden /></Link>
        <img src="/marketing/hero-faq.webp" alt="Oca e cagnolino illustrati LOCO" width="763" height="515" loading="lazy" className="mx-auto mt-9 h-auto w-full max-w-[520px] mix-blend-multiply" />
      </div>
    </section>
  </SiteShell>;
}
