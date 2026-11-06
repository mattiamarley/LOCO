"use client";

import { useState, type FormEvent, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, MapPin, RotateCcw, Sparkles } from "lucide-react";

type Point = { x: number; y: number };
type Locus = Point & { id: number; concept: string; association: string };
type Outcome = "correct" | "help" | "forgot";

const MAX_LOCI = 5;

export function MemoryDemo() {
  const [loci, setLoci] = useState<Locus[]>([]);
  const [point, setPoint] = useState<Point | null>(null);
  const [concept, setConcept] = useState("");
  const [association, setAssociation] = useState("");
  const [view, setView] = useState<"edit" | "review" | "done">("edit");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Outcome[]>([]);
  const [notice, setNotice] = useState("");

  const current = loci[index];
  const score = results.filter((result) => result === "correct").length;

  function selectPoint(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(5, Math.min(95, ((event.clientY - rect.top) / rect.height) * 100)));
    setPoint({ x, y });
    setNotice("Punto selezionato. Ora scrivi la nozione e la tua associazione.");
  }

  function addLocus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!point) { setNotice("Seleziona prima un punto sulla strada illustrata."); return; }
    if (loci.length >= MAX_LOCI) { setNotice("Questa demo può contenere al massimo cinque loci."); return; }
    if (!concept.trim() || !association.trim()) { setNotice("Compila sia la nozione sia l'associazione."); return; }
    const item: Locus = { id: loci.length + 1, ...point, concept: concept.trim(), association: association.trim() };
    setLoci((prev) => [...prev, item]);
    setPoint(null);
    setConcept("");
    setAssociation("");
    setNotice(`Locus ${item.id} aggiunto. Puoi aggiungerne un altro oppure provare il richiamo.`);
  }

  function startReview() {
    if (!loci.length) return;
    setView("review");
    setIndex(0);
    setRevealed(false);
    setResults([]);
    setNotice("");
  }

  function rate(outcome: Outcome) {
    if (!revealed || !current) return;
    const nextResults = [...results, outcome];
    setResults(nextResults);
    if (index + 1 >= loci.length) setView("done");
    else { setIndex((i) => i + 1); setRevealed(false); }
  }

  function reset() {
    setLoci([]);
    setPoint(null);
    setConcept("");
    setAssociation("");
    setIndex(0);
    setResults([]);
    setRevealed(false);
    setView("edit");
    setNotice("Demo azzerata.");
  }

  return <div className="loco-container">
    <div className="mx-auto mb-9 max-w-3xl text-center">
      <h2 className="loco-display text-[clamp(31px,4.1vw,52px)] leading-[.97]">Smetti di usare promemoria,<br />inizia da un posto.</h2>
      <p className="mt-4 text-[16px] text-black/70">Scegli un punto della scena, aggiungi un concetto e inventa un&apos;immagine mentale. Poi verifica se lo ricordi.</p>
    </div>
    <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_25px_70px_rgba(40,20,105,.10)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-loco-cream/60 px-5 py-5 sm:px-9">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-loco-purple">LOCO LAB · DEMO LOCALE</p><h3 className="loco-display mt-1 text-2xl">Il tuo percorso di prova</h3></div>
        <div className="flex items-center gap-2 rounded-full border border-loco-purple/20 bg-white px-4 py-2 text-sm font-bold text-loco-purple"><MapPin aria-hidden size={17} /> {loci.length} / {MAX_LOCI} loci</div>
      </div>

      {view === "edit" && <div className="grid lg:grid-cols-[1.1fr_.9fr]">
        <div className="border-b border-black/10 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <p className="mb-3 text-sm font-bold">1. Scegli un punto dell&apos;immagine</p>
          <div className="relative isolate overflow-hidden rounded-[23px] bg-[#ede7fc]">
            <img src="/marketing/demo-street.webp" alt="Strada urbana illustrativa con palazzi e marciapiedi: scegli il punto dove collocare una nozione" width="1421" height="924" className="block aspect-[1.65] w-full object-cover object-top" />
            <button type="button" aria-label="Seleziona un nuovo punto sulla scena" title="Tocca per selezionare un punto" onClick={selectPoint} className="absolute inset-0 z-10 h-full w-full cursor-crosshair bg-transparent" />
            {loci.map((item) => <span key={item.id} className="pointer-events-none absolute z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-loco-purple text-sm font-bold text-white shadow-lg" style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`Locus ${item.id}`}>
              {item.id}
            </span>)}
            {point && <span aria-hidden className="pointer-events-none absolute z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full border-[3px] border-white bg-loco-yellow text-loco-black shadow-lg" style={{ left: `${point.x}%`, top: `${point.y}%` }}><MapPin size={21}/></span>}
          </div>
          <button type="button" onClick={() => { setPoint({ x: 50, y: 56 }); setNotice("Punto centrale selezionato."); }} className="mt-3 text-sm font-semibold text-loco-purple underline underline-offset-4">Oppure usa il punto centrale</button>
          <p className="mt-4 text-sm leading-relaxed text-black/65">La strada è un&apos;immagine del concept: non è una sessione Google Maps o Street View, e non è una scansione 3D.</p>
        </div>
        <div className="p-5 sm:p-8">
          <form onSubmit={addLocus} className="space-y-5">
            <div><label htmlFor="loco-concept" className="mb-2 block text-sm font-bold">2. Cosa vuoi ricordare?</label><input id="loco-concept" className="loco-field" maxLength={120} placeholder="Es. Il pianeta Venere" value={concept} onChange={(event) => setConcept(event.target.value)} required /></div>
            <div><label htmlFor="loco-association" className="mb-2 block text-sm font-bold">3. Quale immagine ti viene in mente?</label><textarea id="loco-association" className="loco-field min-h-32 resize-y" maxLength={500} placeholder="Es. Una statua di Venere aspetta davanti al portone..." value={association} onChange={(event) => setAssociation(event.target.value)} required /></div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-black/60"><Sparkles className="mt-0.5 shrink-0 text-loco-purple" size={15} aria-hidden /> La generazione AI non è collegata. Qui crei tu l&apos;associazione: nessun testo viene inviato a servizi esterni.</p>
            <button type="submit" disabled={loci.length >= MAX_LOCI} className="loco-button loco-button-purple w-full disabled:cursor-not-allowed disabled:opacity-45">Aggiungi locus <ArrowRight aria-hidden size={18}/></button>
          </form>
        </div>
      </div>}

      {view === "review" && current && <div className="mx-auto max-w-[760px] px-6 py-10 text-center sm:px-12 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-loco-purple">RICHIAMO · {index + 1} DI {loci.length}</p>
        <div className="mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full bg-loco-lavender/60 text-3xl font-bold text-loco-purple">{index + 1}</div>
        <h3 className="loco-display mt-7 text-[clamp(34px,5vw,55px)] leading-tight">Che cosa hai associato al locus {index + 1}?</h3>
        <p className="mx-auto mt-4 max-w-[490px] text-black/65">Prova a ricordare senza leggere il contenuto. Quando hai formulato la risposta, apri la soluzione.</p>
        {revealed && <div className="mt-7 rounded-[20px] bg-loco-cream p-7 text-left"><p className="text-xs font-bold uppercase tracking-wider text-loco-purple">La tua nozione</p><p className="mt-1 text-xl font-bold">{current.concept}</p><p className="mt-5 text-xs font-bold uppercase tracking-wider text-loco-purple">La tua associazione</p><p className="mt-1 leading-relaxed">{current.association}</p></div>}
        {!revealed ? <button onClick={() => setRevealed(true)} type="button" className="loco-button loco-button-purple mt-9">Mostra la risposta <ArrowRight size={17} aria-hidden /></button> : <div className="mt-7"><p className="mb-4 font-bold">Come è andato il richiamo?</p><div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => rate("correct")} type="button" className="loco-button border border-emerald-600 bg-emerald-50 text-emerald-900">Ricordato</button>
          <button onClick={() => rate("help")} type="button" className="loco-button border border-amber-600 bg-amber-50 text-amber-900">Con aiuto</button>
          <button onClick={() => rate("forgot")} type="button" className="loco-button border border-red-500 bg-red-50 text-red-900">Non ricordato</button>
        </div></div>}
      </div>}

      {view === "done" && <div className="mx-auto max-w-[740px] px-6 py-14 text-center sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-loco-purple">PERCORSO COMPLETATO</p>
        <h3 className="loco-display mt-4 text-[clamp(40px,6vw,67px)] leading-[.98]">Che bel giro<br />di memoria!</h3>
        <p className="mt-6 text-xl">Hai ricordato <strong>{score} nozioni su {loci.length}</strong> senza aiuto.</p>
        <p className="mx-auto mt-3 max-w-[540px] text-sm leading-relaxed text-black/65">È soltanto un test immediato e auto-valutato: per capire cosa ricordi davvero occorrono nuove prove a distanza di tempo. Questa demo non conserva la cronologia.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3"><button onClick={startReview} className="loco-button loco-button-purple" type="button">Ripeti il richiamo <RotateCcw size={17} aria-hidden /></button><button type="button" onClick={() => setView("edit")} className="loco-button loco-button-outline">Rivedi i loci <ArrowLeft size={17} aria-hidden /></button></div>
      </div>}

      <div className="border-t border-black/10 bg-[#f8f6fd] px-5 py-5 sm:px-9">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p role="status" aria-live="polite" className="max-w-[680px] text-sm text-black/70">{notice || (view === "edit" ? "Puoi creare fino a cinque punti e poi provare a richiamarli." : "I risultati non vengono salvati su un server.")}</p>
          <div className="flex flex-wrap gap-2">
            {view === "edit" && <button type="button" disabled={!loci.length} onClick={startReview} className="loco-button loco-button-purple disabled:cursor-not-allowed disabled:opacity-40">Inizia il richiamo <ArrowRight size={17} aria-hidden /></button>}
            <button type="button" onClick={reset} className="loco-button loco-button-outline"><RotateCcw size={16} aria-hidden /> Azzera</button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
