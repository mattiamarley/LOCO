import type { Metadata } from "next";
import { LocoWebApp } from "@/components/webapp/loco-webapp";

export const metadata: Metadata = {
  title: "LOCO WebApp — Spazio Personale, Recappete, Mappete e Corsi",
  description:
    "WebApp interattiva LOCO: esplora ambienti 3D e Street View, fissa i Loci in scena, svolgi il Blind Recall FSRS-7 e monitora le 18 metriche della memoria.",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <LocoWebApp />;
}
