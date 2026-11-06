import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "LOCO | Memorizza all'infinito",
  description: "Crea percorsi mnemonici virtuali e immagina tutto quello che vuoi con LOCO.",
};

const features = [
  {
    title: "Percorsi virtuali",
    image: "/marketing/feature-route.webp",
    alt: "Pin di localizzazione LOCO",
    copy: "Loco integra percorsi virtuali personalizzati. Scegli luoghi familiari tipo casa di tua nonna, ma anche quella di tua mamma va bene.",
  },
  {
    title: "Associazioni generative",
    image: "/marketing/feature-magic.webp",
    alt: "Stelle generative LOCO",
    copy: "Tutto quello che puoi pensare, puoi vederlo. Loco integra un'intelligenza artificiale da paura per la generazione di immagini.",
  },
  {
    title: "Tecniche mnemoniche",
    image: "/marketing/feature-tools.webp",
    alt: "Strumenti mnemonici LOCO",
    copy: "Loco ti porta ad utilizzare e ad assimilare tecniche mnemoniche scientificamente provate, senza nemmeno doverle studiare.",
  },
  {
    title: "User-centered",
    image: "/marketing/feature-human.webp",
    alt: "Icona persona LOCO",
    copy: "Loco gira sempre intorno a te, tipo le mosche. La progettazione integrata tiene sempre conto delle esigenze dell'utente.",
  },
];

