import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "About | Le tecniche di memoria",
  description: "Scopri il metodo dei loci, il linked method e la conversione fonetica. LOCO aiuta a costruire associazioni e a metterle alla prova con il richiamo attivo.",
};

const methods = [
  {
    name: "Il palazzo della memoria",
    img: "/marketing/method-loci.webp",
    alt: "Personaggio LOCO che esplora una città con edifici gialli",
    description: "Trasforma i luoghi che conosci in mappe mentali. Associa un concetto a ogni punto di un percorso e ritrovalo ripercorrendo mentalmente quei luoghi.",
  },
  {
    name: "Linked method",
    img: "/marketing/method-link.webp",
    alt: "Illustrazione LOCO di persone e un gatto intorno a un tavolo",
    description: "Crea catene di immagini mentali in cui un elemento richiama il successivo. Funziona bene per esercitarsi con sequenze e informazioni collegate.",
  },
  {
    name: "Conversione fonetica",
    img: "/marketing/method-phonetic.webp",
    alt: "Personaggio LOCO con simboli e numeri",
    description: "Associa numeri a suoni consonantici, poi trasforma le sequenze in parole e immagini. Il codice scelto deve rimanere stabile e va esercitato.",
  },
];

export default function AboutPage() {
  return <SiteShell>
    <section className="overflow-hidden py-12 sm:py-20">
      <div className="loco-container grid items-center gap-9 lg:grid-cols-2">
        <div>
          <h1 className="loco-display text-[clamp(45px,6.3vw,85px)] leading-[.98]">Non ti ricordi <strong>nemmeno il nome</strong> di tua mamma?</h1>
          <p className="mt-8 max-w-[490px] text-[clamp(17px,1.9vw,23px)] leading-tight">Si chiama Paola.<br />Ma tranquillo: non servono conoscenze pregresse o una memoria già allenata per iniziare.</p>
        </div>
        <img src="/marketing/hero-about.webp" width="602" height="735" alt="Persona LOCO seduta a leggere un libro con cuffie e scarpe gialle" className="mx-auto h-auto w-full max-w-[590px] mix-blend-multiply" />
      </div>
    </section>

    <section className="py-20 sm:py-28">
      <div className="loco-container">
        <SectionHeading>Tecnologia from fear</SectionHeading>
        <div className="mx-auto mt-16 grid max-w-[880px] gap-12 sm:grid-cols-2 sm:gap-20">
          <article className="text-center">
            <img src="/marketing/tech-street.webp" alt="Globo illustrato in stile LOCO" width="336" height="329" className="mx-auto mb-6 h-36 w-36 object-contain" />
            <h3 className="loco-display text-3xl uppercase leading-tight">Google<br />Street View</h3>
            <p className="mt-4 text-[16px] text-black/75">La visione di LOCO include percorsi virtuali in luoghi reali, nel rispetto delle licenze e dei limiti dei servizi geografici.</p>
            <span className="mt-3 inline-block rounded-full bg-loco-cream px-4 py-2 text-xs font-bold">Integrazione futura</span>
          </article>
          <article className="text-center">
            <img src="/marketing/tech-ai.webp" alt="Microchip illustrato in stile LOCO" width="385" height="329" className="mx-auto mb-6 h-36 w-36 object-contain" />
            <h3 className="loco-display text-3xl uppercase leading-tight">Intelligenza<br />artificiale</h3>
            <p className="mt-4 text-[16px] text-black/75">Un assistente potrà proporre scene e associazioni. La scelta finale rimarrà dell&apos;utente, che potrà correggerle.</p>
            <span className="mt-3 inline-block rounded-full bg-loco-cream px-4 py-2 text-xs font-bold">Integrazione futura</span>
          </article>
        </div>
        <div className="mt-14 text-center"><Link href="/demo" className="loco-button loco-button-purple">Prova la demo manuale <ArrowRight size={16} aria-hidden /></Link></div>
      </div>
    </section>

    <section className="py-20 sm:py-28">
      <div className="loco-container">
        <SectionHeading>Scopri le tecniche<br />di memoria</SectionHeading>
        <div className="mt-14 space-y-12 sm:mt-20 sm:space-y-24">
          {methods.map((method, i) => <article key={method.name} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div className={i % 2 ? "md:order-2" : ""}>
              <img src={method.img} alt={method.alt} width="750" height="650" loading="lazy" className="mx-auto h-auto max-h-[360px] w-full max-w-[440px] object-contain mix-blend-multiply" />
            </div>
            <div className={i % 2 ? "md:order-1" : ""}>
              <h3 className="loco-display text-[clamp(32px,4vw,48px)] uppercase leading-[.99]">{method.name}</h3>
              <p className="mt-5 max-w-[475px] text-[17px] leading-relaxed text-black/75">{method.description}</p>
            </div>
          </article>)}
        </div>
        <div className="mt-12 text-center"><Link className="loco-button loco-button-purple" href="/faq">Altre domande? <ArrowRight size={16} aria-hidden /></Link></div>
      </div>
    </section>

    <section className="py-20 sm:py-32">
      <div className="loco-container">
        <SectionHeading>Recappino delle<br />nostre qualità</SectionHeading>
        <div className="mt-14 grid gap-12 text-center md:grid-cols-3">
          {[{ icon: "/marketing/quality-memory.webp", title: "Associazioni ordinate", desc: "Percorsi e punti riconoscibili." },{ icon: "/marketing/quality-quality.webp", title: "Richiamo verificabile", desc: "Prove senza risposta in vista." },{ icon: "/marketing/quality-dynamic.webp", title: "Apprendimento personale", desc: "Associazioni che scegli e puoi cambiare." }].map((a) => <div key={a.title}>
            <img src={a.icon} alt="" width="360" height="360" className="mx-auto h-32 w-32 object-contain" loading="lazy" />
            <h3 className="mt-7 text-xl font-bold">{a.title}</h3><p className="mt-2 text-black/70">{a.desc}</p>
          </div>)}
        </div>
        <div className="mt-14 text-center"><Link href="/piani" className="loco-button loco-button-purple">Scopri i piani previsti <ArrowRight size={16} aria-hidden /></Link></div>
      </div>
    </section>
  </SiteShell>;
}
