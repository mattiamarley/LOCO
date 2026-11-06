import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white pb-12 pt-14">
      <div className="loco-container">
        <h2 className="loco-display text-[clamp(34px,5.5vw,58px)] leading-none">Ci vuoi stalkerare?</h2>
        <div className="mt-8 grid gap-9 border-b border-black/10 pb-12 md:grid-cols-3 md:gap-12">
          <div>
            <p className="text-sm font-medium text-black/65">Ci trovi qui, per ora.</p>
            <Link href="/" className="text-lg font-extrabold">LOCO</Link>
            <p className="mt-3 max-w-xs text-sm text-black/50">Un progetto per dare un posto alle cose che vuoi ricordare.</p>
          </div>
          <div className="border-black/15 md:border-l md:pl-12">
            <p className="text-sm font-medium text-black/65">Esplora il progetto</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm font-bold">
              <Link href="/about" className="hover:text-loco-purple">Il metodo</Link>
              <Link href="/demo" className="hover:text-loco-purple">Prova la demo</Link>
              <Link href="/faq" className="hover:text-loco-purple">Domande frequenti</Link>
            </div>
          </div>
          <div className="border-black/15 md:border-l md:pl-12">
            <p className="text-sm font-medium text-black/65">LOCO è in sviluppo</p>
            <p className="mt-3 max-w-xs text-sm text-black/60">Non sono ancora attivi abbonamenti, scansioni 3D, generazione AI o applicazioni per dispositivi mobili.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-xs text-black/50">
          <span>© {new Date().getFullYear()} LOCO · Progetto in sviluppo</span>
          <div className="flex gap-5"><Link href="/piani" className="hover:text-black">Piani</Link><Link href="/faq" className="hover:text-black">FAQ</Link></div>
        </div>
      </div>
    </footer>
  );
}
