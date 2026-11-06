import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "FAQ | LOCO",
  description: "Il cane fa bau, LOCO faQuack. Risposte alle domande più frequenti su LOCO e le tecniche di memoria.",
};

const questions = [
  {
    question: <>Cosa è un <strong className="font-extrabold">palazzo della memoria</strong>?</>,
    answer: "È una tecnica mnemonica che utilizza un percorso familiare come struttura per ordinare informazioni. Ogni luogo o tappa ospita un'associazione personale che può aiutare a richiamare un concetto.",
  },
  {
    question: <>Cosa sono i <strong className="font-extrabold">Loci</strong>?</>,
    answer: "I loci (singolare: locus) sono i punti stabili e riconoscibili di un percorso: per esempio porta, scrivania, libreria, finestra. Ogni locus diventa un indizio per un'informazione.",
  },
  {
    question: <>In cosa differisce <strong className="font-extrabold">LOCO</strong> dai corsi online sul miglioramento della memoria?</>,
    answer: "LOCO integra un approccio pratico e interattivo: percorsi virtuali personalizzati, generazione di associazioni visive e richiamo attivo guidato, permettendoti di assimilare le tecniche facendole, senza doverle studiare passivamente.",
  },
  {
    question: <>Perchè non imparare le <strong className="font-extrabold">tecniche mnemoniche</strong> da un libro di testo?</>,
    answer: "Un libro può spiegare la teoria, ma la memoria visiva e spaziale richiede pratica attiva e costante. LOCO rende il metodo intuitivo e applicabile fin dal primo giorno.",
  },
  {
    question: <>Dopo quanto tempo vedo gli <strong className="font-extrabold">effetti</strong> di LOCO?</>,
    answer: "Già dopo i primi percorsi: applicando la tecnica dei loci e l'associazione visiva, noterai immediatamente una capacità di richiamo molto superiore a quella a cui sei abituato.",
  },
];

export default function FaqPage() {
  return (
    <SiteShell>
      {/* Hero with curved lavender background */}
      <section className="relative overflow-hidden bg-loco-lavender/70 pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div className="loco-container grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="loco-display text-[clamp(48px,6.8vw,90px)] leading-[.96] text-black">
              Il cane fa bau<br />
              <span className="font-extrabold">LOCO faQuack</span>
            </h1>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/marketing/hero-faq.webp"
              alt="Mascotte oca LOCO con cagnolino, foglie e punto interrogativo"
              width="1169"
              height="699"
              className="h-auto w-full max-w-[520px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="bg-white py-20 sm:py-32">
        <div className="loco-container max-w-[1080px] space-y-6">
          {questions.map((item, index) => (
            <details
              key={index}
              className="group rounded-[30px] border border-black bg-white transition-all open:bg-loco-lavender/10"
            >
              <summary className="flex min-h-[92px] cursor-pointer list-none items-center justify-between gap-6 px-7 py-6 text-[clamp(17px,1.9vw,22px)] font-normal text-black marker:hidden sm:px-10 [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-loco-purple text-white transition-transform duration-200 group-open:rotate-180"
                >
                  <ArrowDown size={20} strokeWidth={2.4} />
                </span>
              </summary>
              <div className="border-t border-black/10 px-7 pb-8 pt-6 sm:px-10">
                <p className="max-w-[820px] text-[17px] font-normal leading-relaxed text-black/80">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* LOCONVINTA? ti diamo pure del lei */}
      <section className="overflow-hidden bg-white pb-24 pt-10 sm:pb-36 sm:pt-16">
        <div className="loco-container grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="loco-display text-[clamp(44px,6.2vw,80px)] leading-[.96] text-black">
              <span className="font-extrabold uppercase">LOCONVINTA?</span><br />
              ti diamo pure<br />
              del lei
            </h2>
            <div className="mt-9">
              <Link href="/app" className="loco-button loco-button-purple !px-9 !py-3.5 text-base">
                Entra in LOCO
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/marketing/faq-cta.webp"
              alt="Personaggio LOCO che corre con smartphone tra foglie e nuvole"
              width="1502"
              height="1093"
              className="h-auto w-full max-w-[580px] object-contain"
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
