import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";
import { LocoCta } from "@/components/marketing/loco-cta";

export const metadata: Metadata = {
  title: "FAQ | LOCO faQuack",
  description: "Cos'è un palazzo della memoria? Cosa sono i loci? Come funziona LOCO e quali tecniche puoi provare? Risposte alle domande frequenti.",
};

const questions = [
  { question: <>Cosa è un <strong>palazzo della memoria</strong>?</>, answer: "È una tecnica mnemonica che utilizza un percorso familiare come struttura per ordinare informazioni. Ogni luogo o tappa ospita un'associazione personale che può aiutare a richiamare un concetto." },
  { question: <>Cosa sono i <strong>Loci</strong>?</>, answer: "I loci (singolare: locus) sono i punti stabili e riconoscibili di un percorso: per esempio porta, scrivania, libreria, finestra. Ogni locus diventa un indizio per un'informazione." },
  { question: <>In cosa differisce <strong>LOCO</strong> dai corsi online sul miglioramento della memoria?</>, answer: "LOCO vuole permettere non soltanto di studiare le tecniche ma anche di praticarle: scegliere luoghi, costruire associazioni, verificare il richiamo e programmare ripassi. La piattaforma completa è ancora in sviluppo." },
  { question: <>Perché non imparare le <strong>tecniche mnemoniche</strong> da un libro di testo?</>, answer: "Puoi farlo. Un libro può spiegare efficacemente il metodo. LOCO punta ad aggiungere uno spazio pratico per costruire percorsi e conservare i propri tentativi e ripassi." },
  { question: <>Dopo quanto tempo vedo gli <strong>effetti</strong> di LOCO?</>, answer: "Non esiste un tempo universale e non abbiamo risultati sperimentali del prodotto da promettere. Puoi misurare i tuoi progressi usando test di richiamo prima, durante e a distanza di tempo." },
  { question: <>La generazione <strong>AI</strong> e <strong>Street View</strong> sono già disponibili?</>, answer: "No. La demo disponibile è manuale e locale al browser. AI, navigazione Street View e ricostruzione di ambienti personali richiedono ancora sviluppo, verifiche di licenza e test." },
  { question: <>Ci sono già <strong>abbonamenti</strong>?</>, answer: "No. La pagina Piani presenta soltanto le categorie ideate nel concept. Prezzi e quote non sono definitivi e non è possibile pagare." },
];

export default function FaqPage() {
  return <SiteShell>
    <section className="relative overflow-hidden bg-loco-lavender/90 py-12 sm:py-20">
      <div className="loco-container grid items-center gap-8 md:grid-cols-[.95fr_1.05fr]">
        <h1 className="loco-display relative z-10 text-[clamp(46px,6vw,85px)] leading-[.96]">Il cane fa bau<br /><strong>LOCO faQuack</strong></h1>
        <img src="/marketing/hero-faq.webp" alt="Mascotte oca LOCO con un cagnolino, foglie e punto interrogativo" width="763" height="515" className="mx-auto h-auto w-full max-w-[510px] mix-blend-multiply" />
      </div>
    </section>
    <section className="py-16 sm:py-24">
      <div className="loco-container max-w-[1100px] space-y-5">
        {questions.map((item, index) => <details key={index} className="group rounded-[24px] border border-[#4e4e4e] bg-white open:border-loco-purple open:bg-loco-lavender/15">
          <summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-[clamp(16px,1.6vw,20px)] marker:hidden sm:px-10 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span><span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-loco-purple text-white transition-transform group-open:rotate-180"><ArrowDown size={20} /></span>
          </summary>
          <div className="border-t border-black/10 px-6 pb-7 pt-5 sm:px-10"><p className="max-w-[760px] text-[16px] leading-relaxed text-black/75">{item.answer}</p></div>
        </details>)}
      </div>
    </section>
    <LocoCta title="LOCONVINTA? Ti diamo pure del lei." text="Hai capito il metodo? Puoi mettere alla prova un piccolo percorso mnemonico, senza registrarti." href="/demo" label="Entra nella demo" />
  </SiteShell>;
}
