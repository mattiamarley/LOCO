export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white pb-16 pt-16 sm:pb-24 sm:pt-20">
      <div className="loco-container">
        <h2 className="loco-display text-[clamp(42px,5.8vw,68px)] leading-none text-black">
          Ci vuoi stalkerare?
        </h2>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0">
          {/* Column 1: Social */}
          <div className="md:pr-10">
            <p className="text-[15px] font-normal leading-snug text-black">
              Ci trovi sui social come
            </p>
            <p className="mt-1 text-[17px] font-bold text-black">
              @oco.loco
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              {/* TikTok */}
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52v-3.46a4.85 4.85 0 0 1-1-.12z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              {/* Twitter / X */}
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white transition-transform hover:scale-110">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.48l5.75 3.27z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: App Download */}
          <div className="border-black/15 md:border-l md:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-normal leading-tight text-black">
                  Scarica <strong className="font-extrabold">LOCO</strong>,
                </p>
                <p className="mt-1 text-[15px] font-normal leading-tight text-black">
                  disponibile per<br />tablet e smartphone
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {/* Apple store */}
                <span title="App Store" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.65-.8 1.09-1.92.97-3.04-.96.04-2.13.64-2.8 1.42-.59.68-1.11 1.78-.97 2.87 1.08.08 2.16-.48 2.8-1.25z"/></svg>
                </span>
                {/* Google play */}
                <span title="Google Play" className="flex h-9 w-9 items-center justify-center rounded-full bg-loco-purple text-white shadow-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a2.03 2.03 0 0 1-.61-.919V2.733c.125-.373.342-.693.609-.919zm11.233 11.233l2.25 2.25-11.758 6.78 9.508-9.03zm0-2.094L5.334 1.923l11.758 6.78-2.25 2.247zm1.479 1.047l3.774 2.177c.805.465.805 1.22 0 1.684l-3.774 2.177-2.13-2.13 2.13-2.092z"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Address */}
          <div className="border-black/15 md:border-l md:pl-10">
            <p className="text-[15px] font-normal leading-snug text-black">
              Se vuoi inviarci un regalo o<br />
              farci visita ci trovi alla
            </p>
            <p className="mt-1 text-[16px] font-bold text-black">
              Cittadella Politecnica
            </p>
            <p className="mt-0.5 text-[14px] text-black/75">
              C.so Settembrini 179, Torino (TO)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
