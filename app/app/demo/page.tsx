"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SiteShell } from "@/components/marketing/site-shell";

export default function DemoPage() {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerated(true);
  };

  return (
    <SiteShell>
      {/* Hero with side lavender blobs */}
      <section className="loco-blob-left loco-blob-right relative overflow-hidden pb-12 pt-12 sm:pb-20 sm:pt-20">
        <div className="loco-container relative z-10 text-center">
          <h1 className="loco-display text-[clamp(46px,6.8vw,88px)] leading-[.96] text-black">
            Vuoi mettere la tua<br />
            <span className="font-extrabold">mente alla prova?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[660px] text-[clamp(17px,2vw,23px)] font-normal leading-snug text-black/85">
            Sperimenta l&apos;AI Generativa di LOCO, libera la<br />
            tua immaginazione e associa ciò che vuoi.
          </p>
        </div>
      </section>

      {/* Street Canvas & Prompt Input */}
      <section className="bg-white pb-20 pt-4 sm:pb-32">
        <div className="loco-container max-w-[1040px]">
          {/* Main street image canvas */}
          <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-xl shadow-black/5">
            <img
              src="/marketing/demo-street.webp"
              alt="Strada urbana tipica con edifici in mattoni e ciottoli per collocare un'immagine mentale"
              width="1421"
              height="924"
              className="h-auto w-full object-cover"
            />
            {generated && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity">
                <div className="max-w-md rounded-[28px] border-2 border-loco-purple bg-white p-7 text-center shadow-2xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-loco-lavender text-loco-purple">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="loco-display mt-4 text-2xl font-bold text-black">
                    Associazione creata!
                  </h3>
                  <p className="mt-2 text-[15px] text-black/75">
                    &ldquo;{prompt}&rdquo; è stata posizionata sulla scena. Ora immaginala lì quando ripercorri la strada!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setGenerated(false);
                      setPrompt("");
                    }}
                    className="loco-button loco-button-purple mt-5 !px-6 !py-2.5 text-sm"
                  >
                    Crea un&apos;altra
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt field matching demo.png */}
          <form onSubmit={handleGenerate} className="mt-8">
            <label
              htmlFor="loco-prompt"
              className="block text-[17px] font-bold text-black"
            >
              Scrivi l&apos;immagine che vuoi generare
            </label>
            <div className="mt-3">
              <textarea
                id="loco-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Inserisci prompt"
                className="w-full rounded-[22px] border border-black/80 bg-white p-5 text-[16px] text-black placeholder:text-black/45 focus:border-loco-purple focus:outline-none focus:ring-2 focus:ring-loco-purple/20"
              />
            </div>
            {prompt.trim() && (
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  className="loco-button loco-button-purple !px-7 !py-2.5 text-sm"
                >
                  Genera <Sparkles size={16} aria-hidden />
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Smetti di usare promemoria banner */}
      <section className="overflow-hidden bg-white pb-24 pt-4 sm:pb-36 sm:pt-8">
        <div className="loco-container max-w-[1040px] text-center">
          <div className="flex justify-center">
            <img
              src="/marketing/demo-banner.webp"
              alt="Smetti di usare promemoria, sblocca una memoria pro"
              width="2760"
              height="991"
              className="h-auto w-full max-w-[1040px] object-contain"
            />
          </div>
          <div className="mt-8">
            <Link
              href="/app"
              className="loco-button loco-button-purple !px-9 !py-3.5 text-base"
            >
              Entra in LOCO
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
