import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LOCO | Un posto per ogni idea", template: "%s | LOCO" },
  description: "LOCO aiuta a costruire percorsi di memoria e associazioni personali per studiare, richiamare e ripassare. Scopri il metodo dei loci e prova una demo interattiva.",
  applicationName: "LOCO",
  openGraph: {
    title: "LOCO — Un posto per ogni idea",
    description: "Luoghi, associazioni e richiamo attivo: scopri LOCO, un progetto per imparare a ricordare.",
    locale: "it_IT",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/marketing/favicon.png", apple: "/marketing/favicon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body className="min-h-screen bg-white text-loco-black antialiased">{children}</body></html>;
}