export default function HomePage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="overflow-hidden bg-white pb-14 pt-8 sm:pb-20 sm:pt-16">
        <div className="loco-container grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="py-2">
            <h1 className="loco-display text-[clamp(48px,6.8vw,92px)] leading-[.94] text-black">
              Memorizza<br />
              all&apos;infinito con<br />
              <span className="font-extrabold uppercase">LOCO</span>
            </h1>
            <p className="mt-7 max-w-[440px] text-[clamp(17px,1.9vw,22px)] font-medium leading-[1.25] text-black/85">
              Crea percorsi mnemonici virtuali e immagina tutto quello che vuoi.
            </p>
            <div className="mt-9">
              <Link href="/app" className="loco-button loco-button-purple !px-8 !py-3.5 text-base">
                Entra in LOCO
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <img
              src="/marketing/hero-home.webp"
              alt="Personaggio LOCO con binocolo e cagnolino tra nuvole e foglie"
              width="1797"
              height="1315"
              className="h-auto w-full max-w-[680px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* Che è sto LOCO */}
      <section className="loco-blob-left loco-blob-right relative overflow-hidden py-24 sm:py-36">
        <div className="loco-container relative z-10 text-center">
          <h2 className="loco-display text-[clamp(42px,5.8vw,72px)] text-black">
            Che è sto LOCO
          </h2>
          <p className="mx-auto mt-8 max-w-[720px] text-[clamp(18px,2.2vw,26px)] font-bold leading-snug text-black">
            <strong className="font-extrabold">LOCO</strong> è un tool per la memorizzazione che combina tecniche mnemoniche scientificamente testate per immagazzinare informazioni di qualunque tipo.
          </p>
          <div className="mt-9">
            <Link href="/about" className="loco-button loco-button-purple !px-8 !py-3 text-[15px]">
              Scopri di più
            </Link>
          </div>
        </div>
      </section>

      {/* Come funziona? Di base bene */}
      <section className="pb-24 pt-10 sm:pb-36" aria-labelledby="come-funziona">
        <div className="loco-container">
          <div className="mb-20 text-center">
            <h2 id="come-funziona" className="loco-display text-[clamp(44px,6vw,74px)] leading-[.96] text-black">
              Come funziona?<br />
              <span className="font-extrabold">Di base bene</span>
            </h2>
          </div>

          <div className="mx-auto grid max-w-[1040px] gap-x-14 gap-y-14 md:grid-cols-2 md:gap-y-20">
            {features.map((item) => (
              <div key={item.title} className="grid grid-cols-[100px_1fr] items-start gap-6 sm:grid-cols-[130px_1fr]">
                <img
                  src={item.image}
                  alt={item.alt}
                  width="220"
                  height="220"
                  loading="lazy"
                  className="h-auto w-full max-w-[125px] object-contain"
                />
                <div>
                  <h3 className="loco-display text-[clamp(24px,2.6vw,32px)] leading-tight text-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[15px] font-normal leading-snug text-black/80">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCOnoscono in tanti */}
      <section className="bg-white pb-24 pt-6 sm:pb-36">
        <div className="loco-container">
          <div className="text-center">
            <h2 className="loco-display text-[clamp(42px,5.8vw,72px)] text-black">
              LOCOnoscono in tanti
            </h2>
            <p className="mx-auto mt-4 max-w-[620px] text-[18px] font-medium leading-relaxed text-black/80">
              Tanti parlano di noi. Non ci credi?<br />
              Leggi che hanno da dire gli altri lochi come te
            </p>
          </div>

          <div className="mt-14 flex items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              aria-label="Recensione precedente"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110 lg:flex"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="grid w-full max-w-[1080px] gap-6 md:grid-cols-3 md:items-center">
              {/* Card 1: EVA, Marche */}
              <div className="flex h-full flex-col justify-between rounded-[30px] bg-loco-lavender p-7 text-black sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">EVA, Marche</h3>
                    <div className="flex text-black/40">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} strokeWidth={2.5} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-7 text-[16px] font-medium leading-snug">
                    Applicazione formidabile, funziona davvero! Peccato solo per l&apos;assistenza clienti: rispondono alle mail con le parolacce.
                  </p>
                </div>
              </div>

              {/* Card 2: Sandra, Veneto (Yellow, highlighted) */}
              <div className="flex min-h-[300px] flex-col justify-between rounded-[32px] bg-loco-yellow p-8 text-black shadow-lg shadow-loco-yellow/20 sm:p-9 md:-my-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold uppercase tracking-wider">Sandra, Veneto</h3>
                    <div className="flex text-black">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                      <Star size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="mt-7 text-[18px] font-semibold leading-snug">
                    È impressionante: da quando uso LOCO mi ricordo di tutto. Ho finito la memoria, maledetta mia mamma che mi ha fatto con solo 8 GB.
                  </p>
                </div>
              </div>

              {/* Card 3: MATTIA, Valle d'Aosta */}
              <div className="flex h-full flex-col justify-between rounded-[30px] bg-loco-lavender p-7 text-black sm:p-8">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider">MATTIA, Valle d&apos;Aosta</h3>
                    <div className="flex text-black">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-7 text-[16px] font-medium leading-snug">
                    Sono riuscito ad imparare i primi 300 decimali del pigreco. Ora ho finalmente una skill da flexare nei miei tinder date.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Prossima recensione"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110 lg:flex"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="mt-12 text-center">
            <Link href="/demo" className="loco-button loco-button-purple !px-9 !py-3.5 text-base">
              Prova tu, poi ci dici
            </Link>
          </div>
        </div>
      </section>

      {/* Ooo? Cosa ca-volo aspetti */}
      <section className="overflow-hidden bg-white pb-24 pt-6 sm:pb-36">
        <div className="loco-container">
          <div className="relative mx-auto max-w-[1080px]">
            <div className="mb-6 md:absolute md:left-0 md:top-6 md:z-10 md:mb-0">
              <h2 className="loco-display text-[clamp(42px,5.5vw,72px)] leading-[.96] text-black">
                Ooo? Cosa ca<br />
                <span className="font-extrabold">-volo aspetti</span>
              </h2>
            </div>
            <div className="flex justify-center">
              <img
                src="/marketing/zoo.webp"
                alt="Oche al parco davanti alla staccionata con cartello ZOO"
                width="2052"
                height="1181"
                loading="lazy"
                className="h-auto w-full max-w-[780px] object-contain"
              />
            </div>
            <div className="mt-6 text-right md:absolute md:bottom-4 md:right-0 md:z-10 md:mt-0">
              <h2 className="loco-display text-[clamp(36px,4.8vw,64px)] leading-[.96] text-black">
                unisciti<br />
                <span className="font-extrabold">agli altri lochi</span>
              </h2>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/app" className="loco-button loco-button-purple !px-9 !py-3.5 text-base">
              Entra in LOCO
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
