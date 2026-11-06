import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/marketing/site-shell";

export const metadata: Metadata = {
  title: "About | LOCO",
  description: "Non ti ricordi nemmeno il nome di tua mamma? Scopri le tecnologie e le tecniche di memoria di LOCO.",
};

const methods = [
  {
    name: "IL PALAZZO DELLA\nMEMORIA",
    img: "/marketing/method-loci.webp",
    alt: "Personaggio LOCO che esplora una città con edifici gialli",
    description: "Trasforma i luoghi che conosci in mappe mentali su cui associare le informazioni da ricordare, così ripercorrendo i percorsi evochi i concetti correlati.",
  },
  {
    name: "LINKED METHOD",
    img: "/marketing/method-link.webp",
    alt: "Illustrazione LOCO di persone e un gatto intorno a un tavolo",
    description: "Crea catene di immagini mentali collegate tra loro per ricordare sequenze complesse. Ogni immagine evoca la successiva, creando una storia indissolubile.",
  },
  {
    name: "CONVERSIONE\nFONETICA",
    img: "/marketing/method-phonetic.webp",
    alt: "Personaggio LOCO con simboli e numeri M 3",
    description: "Associa i numeri a parole, rendendo i dati più facili da richiamare, come se fosse una melodia che non riesci a toglierti dalla testa.",
  },
];

const qualities = [
  {
    icon: "/marketing/quality-memory.webp",
    title: "Quantità di informazioni\nmemorizzabili",
  },
  {
    icon: "/marketing/quality-quality.webp",
    title: "Qualità delle informazioni\nmemorizzate",
  },
  {
    icon: "/marketing/quality-dynamic.webp",
    title: "Apprendimento\npersonalizzato e dinamico",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="overflow-hidden bg-white pb-14 pt-8 sm:pb-24 sm:pt-16">
        <div className="loco-container grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="py-2">
            <h1 className="loco-display text-[clamp(46px,6.5vw,88px)] leading-[.96] text-black">
              Non ti ricordi<br />
              <span className="font-extrabold">nemmeno il nome</span><br />
              di tua <span className="font-extrabold">mamma</span>?
            </h1>
            <p className="mt-7 max-w-[480px] text-[clamp(17px,1.9vw,22px)] font-medium leading-[1.3] text-black/85">
              Si chiama Paola,<br />
              ma comunque non servono conoscenze pregresse o una memoria già allenata.
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src="/marketing/hero-about.webp"
              width="1607"
              height="1138"
              alt="Persona LOCO seduta a leggere un libro con cuffie e scarpe gialle"
              className="h-auto w-full max-w-[620px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* Tecnologia from fear */}
      <section className="bg-white py-20 sm:py-32">
        <div className="loco-container">
          <div className="text-center">
            <h2 className="loco-display text-[clamp(42px,5.8vw,72px)] text-black">
              Tecnologia from fear
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-[920px] gap-12 sm:grid-cols-2 sm:gap-20">
            {/* Google Street View */}
            <article className="text-center">
              <img
                src="/marketing/tech-street.webp"
                alt="Globo illustrato Google Street View"
                width="558"
                height="549"
                className="mx-auto mb-6 h-40 w-40 object-contain"
              />
              <h3 className="loco-display text-[clamp(28px,3.2vw,38px)] uppercase leading-tight text-black">
                GOOGLE<br />STREET VIEW
              </h3>
              <p className="mx-auto mt-4 max-w-[380px] text-[16px] font-normal leading-relaxed text-black/75">
                Loco integra il potente motore di navigazione di Google Street View per permetterti di sviluppare percorsi personalizzati e a te familiari.
              </p>
            </article>

            {/* Intelligenza Artificiale */}
            <article className="text-center">
              <img
                src="/marketing/tech-ai.webp"
                alt="Microchip illustrato intelligenza artificiale"
                width="607"
                height="553"
                className="mx-auto mb-6 h-40 w-40 object-contain"
              />
              <h3 className="loco-display text-[clamp(28px,3.2vw,38px)] uppercase leading-tight text-black">
                INTELLIGENZA<br />ARTIFICIALE
              </h3>
              <p className="mx-auto mt-4 max-w-[380px] text-[16px] font-normal leading-relaxed text-black/75">
                Interagisci con i loci che incontri attraverso il riempimento generativo: l&apos;intelligenza artificiale in grado di generare qualunque immagine.
              </p>
            </article>
          </div>

          <div className="mt-14 text-center">
            <Link href="/demo" className="loco-button loco-button-purple !px-8 !py-3 text-[15px]">
              Prova l&apos;AI generativa
            </Link>
          </div>
        </div>
      </section>

      {/* Scopri le Tecniche di memoria */}
      <section className="bg-white py-20 sm:py-32">
        <div className="loco-container">
          <div className="text-center">
            <h2 className="loco-display text-[clamp(42px,5.8vw,72px)] leading-[.96] text-black">
              Scopri le Tecniche<br />
              <span className="font-extrabold">di memoria</span>
            </h2>
          </div>

          <div className="mt-20 space-y-20 sm:space-y-32">
            {methods.map((method, index) => (
              <article
                key={method.name}
                className="grid items-center gap-8 md:grid-cols-2 md:gap-16"
              >
                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                  <img
                    src={method.img}
                    alt={method.alt}
                    width="1143"
                    height="960"
                    loading="lazy"
                    className="mx-auto h-auto w-full max-w-[500px] object-contain"
                  />
                </div>
                <div className={index % 2 === 1 ? "md:order-1" : ""}>
                  <h3 className="loco-display whitespace-pre-line text-[clamp(32px,4vw,50px)] uppercase leading-[.98] text-black">
                    {method.name}
                  </h3>
                  <p className="mt-6 max-w-[480px] text-[17px] font-normal leading-relaxed text-black/80">
                    {method.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/faq" className="loco-button loco-button-purple !px-8 !py-3 text-[15px]">
              Altre domande?
            </Link>
          </div>
        </div>
      </section>

      {/* Recappino delle nostre qualità */}
      <section className="bg-white py-20 sm:py-32">
        <div className="loco-container">
          <div className="text-center">
            <h2 className="loco-display text-[clamp(42px,5.8vw,72px)] leading-[.96] text-black">
              Recappino delle<br />
              <span className="font-extrabold">nostre qualità</span>
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-[1000px] gap-10 text-center md:grid-cols-3">
            {qualities.map((item) => (
              <div key={item.title} className="flex flex-col items-center">
                <img
                  src={item.icon}
                  alt=""
                  width="360"
                  height="360"
                  className="mx-auto h-36 w-36 object-contain"
                  loading="lazy"
                />
                <h3 className="mt-6 whitespace-pre-line text-[18px] font-bold leading-snug text-black">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/piani" className="loco-button loco-button-purple !px-8 !py-3 text-[15px]">
              Scopri gli abbonamenti
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
