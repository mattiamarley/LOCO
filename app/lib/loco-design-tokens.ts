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
  "course-1", // Corso 1 — Tecnica dei Loci (original card 1)
  "course-2", // Corso 2 — Linked Method (original card 2)
  "course-3", // Corso 3 — Conversione Fonetica (original card 3)
  "course-0", // Percorso Iniziale — Il primo ricordo (S01–S06)
  "course-4", // Corso 4 — Studiare davvero
  "course-5", // Corso 5 — LOCO nella vita reale
  "course-6", // Corso 6 — Architetto dei palazzi (POCO LOCO)
  "course-7", // Corso 7 — Maestria numerica (POCO LOCO)
  "course-8", // Corso 8 — Stratega dello studio (POCO LOCO)
  "course-9", // Corso 9 — Spazi del mondo (POCO LOCO)
  "course-10", // Corso 10 — Palestra dei campioni (POCO LOCO)
  "course-11", // Corso 11 — AI Memory Studio (PRO LOCO)
];

export const CATALOG_COURSE_PRESENTATION: Record<string, CatalogCoursePresentation> = {
  "course-1": {
    courseId: "course-1",
    catalogLabel: "Corso 1",
    shortTitle: "Tecnica dei Loci",
    cardDescription:
      "Tre lezioni fondamentali e laboratori per conoscere al meglio la Tecnica dei Loci e come utilizzarla.",
    illustration: "/assets/figma-curated/course-1-loci.webp",
  },
  "course-2": {
    courseId: "course-2",
    catalogLabel: "Corso 2",
    shortTitle: "Linked Method",
    cardDescription:
      "Impara a collegare concetti in catene di immagini mentali dinamiche che si richiamano in sequenza.",
    illustration: "/assets/figma-curated/course-2-linked.webp",
  },
  "course-3": {
    courseId: "course-3",
    catalogLabel: "Corso 3",
    shortTitle: "Conversione Fonetica",
    cardDescription:
      "Trasforma numeri, date e codici in suoni consonantici e parole vivide facili da ricordare.",
    illustration: "/assets/figma-curated/course-3-phonetic.webp",
  },
  "course-0": {
    courseId: "course-0",
    catalogLabel: "Percorso base",
    shortTitle: "Il primo ricordo in LOCO",
    cardDescription:
      "Sei passi pratici per scoprire la differenza tra rileggere e recuperare creando il tuo primo percorso.",
    illustration: "/assets/figma-curated/illustration-home-desk.svg",
  },
  "course-4": {
    courseId: "course-4",
    catalogLabel: "Corso 4",
    shortTitle: "Studiare davvero",
    cardDescription:
      "Dal testo grezzo ai concetti verificati: comprensione, richiamo attivo e ripasso distribuito.",
    illustration: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  "course-5": {
    courseId: "course-5",
    catalogLabel: "Corso 5",
    shortTitle: "LOCO nella vita reale",
    cardDescription:
      "Applica i loci a discorsi in pubblico, vocaboli stranieri, nomi, volti e procedure.",
    illustration: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  "course-6": {
    courseId: "course-6",
    catalogLabel: "Corso 6",
    shortTitle: "Architetto dei palazzi",
    cardDescription:
      "Progetta percorsi ampi, organizza stanze per materia e mantieni puliti i tuoi palazzi.",
    illustration: "/assets/figma-curated/academy-scene-zen-room.svg",
  },
  "course-7": {
    courseId: "course-7",
    catalogLabel: "Corso 7",
    shortTitle: "Maestria numerica",
    cardDescription:
      "Schedario fisso, sistema 00–99 e Persona-Azione-Oggetto (PAO) per sequenze numeriche lunghe.",
    illustration: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-8": {
    courseId: "course-8",
    catalogLabel: "Corso 8",
    shortTitle: "Stratega dello studio",
    cardDescription:
      "Prepara esami complessi combinando mappe concettuali, pratica intercalata e recupero sotto pressione.",
    illustration: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-9": {
    courseId: "course-9",
    catalogLabel: "Corso 9",
    shortTitle: "Spazi del mondo",
    cardDescription:
      "Usa tragitti urbani, fotografie personali e stanze 3D come ambienti spaziali ordinati.",
    illustration: "/assets/figma-curated/academy-mascot-photographer.svg",
  },
  "course-10": {
    courseId: "course-10",
    catalogLabel: "Corso 10",
    shortTitle: "Palestra dei campioni",
    cardDescription:
      "Allenamento su velocità controllata, mazzi di carte, resistenza mentale e analisi degli errori.",
    illustration: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-11": {
    courseId: "course-11",
    catalogLabel: "Corso 11",
    shortTitle: "AI Memory Studio",
    cardDescription:
      "Estrazione assistita dei concetti, suggerimenti mnemonici e tutoraggio senza svelare la risposta.",
    illustration: "/assets/figma-curated/illustration-plan-poco-loco.svg",
  },
};
