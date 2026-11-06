import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Home",
  description: "Memorizza con LOCO: percorsi mnemonici, associazioni personali, tecniche di memoria e richiamo attivo. Scopri come funziona il progetto.",
};

const features = [
  { title: "Percorsi virtuali", image: "/marketing/feature-route.webp", alt: "Pin di localizzazione illustrato", copy: "Collega le nozioni a luoghi che conosci: una porta, una piazza o il tragitto verso casa." },
  { title: "Associazioni generative", image: "/marketing/feature-magic.webp", alt: "Stella brillante illustrata", copy: "Dai vita a immagini mentali personali. I suggerimenti AI sono una funzione in sviluppo." },
  { title: "Tecniche mnemoniche", image: "/marketing/feature-tools.webp", alt: "Strumenti illustrati", copy: "Scopri il metodo dei loci, i collegamenti e altre strategie con esempi concreti." },
  { title: "User-centered", image: "/marketing/feature-human.webp", alt: "Persona e icona illustrativa", copy: "Sei tu a decidere i luoghi, le associazioni e quando ripassare. LOCO ti accompagna." },
];

export default function HomePage() {
  return <SiteShell>
    <section className="overflow-hidden bg-white pb-10 pt-10 sm:pb-20 sm:pt-20">
      <div className="loco-container grid items-center gap-9 lg:grid-cols-[.98fr_1.02fr] lg:gap-2">
        <div className="relative z-10 py-2">
          <h1 className="loco-display text-[clamp(53px,6.7vw,95px)] leading-[.94]">
            Memorizza all&apos;infinito con <span className="block font-extrabold">LOCO</span>
          </h1>
          <p className="mt-7 max-w-[445px] text-[clamp(17px,1.9vw,23px)] font-medium leading-[1.23]">Crea percorsi mnemonici virtuali e immagina tutto quello che vuoi.</p>
          <Link href="/demo" className="loco-button loco-button-purple mt-10">Prova LOCO <ArrowUpRight size={17} aria-hidden /></Link>
        </div>
        <img src="/marketing/hero-home.webp" alt="Personaggio LOCO che esplora con un binocolo accompagnato da un cagnolino" width="861" height="777" className="mx-auto h-auto w-full max-w-[630px] object-contain mix-blend-multiply" />
      </div>
    </section>

    <section className="loco-blob-left loco-blob-right relative overflow-hidden py-24 sm:py-36">
      <div className="loco-container relative z-10 text-center">
        <SectionHeading description="LOCO è un progetto per la memorizzazione che unisce luoghi, associazioni personali e tecniche di apprendimento. Per ricordare, non basta leggere: bisogna provare a richiamare.">Che è sto LOCO</SectionHeading>
        <Link href="/about" className="loco-button loco-button-purple mt-10">Scopri di più <ArrowRight size={17} aria-hidden /></Link>
      </div>
    </section>

    <section className="pb-24 pt-10 sm:pb-32" aria-labelledby="come-funziona">
      <div className="loco-container">
        <SectionHeading className="mb-16">Come funziona?<br /><span id="come-funziona">Di base bene</span></SectionHeading>
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 md:gap-y-20">
          {features.map((item) => <div key={item.title} className="grid grid-cols-[108px_1fr] items-center gap-5 sm:grid-cols-[135px_1fr] sm:gap-8">
            <img src={item.image} alt={item.alt} width="220" height="220" loading="lazy" className="h-[120px] w-[120px] object-contain sm:h-[145px] sm:w-[145px]" />
            <div><h3 className="loco-display text-[clamp(22px,2.5vw,30px)] leading-tight">{item.title}</h3><p className="mt-3 text-[15px] leading-snug text-black/75">{item.copy}</p></div>
          </div>)}
        </div>
      </div>
    </section>

    <section className="bg-[#fbf9ff] py-24 sm:py-32">
      <div className="loco-container text-center">
        <SectionHeading description="Le testimonianze arriveranno dopo i test con utenti veri. Intanto, la prova migliore è sperimentare il metodo in prima persona.">Non fidarti delle promesse.<br />Fai una prova.</SectionHeading>
        <div className="mt-9 flex justify-center"><Link href="/demo" className="loco-button loco-button-purple">Prova tu, poi ci dici <ArrowUpRight size={17} aria-hidden /></Link></div>
      </div>
    </section>

    <section className="overflow-hidden py-24 sm:py-32">
      <div className="loco-container grid items-center gap-4 md:grid-cols-[.8fr_1.2fr]">
        <div><h2 className="loco-display text-[clamp(39px,5vw,70px)] leading-[.96]">Ooo? Cosa ca-LOCO aspetti?</h2><p className="mt-5 text-lg">Vieni a fare un giro tra i tuoi ricordi.</p><Link href="/demo" className="loco-button loco-button-purple mt-9">Entra in LOCO <ArrowRight size={17} aria-hidden /></Link></div>
        <img src="/marketing/zoo.webp" alt="Illustrazione LOCO di oche al parco" width="952" height="749" loading="lazy" className="mx-auto h-auto w-full max-w-[670px] mix-blend-multiply" />
      </div>
    </section>
  </SiteShell>;
}
