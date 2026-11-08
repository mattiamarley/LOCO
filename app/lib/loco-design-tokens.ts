/**
 * LOCO Brand & UX Design Tokens (`docs/BRAND-UX-GUIDELINES.md`)
 *
 * Centralizes semantic tokens and approved course illustration mappings
 * without duplicating or overriding `app/app/globals.css`.
 */

export const LOCO_BRAND_COLORS = {
  white: "#FFFFFF",
  black: "#181818",
  purple: "#613BE0",
  purpleHover: "#4B2FC4",
  lavender: "#D2C4F5",
  sidebarLavender: "#D0C4F6",
  yellow: "#FFD014",
  cream: "#FFF3E2",
} as const;

export interface CatalogCoursePresentation {
  courseId: string;
  catalogLabel: string;
  shortTitle: string;
  cardDescription: string;
  illustration: string;
}

/**
 * Maps the 12 Academy courses so that the original 3 flagship courses
 * (`Corso 1: Tecnica dei Loci`, `Corso 2: Linked Method`, `Corso 3: Conversione Fonetica`)
 * appear first in the "I nostri corsi" horizontal carousel with their exact original
 * approved artwork, followed by the onboarding lab (`Corso 0`) and the remaining
 * foundational & advanced courses (`Corso 4`..`Corso 11`).
 */
export const CATALOG_COURSE_ORDER: string[] = [
  "course-fondamenta", // Unità 1 — Fondamenta della memoria (F01–F05)
  "course-associazioni", // Unità 2 — L'arte dell'associazione (A01–A06)
  "course-palazzi", // Unità 3 — Palazzi della memoria (P01–P07)
  "course-numeri", // Unità 4 — Conversione fonetica e cifre (N01–N07)
  "course-vita-reale", // Unità 5 — LOCO nella vita reale (E01–E06)
  "course-studio", // Unità 6 — Dalla memoria alla comprensione (S01–S06)
  "course-carte", // Unità 7 — La lingua delle carte (C01–C05)
  "course-specializzazioni", // Unità 8 — Specializzazioni e protocolli (X01–X06)
];

