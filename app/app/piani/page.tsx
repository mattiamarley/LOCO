import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "Piani | LOCO",
  description: "Scegli il piano che preferisci. Consulta gli abbonamenti disponibili su LOCO.",
};

export default function PianiPage() {
  return (
    <SiteShell>
      {/* Hero with lavender curved background */}
      <section className="relative overflow-hidden bg-loco-lavender/70 pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div className="loco-container grid items-center gap-8 md:grid-cols-[.48fr_1fr]">
          <div className="flex justify-center md:justify-start">
            <img
              src="/marketing/hero-piani.webp"
              width="511"
              height="546"
              alt="Persona LOCO che studia alla scrivania alta con lampada gialla"
              className="h-auto w-full max-w-[320px] object-contain mix-blend-multiply"
            />
          </div>
          <div>
            <h1 className="loco-display text-[clamp(48px,6.8vw,90px)] leading-[.95] text-black">
              Scegli il <span className="font-extrabold">piano</span><br />
              che preferisci
            </h1>
            <p className="mt-5 text-[clamp(18px,2vw,24px)] font-medium text-black/85">
              Consulta gli abbonamenti disponibili.
            </p>
          </div>
        </div>
      </section>

      {/* Alternating Plan Cards */}
      <section className="bg-white py-24 sm:py-36">
        <div className="loco-container max-w-[1080px] space-y-24 sm:space-y-32">
          {/* Row 1: LOCOMPRO DOPO */}
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="flex justify-center md:justify-start">
              <img
                src="/marketing/card-locomprodopo.webp"
                alt="LOCO MPRO DOPO card con personaggio che cammina"
                width="579"
                height="210"
                className="h-auto w-full max-w-[500px] object-contain"
              />
            </div>
            <div>
              <p className="text-[clamp(17px,1.9vw,22px)] font-normal leading-relaxed text-black/85">
                Ideale per iniziare a familiarizzare con la piattaforma e capire come <strong className="font-extrabold">LOCO</strong> può migliorare la tua memoria grazie alle potenzialità delle tecniche mnemoniche.
              </p>
            </div>
          </div>

          {/* Row 2: POCO LOCO */}
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="md:order-1">
              <p className="text-[clamp(17px,1.9vw,22px)] font-normal leading-relaxed text-black/85">
                Sblocchiamo delle funzioni aggiuntive così puoi scansionare la tua stanza e usarla come luogo prediletto per potenziare la tecnica dei loci.
              </p>
            </div>
            <div className="flex justify-center md:order-2 md:justify-end">
              <img
                src="/marketing/card-pocoloco.webp"
                alt="POCO LOCO card con personaggio che legge"
                width="579"
                height="210"
                className="h-auto w-full max-w-[500px] object-contain"
              />
            </div>
          </div>

          {/* Row 3: PRO LOCO */}
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className="flex justify-center md:justify-start">
              <img
                src="/marketing/card-proloco.webp"
                alt="PRO LOCO card con personaggio che corre con fotocamera"
                width="579"
                height="210"
                className="h-auto w-full max-w-[500px] object-contain"
              />
            </div>
            <div>
              <p className="text-[clamp(17px,1.9vw,22px)] font-normal leading-relaxed text-black/85">
                è il piano fare del tuo cervello una libreria vastissima di informazioni!<br /><br />
                Inoltre, ti regaliamo un fantastico visore per la realtà virtuale così da esercitarti immerso nei tuoi loci.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Con PROLOCO ti regaliamo anche */}
      <section className="bg-white pb-20 pt-8 sm:pb-32 sm:pt-14">
        <div className="loco-container text-center">
          <h2 className="loco-display text-[clamp(44px,6vw,74px)] leading-[.96] text-black">
            Con <span className="font-extrabold">PROLOCO</span> ti<br />
            regaliamo anche
          </h2>
          <div className="mx-auto mt-9 max-w-[660px]">
            <p className="text-[clamp(20px,2.4vw,28px)] font-normal leading-snug text-black">
              <strong className="font-extrabold">Niente</strong> perché in realtà lo paghi.
            </p>
            <p className="mt-4 text-[clamp(18px,2.1vw,24px)] font-normal leading-snug text-black/80">
              Tuttavia in 24h riceverai a casa di tua mamma uno specialissimo kit di benvenuto
            </p>
          </div>
        </div>
      </section>

      {/* Non perdere l'ocasione */}
      <section className="relative overflow-hidden bg-white pb-24 pt-10 sm:pb-36 sm:pt-20">
        <div className="loco-container grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="loco-display text-[clamp(44px,6vw,76px)] leading-[.96] text-black">
              Non perdere<br />
              <span className="font-extrabold">l&apos;ocasione</span>
            </h2>
            <p className="mt-5 text-[clamp(18px,2.2vw,24px)] font-normal text-black/80">
              I cardboard VR sono limitati
            </p>
            <div className="mt-9">
              <Link href="/faq" className="loco-button loco-button-purple !px-8 !py-3 text-[15px]">
                Vai alle Faq
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/marketing/piani-goose.webp"
              alt="Mascotte oca LOCO con becco arancione, nuvolette e foglie fluttuanti"
              width="600"
              height="640"
              className="h-auto w-full max-w-[500px] object-contain"
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