export const CATALOG_COURSE_PRESENTATION: Record<string, CatalogCoursePresentation> = {
  "course-fondamenta": {
    courseId: "course-fondamenta",
    catalogLabel: "Unità 1",
    shortTitle: "Fondamenta della memoria",
    cardDescription:
      "Cinque lezioni per imparare a guardare, costruire indizi efficaci e riconoscere il recupero autentico.",
    illustration: "/assets/figma-curated/illustration-home-desk.svg",
  },
  "course-associazioni": {
    courseId: "course-associazioni",
    catalogLabel: "Unità 2",
    shortTitle: "L'arte dell'associazione",
    cardDescription:
      "Sei lezioni su azioni visive dinamiche, catene Linked che si raccontano da sole e riparazione di anelli deboli.",
    illustration: "/assets/figma-curated/course-2-linked.webp",
  },
  "course-palazzi": {
    courseId: "course-palazzi",
    catalogLabel: "Unità 3",
    shortTitle: "Palazzi della memoria",
    cardDescription:
      "Sette lezioni per progettare luoghi familiari, rotte coerenti dalla porta e recupero senza mappa.",
    illustration: "/assets/figma-curated/course-1-loci.webp",
  },
  "course-numeri": {
    courseId: "course-numeri",
    catalogLabel: "Unità 4",
    shortTitle: "Conversione fonetica e cifre",
    cardDescription:
      "Sette lezioni dal codice major-it-v1 al lessico 00–99 e memorizzazione di date storiche verificabili.",
    illustration: "/assets/figma-curated/course-3-phonetic.webp",
  },
  "course-vita-reale": {
    courseId: "course-vita-reale",
    catalogLabel: "Unità 5",
    shortTitle: "LOCO nella vita reale",
    cardDescription:
      "Sei lezioni pratiche su nomi e volti, percorsi stradali, intenzioni future, vocaboli e discorsi.",
    illustration: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-studio": {
    courseId: "course-studio",
    catalogLabel: "Unità 6",
    shortTitle: "Dalla memoria allo studio",
    cardDescription:
      "Sei lezioni su estrazione di domande dal testo, budget delle immagini, mappe strutturate e ripasso diagnostico.",
    illustration: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-carte": {
    courseId: "course-carte",
    catalogLabel: "Unità 7",
    shortTitle: "La lingua delle carte",
    cardDescription:
      "Cinque lezioni per codificare semi e figure, associare carte a eventi e memorizzare sequenze ordinate.",
    illustration: "/assets/figma-curated/academy-mascot-lion.svg",
  },
  "course-specializzazioni": {
    courseId: "course-specializzazioni",
    catalogLabel: "Unità 8",
    shortTitle: "Specializzazioni e protocolli",
    cardDescription:
      "Sei lezioni avanzate su PAO, numeri binari, citazioni letterali, ortografia e protocolli di gara.",
    illustration: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  // Legacy aliases
  "course-0": {
    courseId: "course-0",
    catalogLabel: "Unità 1",
    shortTitle: "Fondamenta della memoria",
    cardDescription:
      "Cinque lezioni per imparare a guardare, costruire indizi efficaci e riconoscere il recupero autentico.",
    illustration: "/assets/figma-curated/illustration-home-desk.svg",
  },
  "course-1": {
    courseId: "course-1",
    catalogLabel: "Unità 3",
    shortTitle: "Palazzi della memoria",
    cardDescription:
      "Sette lezioni per progettare luoghi familiari, rotte coerenti dalla porta e recupero senza mappa.",
    illustration: "/assets/figma-curated/course-1-loci.webp",
  },
  "course-2": {
    courseId: "course-2",
    catalogLabel: "Unità 2",
    shortTitle: "L'arte dell'associazione",
    cardDescription:
      "Sei lezioni su azioni visive dinamiche, catene Linked che si raccontano da sole e riparazione di anelli deboli.",
    illustration: "/assets/figma-curated/course-2-linked.webp",
  },
  "course-3": {
    courseId: "course-3",
    catalogLabel: "Unità 4",
    shortTitle: "Conversione fonetica e cifre",
    cardDescription:
      "Sette lezioni dal codice major-it-v1 al lessico 00–99 e memorizzazione di date storiche verificabili.",
    illustration: "/assets/figma-curated/course-3-phonetic.webp",
  },
  "course-4": {
    courseId: "course-4",
    catalogLabel: "Unità 6",
    shortTitle: "Dalla memoria allo studio",
    cardDescription:
      "Sei lezioni su estrazione di domande dal testo, budget delle immagini, mappe strutturate e ripasso diagnostico.",
    illustration: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-5": {
    courseId: "course-5",
    catalogLabel: "Unità 5",
    shortTitle: "LOCO nella vita reale",
    cardDescription:
      "Sei lezioni pratiche su nomi e volti, percorsi stradali, intenzioni future, vocaboli e discorsi.",
    illustration: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-6": {
    courseId: "course-6",
    catalogLabel: "Unità 8",
    shortTitle: "Specializzazioni e protocolli",
    cardDescription:
      "Sei lezioni avanzate su PAO, numeri binari, citazioni letterali, ortografia e protocolli di gara.",
    illustration: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  "course-7": {
    courseId: "course-7",
    catalogLabel: "Unità 8",
    shortTitle: "Specializzazioni e protocolli",
    cardDescription:
      "Sei lezioni avanzate su PAO, numeri binari, citazioni letterali, ortografia e protocolli di gara.",
    illustration: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-8": {
    courseId: "course-8",
    catalogLabel: "Unità 6",
    shortTitle: "Dalla memoria allo studio",
    cardDescription:
      "Sei lezioni su estrazione di domande dal testo, budget delle immagini, mappe strutturate e ripasso diagnostico.",
    illustration: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-9": {
    courseId: "course-9",
    catalogLabel: "Unità 3",
    shortTitle: "Palazzi della memoria",
    cardDescription:
      "Sette lezioni per progettare luoghi familiari, rotte coerenti dalla porta e recupero senza mappa.",
    illustration: "/assets/figma-curated/academy-mascot-photographer.svg",
  },
  "course-10": {
    courseId: "course-10",
    catalogLabel: "Unità 7",
    shortTitle: "La lingua delle carte",
    cardDescription:
      "Cinque lezioni per codificare semi e figure, associare carte a eventi e memorizzare sequenze ordinate.",
    illustration: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-11": {
    courseId: "course-11",
    catalogLabel: "Unità 8",
    shortTitle: "Specializzazioni e protocolli",
    cardDescription:
      "Sei lezioni avanzate su PAO, numeri binari, citazioni letterali, ortografia e protocolli di gara.",
    illustration: "/assets/figma-curated/illustration-plan-poco-loco.svg",
  },
};
