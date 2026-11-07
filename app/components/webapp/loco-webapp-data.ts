import {
  computeAllMemoryMetrics,
  METRIC_DEFINITIONS,
  ALL_MEMORY_METRIC_KEYS,
} from "../../server/src/memoryMetrics.ts";
import { generateAdaptiveInterventions } from "../../server/src/adaptiveRecommendations.ts";
import { computeNextSchedule } from "../../server/src/srs.ts";
import type { SchedulerGrade, SkillKind } from "../../server/src/models.ts";
import type {
  LearningIntervention,
  MemoryMetricKey,
  MetricValueSnapshot,
  TrialDiagnosticRecord,
} from "../../server/src/models.v2.ts";

export { METRIC_DEFINITIONS, ALL_MEMORY_METRIC_KEYS };
export type { LearningIntervention, MemoryMetricKey, MetricValueSnapshot };

export interface WebAppLocus {
  id: string;
  position: number;
  label: string;
  surface: string;
  question: string;
  answer: string;
  association: string;
  confirmationState: "proposed" | "confirmed";
  x: number;
  y: number;
  point3d?: { x: number; y: number; z: number };
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  stability: number;
  difficulty: number;
  streak: number;
  lapsesCount: number;
  dueAt: string;
  lastReviewedAt?: string;
}

export interface WebAppRoute {
  id: string;
  title: string;
  description: string;
  topic: string;
  environment: "3D SCAN" | "STREET VIEW";
  status: "ready" | "draft";
  progress: number;
  thumbnail: string;
  locationLabel: string;
  sceneVersion: number;
  loci: WebAppLocus[];
}

export interface WebAppCourse {
  id: number;
  numberLabel: string;
  title: string;
  description: string;
  illustration: string;
  lessons: {
    id: string;
    numberLabel: string;
    title: string;
    illustration: string;
    summary: string;
    exercise: string;
    completed: boolean;
    primaryAcademyLessonId?: string;
    mappedAcademyLessonIds?: string[];
  }[];
}

export interface WebAppChallenge {
  id: string;
  versionId: string;
  title: string;
  subtitle: string;
  skillType: SkillKind;
  targetItems: number;
  timeCapMs: number;
  prompts: { prompt: string; expected: string; hint: string }[];
  leaderboard: {
    userId: string;
    handle: string;
    displayName: string;
    isFriend: boolean;
    accuracy: number;
    durationMs: number;
    score: number;
    submittedAt: string;
  }[];
}

export const INITIAL_ROUTES: WebAppRoute[] = [
  {
    id: "route-tesi",
    title: "Discussione tesi",
    description: "Struttura dell'esposizione orale, argomentazioni chiave e conclusioni della tesi",
    topic: "DISCORSO",
    environment: "3D SCAN",
    status: "ready",
    progress: 25,
    thumbnail: "/assets/figma-curated/route-thumb-scan.webp",
    locationLabel: "Stanza Studio 3D",
    sceneVersion: 1,
    loci: [
      {
        id: "loc-tesi-1",
        position: 1,
        label: "Porta d'ingresso",
        surface: "Porta",
        question: "Qual è l'apertura del discorso di tesi (primi 90 secondi)?",
        answer: "Problema reale della memoria digitale passiva e domanda di ricerca su LOCO.",
        association:
          "Un lucchetto gigante giallo sulla maniglia della porta che si apre pronunciando la domanda di ricerca.",
        confirmationState: "confirmed",
        x: 50,
        y: 82,
        point3d: { x: 0, y: 1.15, z: 4.8 },
        repetitionCount: 2,
        intervalDays: 3,
        easeFactor: 2.5,
        stability: 3.2,
        difficulty: 4.5,
        streak: 2,
        lapsesCount: 0,
        dueAt: new Date(Date.now() - 3600_000).toISOString(),
      },
      {
        id: "loc-tesi-2",
        position: 2,
        label: "Scrivania gialla",
        surface: "Scrivania",
        question: "Quali sono i 3 pilastri metodologici citati nel Capitolo 2?",
        answer:
          "Metodo dei Loci (ancoraggio spaziale), Linked Method (catena narrativa) e Conversione Fonetica (Major System).",
        association:
          "Tre statue parlanti sedute sulla scrivania insieme al gatto nero che palleggia con una sveglia gialla.",
        confirmationState: "confirmed",
        x: 24,
        y: 38,
        point3d: { x: -2.7, y: 1.0, z: -2.5 },
        repetitionCount: 1,
        intervalDays: 1,
        easeFactor: 2.3,
        stability: 1.4,
        difficulty: 5.2,
        streak: 1,
        lapsesCount: 1,
        dueAt: new Date(Date.now() - 1800_000).toISOString(),
      },
      {
        id: "loc-tesi-3",
        position: 3,
        label: "Libreria in fondo",
        surface: "Libreria",
        question: "Perché il Blind Recall è obbligatorio prima di mostrare la risposta?",
        answer:
          "Evita l'illusione di competenza (fluency illusion) e attiva il recupero attivo (testing effect).",
        association:
          "I libri della libreria indossano una benda sugli occhi e si illuminano solo dopo che hai parlato.",
        confirmationState: "confirmed",
        x: 78,
        y: 22,
        point3d: { x: 2.6, y: 1.5, z: -4.1 },
        repetitionCount: 3,
        intervalDays: 6,
        easeFactor: 2.6,
        stability: 6.1,
        difficulty: 4.1,
        streak: 3,
        lapsesCount: 0,
        dueAt: new Date(Date.now() + 86400_000 * 2).toISOString(),
      },
      {
        id: "loc-tesi-4",
        position: 4,
        label: "Letto viola",
        surface: "Letto",
        question: "Quale metrica misura la dipendenza dagli indizi durante il ripasso?",
        answer:
          "Hint Dependency (HD), calcolata dal rapporto tra tentativi assistiti da indizi e prove complessive.",
        association:
          "Sul cuscino del letto c'è una bussola d'oro che gira all'impazzata ogni volta che chiedi un suggerimento.",
        confirmationState: "proposed",
        x: 76,
        y: 55,
        point3d: { x: 2.6, y: 0.9, z: 0.2 },
        repetitionCount: 0,
        intervalDays: 0,
        easeFactor: 2.5,
        stability: 0.5,
        difficulty: 5.0,
        streak: 0,
        lapsesCount: 0,
        dueAt: new Date(Date.now() - 600_000).toISOString(),
      },
    ],
  },
  {
    id: "route-chimica",
    title: "Tavola periodica",
    description:
      "Nomi e numeri atomici degli elementi del Gruppo 1 (Metalli alcalini) lungo il Politecnico",
    topic: "CHIMICA",
    environment: "STREET VIEW",
    status: "ready",
    progress: 40,
    thumbnail: "/assets/figma-curated/route-thumb-streetview.webp",
    locationLabel: "Politecnico di Torino",
    sceneVersion: 1,
    loci: [
      {
        id: "loc-chim-1",
        position: 1,
        label: "Ingresso Corso Duca degli Abruzzi",
        surface: "Ingresso Politecnico",
        question: "Primo elemento del Gruppo 1 (Z = 1) e sua eccezione chimica?",
        answer: "Idrogeno (H, Z = 1): non metallo, gas biatomico leggero.",
        association:
          "Un dirigibile gigante pieno d'idrogeno solleva le porte a vetri dell'ingresso del Politecnico.",
        confirmationState: "confirmed",
        x: 36,
        y: 35,
        repetitionCount: 3,
        intervalDays: 5,
        easeFactor: 2.55,
        stability: 5.2,
        difficulty: 3.9,
        streak: 3,
        lapsesCount: 0,
        dueAt: new Date(Date.now() - 900_000).toISOString(),
      },
      {
        id: "loc-chim-2",
        position: 2,
        label: "Cortile Aula Magna Agnelli",
        surface: "Aula Magna",
        question: "Secondo e terzo elemento del Gruppo 1 (Z = 3, Z = 11)?",
        answer: "Litio (Li, Z = 3) e Sodio (Na, Z = 11).",
        association:
          "Una batteria al Litio gigante salta dentro una saliera di Sodio che esplode in scintille gialle nel cortile.",
        confirmationState: "confirmed",
        x: 61,
        y: 51,
        repetitionCount: 2,
        intervalDays: 3,
        easeFactor: 2.4,
        stability: 3.0,
        difficulty: 4.8,
        streak: 2,
        lapsesCount: 0,
        dueAt: new Date(Date.now() + 86400_000).toISOString(),
      },
      {
        id: "loc-chim-3",
        position: 3,
        label: "Incrocio Corso Castelfidardo",
        surface: "Corso Castelfidardo",
        question: "Quarto, quinto e sesto metallo alcalino (Z = 19, 37, 55)?",
        answer: "Potassio (K, 19), Rubidio (Rb, 37) e Cesio (Cs, 55).",
        association:
          "Una banana gigante (Potassio) indossa un rubino rosso (Rubidio) e controlla un orologio atomico al Cesio.",
        confirmationState: "confirmed",
        x: 42,
        y: 68,
        repetitionCount: 1,
        intervalDays: 1,
        easeFactor: 2.3,
        stability: 1.5,
        difficulty: 5.4,
        streak: 1,
        lapsesCount: 0,
        dueAt: new Date(Date.now() - 1200_000).toISOString(),
      },
    ],
  },
  {
    id: "route-nonna",
    title: "Casa de nonna",
    description: "Ricetta tradizionale e ingredienti ordinati nella cucina di nonna",
    topic: "LISTA SPESA",
    environment: "3D SCAN",
    status: "ready",
    progress: 75,
    thumbnail: "/assets/figma-curated/route-thumb-nonna.webp",
    locationLabel: "Cucina di Nonna",
    sceneVersion: 1,
    loci: [
      {
        id: "loc-nonna-1",
        position: 1,
        label: "Credenza in legno",
        surface: "Libreria",
        question: "Proporzione farina e uova per la pasta fresca?",
        answer: "100g di farina 00 ogni uovo intero + un pizzico di sale.",
        association:
          "Dalla credenza volano 4 uova con il paracadute sopra una montagna bianca di farina.",
        confirmationState: "confirmed",
        x: 28,
        y: 44,
        point3d: { x: -3.5, y: 1.4, z: -0.5 },
        repetitionCount: 4,
        intervalDays: 10,
        easeFactor: 2.7,
        stability: 10.4,
        difficulty: 3.2,
        streak: 4,
        lapsesCount: 0,
        dueAt: new Date(Date.now() + 86400_000 * 5).toISOString(),
      },
      {
        id: "loc-nonna-2",
        position: 2,
        label: "Tavolo centrale",
        surface: "Scrivania",
        question: "Tempo di riposo dell'impasto e temperatura?",
        answer: "Almeno 30 minuti avvolto nella pellicola a temperatura ambiente.",
        association:
          "L'impasto dorme sotto una coperta gialla sul tavolo con una sveglia puntata su 30 minuti.",
        confirmationState: "confirmed",
        x: 56,
        y: 62,
        point3d: { x: 0, y: 0.9, z: 0 },
        repetitionCount: 3,
        intervalDays: 7,
        easeFactor: 2.6,
        stability: 7.0,
        difficulty: 3.6,
        streak: 3,
        lapsesCount: 0,
        dueAt: new Date(Date.now() + 86400_000 * 3).toISOString(),
      },
    ],
  },
  {
    id: "route-stanza-to",
    title: "Stanza TO",
    description: "Date storiche fondamentali del Risorgimento italiano nella stanza di Torino",
    topic: "STORIA",
    environment: "3D SCAN",
    status: "ready",
    progress: 100,
    thumbnail: "/assets/figma-curated/route-thumb-scan.webp",
    locationLabel: "Camera Torino",
    sceneVersion: 1,
    loci: [
      {
        id: "loc-to-1",
        position: 1,
        label: "Finestra su Torino",
        surface: "Finestra",
        question: "Anno dello Statuto Albertino e Prima Guerra d'Indipendenza?",
        answer: "1848 (4 marzo 1848 promulgazione dello Statuto Albertino).",
        association:
          "Alla finestra sventola una pergamena luminosa con il numero 48 inciso nel vetro.",
        confirmationState: "confirmed",
        x: 18,
        y: 50,
        point3d: { x: -3.7, y: 1.6, z: 0.2 },
        repetitionCount: 5,
        intervalDays: 14,
        easeFactor: 2.8,
        stability: 14.5,
        difficulty: 2.9,
        streak: 5,
        lapsesCount: 0,
        dueAt: new Date(Date.now() + 86400_000 * 7).toISOString(),
      },
    ],
  },
  {
    id: "route-bozza-1",
    title: "Capitali Europee Nord",
    description: "Percorso in bozza per associare capitali scandinave e baltiche",
    topic: "CAPITALI",
    environment: "STREET VIEW",
    status: "draft",
    progress: 10,
    thumbnail: "/assets/figma-curated/route-thumb-streetview.webp",
    locationLabel: "Parco del Valentino",
    sceneVersion: 1,
    loci: [],
  },
];

export const INITIAL_COURSES: WebAppCourse[] = [
  {
    id: 1,
    numberLabel: "Corso 1",
    title: "Tecnica dei Loci",
    description:
      "Tre lezioni per conoscere al meglio la Tecnica dei Loci e come utilizzarla.",
    illustration: "/assets/figma-curated/course-1-loci.webp",
    lessons: [
      {
        id: "c1-l1",
        numberLabel: "Lezione 1",
        title: "Approccio alle tecniche mnemoniche",
        illustration: "/assets/figma-curated/lesson-1-approccio.webp",
        summary:
          "Riconoscere una pagina rileggendola non equivale a saperla recuperare senza guardare. La tecnica dei loci usa punti spaziali stabili come ancore per il richiamo attivo, affiancando comprensione e ripasso distribuito.",
        exercise:
          "Esercizio pratico: Osserva 5 parole per 15 secondi (limone, violino, ponte, bussola, moneta), nascondi la lista e prova a scriverle senza aiuti (Lezioni Academy S01 + L01).",
        completed: true,
        primaryAcademyLessonId: "S01",
        mappedAcademyLessonIds: ["S01", "L01"],
      },
      {
        id: "c1-l2",
        numberLabel: "Lezione 2",
        title: "Introduzione alla tecnica dei Loci",
        illustration: "/assets/figma-curated/lesson-2-introduzione.webp",
        summary:
          "Ogni locus deve essere distinto, ordinato in una sequenza non ambigua e ben riconoscibile. Evita di scegliere cinque angoli quasi indistinguibili o sovrapporre due concetti diversi sullo stesso punto.",
        exercise:
          "Esercizio pratico: Apri la Stanza 3D di LOCO, seleziona 5 punti non ambigui e verifica di saperli nominare in ordine a etichette chiuse (Lezioni Academy S03 + L02).",
        completed: true,
        primaryAcademyLessonId: "S03",
        mappedAcademyLessonIds: ["S03", "L02"],
      },
      {
        id: "c1-l3",
        numberLabel: "Lezione 3",
        title: "Come utilizzare la tecnica dei Loci",
        illustration: "/assets/figma-curated/lesson-3-utilizzo.webp",
        summary:
          "Per fissare un bersaglio nel locus crea un'azione chiara e personale che colleghi la risposta al punto scelto (l'euristica creativa PAV può aiutare, ma conta soprattutto che l'indizio riporti alla risposta esatta).",
        exercise:
          "Esercizio pratico: Colloca 5 elementi nei tuoi loci con una frase d'azione e svolgi un Blind Recall senza scoprire la soluzione prima del tentativo (Lezioni Academy S04 + L04 + L06).",
        completed: true,
        primaryAcademyLessonId: "S04",
        mappedAcademyLessonIds: ["S04", "L04", "L06"],
      },
    ],
  },
  {
    id: 2,
    numberLabel: "Corso 2",
    title: "Linked method",
    description:
      "Tre lezioni per conoscere al meglio il Linked method e come utilizzarlo.",
    illustration: "/assets/figma-curated/course-2-linked.webp",
    lessons: [
      {
        id: "c2-l1",
        numberLabel: "Lezione 1",
        title: "Introduzione al Linked method",
        illustration: "/assets/figma-curated/lesson-1-approccio.webp",
        summary:
          "Il Linked Method concatena più elementi in una sequenza breve: la prima immagine compie un'azione fisica sulla seconda, e la seconda agisce sulla terza.",
        exercise:
          "Esercizio pratico: Collega in catena 6 parole verificando ogni singolo ponte binario A→B e B→C (Lezione Academy K01).",
        completed: true,
        primaryAcademyLessonId: "K01",
        mappedAcademyLessonIds: ["K01"],
      },
      {
        id: "c2-l2",
        numberLabel: "Lezione 2",
        title: "Come creare storie per il Linked method",
        illustration: "/assets/figma-curated/lesson-2-introduzione.webp",
        summary:
          "Una buona catena non è un romanzo: il segreto per non spezzarla è mantenere legami brevi e causali tra due elementi consecutivi, evitando dettagli superflui che distraggono.",
        exercise:
          "Esercizio pratico: Semplifica una storia prolissa in soli contatti diretti tra coppie consecutive e ripeti la sequenza (Lezione Academy K02).",
        completed: true,
        primaryAcademyLessonId: "K02",
        mappedAcademyLessonIds: ["K02"],
      },
      {
        id: "c2-l3",
        numberLabel: "Lezione 3",
        title: "Come utilizzare il Linked method",
        illustration: "/assets/figma-curated/lesson-3-utilizzo.webp",
        summary:
          "Scegli con criterio tra Loci e storie: usa i loci come 'capitoli' stabili quando la lista supera 8–10 voci e il Linked Method per legare 2–3 concetti chiave dentro un singolo locus.",
        exercise:
          "Esercizio pratico: Confronta quando usare una catena libera e quando ancorarla ai loci, poi ripara un anello mancante (Lezioni Academy K03 + K04).",
        completed: false,
        primaryAcademyLessonId: "K03",
        mappedAcademyLessonIds: ["K03"],
      },
    ],
  },
  {
    id: 3,
    numberLabel: "Corso 3",
    title: "Conversione fonetica",
    description:
      "Tre lezioni per conoscere la conversione fonetica e come utilizzarlo.",
    illustration: "/assets/figma-curated/course-3-phonetic.webp",
    lessons: [
      {
        id: "c3-l1",
        numberLabel: "Lezione 1",
        title: "Introduzione alla Conversione fonetica",
        illustration: "/assets/figma-curated/lesson-1-approccio.webp",
        summary:
          "Le cifre sono astratte: la conversione fonetica (Major System italiano `major-it-v1`) attribuisce a ciascuna cifra 0–9 una famiglia di suoni consonantici, mentre le vocali non aggiungono cifre.",
        exercise:
          "Esercizio pratico: Collega 1 a T/D e 4 a R per ottenere «toro» (14) e colloca l'immagine in un locus (Lezione Academy N01).",
        completed: false,
        primaryAcademyLessonId: "N01",
        mappedAcademyLessonIds: ["N01"],
      },
      {
        id: "c3-l2",
        numberLabel: "Lezione 2",
        title: "Come imparare l'alfabeto numerico",
        illustration: "/assets/figma-curated/lesson-2-introduzione.webp",
        summary:
          "Convenzione fonetica `major-it-v1`: 0=S/Z/SC dolce (scena), 1=T/D, 2=N/GN, 3=M, 4=R, 5=L/GL palatale, 6=C/G dolce (ciao, gelato), 7=C/G dura (casa, mago), 8=F/V, 9=P/B. Conta il suono pronunciato, non la semplice lettera.",
        exercise:
          "Esercizio pratico: Risolvi 10 associazioni suono↔cifra distinguendo C/G dolce (6: micio=36) e C/G dura (7: mago=37) (Lezione Academy N02).",
        completed: false,
        primaryAcademyLessonId: "N02",
        mappedAcademyLessonIds: ["N02"],
      },
      {
        id: "c3-l3",
        numberLabel: "Lezione 3",
        title: "Come utilizzare la Conversione fonetica",
        illustration: "/assets/figma-curated/lesson-3-utilizzo.webp",
        summary:
          "L'allenamento bidirezionale è essenziale: codifica Numero → Parola (32→mano, 52→luna, 92→pane) e decodifica Parola → Numero (mago→37, scena→02) per poi fissare date storiche verificabili.",
        exercise:
          "Esercizio pratico: Svolgi le prove Forward (N03) e Reverse (N04) nella Palestra Conversione Fonetica.",
        completed: false,
        primaryAcademyLessonId: "N03",
        mappedAcademyLessonIds: ["N03", "N04"],
      },
    ],
  },
];

export const MAJOR_SYSTEM_TABLE = [
  { digit: "0", sounds: "S, Z, SC dolce (scena)", mnemonic: "Zero / Sibilo o fruscio (/s/, /z/, /ʃ/)", exampleWord: "Scena (02) · Sole (05)" },
  { digit: "1", sounds: "T, D", mnemonic: "1 asta verticale (/t/, /d/)", exampleWord: "Toro (14) · Dado (11)" },
  { digit: "2", sounds: "N, GN (gnomo)", mnemonic: "2 gambe della n (/n/, /ɲ/)", exampleWord: "Nave (28) · Gnomo (23)" },
  { digit: "3", sounds: "M", mnemonic: "3 gambe della m (/m/)", exampleWord: "Mano (32) · Mela (35)" },
  { digit: "4", sounds: "R", mnemonic: "quattRo (/r/)", exampleWord: "Riva (48) · Rana (42)" },
  { digit: "5", sounds: "L, GL palatale (foglia)", mnemonic: "L = 50 romano (/l/, /ʎ/)", exampleWord: "Luna (52) · Foglia (85)" },
  { digit: "6", sounds: "C/G dolce (ciao, gelato)", mnemonic: "Ciliegia / suono palatale (/tʃ/, /dʒ/)", exampleWord: "Micio (36) · Ciao (6)" },
  { digit: "7", sounds: "C/G dura (casa, mago), K, Q", mnemonic: "7 spigoloso / suono gutturale (/k/, /g/)", exampleWord: "Mago (37) · Casa (70)" },
  { digit: "8", sounds: "F, V", mnemonic: "f corsiva a doppia asola (/f/, /v/)", exampleWord: "Tuffo (18) · Faro (84)" },
  { digit: "9", sounds: "P, B", mnemonic: "9 specchiato = P/b (/p/, /b/)", exampleWord: "Pane (92) · Ponte (921)" },
];

export const INITIAL_CHALLENGES: WebAppChallenge[] = [
  {
    id: "chal-loci-sprint",
    versionId: "ver-loci-sprint-v1",
    title: "Sprint Palazzo dei Loci (5 Loci)",
    subtitle: "Richiamo ordinato rapido senza indizi • Versione immutabile v1",
    skillType: "loci",
    targetItems: 5,
    timeCapMs: 90_000,
    prompts: [
      {
        prompt: "Locus 1 (Porta): Apertura dei primi 90 secondi della tesi?",
        expected: "Domanda di ricerca",
        hint: "Inizia con 'Domanda di...'",
      },
      {
        prompt: "Locus 2 (Scrivania): Quale metodo usa l'ancoraggio spaziale?",
        expected: "Loci",
        hint: "Tecnica dei ...",
      },
      {
        prompt: "Locus 3 (Libreria): Quale effetto cognitivo attiva il Blind Recall?",
        expected: "Testing effect",
        hint: "Testing ...",
      },
      {
        prompt: "Locus 4 (Ingresso Poli): Primo elemento del Gruppo 1 (Z=1)?",
        expected: "Idrogeno",
        hint: "Simbolo H",
      },
      {
        prompt: "Locus 5 (Finestra TO): Anno dello Statuto Albertino?",
        expected: "1848",
        hint: "Primavera dei popoli (18..)",
      },
    ],
    leaderboard: [
      {
        userId: "u-marco",
        handle: "marco_loci",
        displayName: "Marco R.",
        isFriend: true,
        accuracy: 1.0,
        durationMs: 24_800,
        score: 985,
        submittedAt: "2026-11-06T18:10:00Z",
      },
      {
        userId: "u-elena",
        handle: "elena_mnemo",
        displayName: "Elena V.",
        isFriend: true,
        accuracy: 1.0,
        durationMs: 31_200,
        score: 962,
        submittedAt: "2026-11-06T19:05:00Z",
      },
      {
        userId: "u-luca",
        handle: "luca_polito",
        displayName: "Luca T.",
        isFriend: false,
        accuracy: 0.8,
        durationMs: 28_400,
        score: 790,
        submittedAt: "2026-11-06T20:15:00Z",
      },
    ],
  },
  {
    id: "chal-major-bidir",
    versionId: "ver-major-bidir-v1",
    title: "Arena Major Bidirezionale (Numero ⇄ Parola)",
    subtitle: "Codifica Forward e Decodifica Reverse • Regola server deterministica",
    skillType: "major",
    targetItems: 4,
    timeCapMs: 60_000,
    prompts: [
      { prompt: "[FORWARD] Quale parola codifica il numero 32 (M-N)?", expected: "Mano", hint: "3=M, 2=N" },
      { prompt: "[REVERSE] Quale numero è codificato dalla parola TORO (T-R)?", expected: "14", hint: "T=1, R=4" },
      { prompt: "[FORWARD] Quale parola codifica il numero 52 (L-N)?", expected: "Luna", hint: "5=L, 2=N" },
      { prompt: "[REVERSE] Quale numero è codificato dalla parola FARO (F-R)?", expected: "84", hint: "F=8, R=4" },
    ],
    leaderboard: [
      {
        userId: "u-elena",
        handle: "elena_mnemo",
        displayName: "Elena V.",
        isFriend: true,
        accuracy: 1.0,
        durationMs: 19_400,
        score: 992,
        submittedAt: "2026-11-06T17:40:00Z",
      },
    ],
  },
];

export interface ReviewHistoryEntry {
  id: string;
  locusId: string;
  routeId: string;
  correct: boolean;
  unassisted: boolean;
  hintCount: number;
  viewedAnswerBeforeAttempt: boolean;
  responseLatencyMs: number;
  effectiveGrade: SchedulerGrade;
  intervalDaysAfter: number;
  createdAt: string;
}

export const INITIAL_REVIEW_HISTORY: ReviewHistoryEntry[] = [
  {
    id: "rev-1",
    locusId: "loc-tesi-1",
    routeId: "route-tesi",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 4200,
    effectiveGrade: "good",
    intervalDaysAfter: 1,
    createdAt: new Date(Date.now() - 86400_000 * 12).toISOString(),
  },
  {
    id: "rev-2",
    locusId: "loc-tesi-1",
    routeId: "route-tesi",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 3600,
    effectiveGrade: "easy",
    intervalDaysAfter: 4,
    createdAt: new Date(Date.now() - 86400_000 * 10).toISOString(),
  },
  {
    id: "rev-3",
    locusId: "loc-tesi-2",
    routeId: "route-tesi",
    correct: false,
    unassisted: false,
    hintCount: 1,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 9100,
    effectiveGrade: "again",
    intervalDaysAfter: 0.01,
    createdAt: new Date(Date.now() - 86400_000 * 9).toISOString(),
  },
  {
    id: "rev-4",
    locusId: "loc-tesi-2",
    routeId: "route-tesi",
    correct: true,
    unassisted: false,
    hintCount: 1,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 6800,
    effectiveGrade: "hard",
    intervalDaysAfter: 1,
    createdAt: new Date(Date.now() - 86400_000 * 8).toISOString(),
  },
  {
    id: "rev-5",
    locusId: "loc-tesi-3",
    routeId: "route-tesi",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 3900,
    effectiveGrade: "good",
    intervalDaysAfter: 3,
    createdAt: new Date(Date.now() - 86400_000 * 7).toISOString(),
  },
  {
    id: "rev-6",
    locusId: "loc-chim-1",
    routeId: "route-chimica",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 4100,
    effectiveGrade: "good",
    intervalDaysAfter: 5,
    createdAt: new Date(Date.now() - 86400_000 * 6).toISOString(),
  },
  {
    id: "rev-7",
    locusId: "loc-chim-2",
    routeId: "route-chimica",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 4800,
    effectiveGrade: "good",
    intervalDaysAfter: 3,
    createdAt: new Date(Date.now() - 86400_000 * 5).toISOString(),
  },
  {
    id: "rev-8",
    locusId: "loc-nonna-1",
    routeId: "route-nonna",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 3100,
    effectiveGrade: "easy",
    intervalDaysAfter: 10,
    createdAt: new Date(Date.now() - 86400_000 * 4).toISOString(),
  },
  {
    id: "rev-9",
    locusId: "loc-nonna-2",
    routeId: "route-nonna",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 3400,
    effectiveGrade: "good",
    intervalDaysAfter: 7,
    createdAt: new Date(Date.now() - 86400_000 * 3).toISOString(),
  },
  {
    id: "rev-10",
    locusId: "loc-to-1",
    routeId: "route-stanza-to",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 2900,
    effectiveGrade: "easy",
    intervalDaysAfter: 14,
    createdAt: new Date(Date.now() - 86400_000 * 2).toISOString(),
  },
  {
    id: "rev-11",
    locusId: "loc-chim-3",
    routeId: "route-chimica",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 4400,
    effectiveGrade: "good",
    intervalDaysAfter: 2,
    createdAt: new Date(Date.now() - 86400_000 * 1).toISOString(),
  },
  {
    id: "rev-12",
    locusId: "loc-tesi-1",
    routeId: "route-tesi",
    correct: true,
    unassisted: true,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    responseLatencyMs: 3200,
    effectiveGrade: "good",
    intervalDaysAfter: 6,
    createdAt: new Date(Date.now() - 3600_000 * 12).toISOString(),
  },
];

export function evaluateLocusRecall(
  locus: WebAppLocus,
  userRating: SchedulerGrade,
  hintCount: number,
  viewedAnswerBeforeAttempt: boolean,
  algorithmVersion: "fsrs-7" | "simple-v1" = "fsrs-7"
) {
  const nowMs = Date.now();
  return computeNextSchedule({
    nowMs,
    currentKnowledgeRevision: 1,
    algorithmVersion,
    previousSchedule: {
      knowledgeRevision: 1,
      algorithmVersion,
      dueAtMs: new Date(locus.dueAt).getTime(),
      lastReviewedAtMs: locus.lastReviewedAt ? new Date(locus.lastReviewedAt).getTime() : null,
      streak: locus.streak,
      repetitions: locus.repetitionCount,
      lapses: locus.lapsesCount,
      stability: locus.stability,
      difficulty: locus.difficulty,
      stateJson: {},
    },
    userRating,
    hintCount,
    viewedAnswerBeforeAttempt,
  });
}

export function computeWebAppProfileMetrics(
  reviews: ReviewHistoryEntry[],
  majorTrials: {
    direction: "forward" | "reverse";
    correct: boolean;
    latencyMs: number;
    stimulusKey?: string;
  }[]
): {
  metrics: Record<MemoryMetricKey, MetricValueSnapshot>;
  interventions: LearningIntervention[];
} {
  const nowIso = new Date().toISOString();

  const reviewTrials: TrialDiagnosticRecord[] = reviews.map((r, i) => ({
    id: r.id,
    ownerId: "user-vanessa",
    sourceKind: "review_attempt",
    reviewAttemptId: r.id,
    learningTargetId: r.locusId,
    palaceId: r.routeId,
    locusId: r.locusId,
    skill: i % 3 === 0 ? "loci" : i % 3 === 1 ? "speech" : "abstract",
    stimulusKey: r.locusId,
    direction: "forward",
    isCorrect: r.correct,
    isUnassisted: r.unassisted,
    errorCategory: r.correct ? "none" : "position",
    expectedLocusOrdinal: (i % 4) + 1,
    actualLocusOrdinal: r.correct ? (i % 4) + 1 : ((i + 1) % 4) + 1,
    recallDelaySeconds: i % 2 === 0 ? 3600 * 6 : 86400 * 2,
    delayBucket: i % 2 === 0 ? "same_day" : "d1_3",
    encodingDurationMs: 4200,
    retrievalLatencyMs: r.responseLatencyMs,
    activeDurationMs: r.responseLatencyMs + 2500,
    hintCount: r.hintCount,
    viewedAnswerBeforeAttempt: r.viewedAnswerBeforeAttempt,
    associationRevision: 1,
    mediaMode: "text",
    difficultyLevel: 2,
    comparabilityGroup: "standard",
    createdAt: r.createdAt,
  }));

  const trainingRecords: TrialDiagnosticRecord[] = majorTrials.map((t, idx) => ({
    id: `tr-${idx}`,
    ownerId: "user-vanessa",
    sourceKind: "training_trial",
    trainingTrialId: `tr-${idx}`,
    skill: "major",
    stimulusKey: t.stimulusKey ?? `major-${(idx % 5) + 10}`,
    direction: t.direction,
    isCorrect: t.correct,
    isUnassisted: t.correct,
    errorCategory: t.correct ? "none" : "decoding",
    recallDelaySeconds: 30,
    delayBucket: "immediate",
    encodingDurationMs: 3100,
    retrievalLatencyMs: t.latencyMs,
    activeDurationMs: t.latencyMs + 1500,
    hintCount: 0,
    viewedAnswerBeforeAttempt: false,
    mediaMode: "text",
    difficultyLevel: 2,
    comparabilityGroup: "standard",
    createdAt: nowIso,
  }));

  const allTrials = [...reviewTrials, ...trainingRecords];
  const metrics = computeAllMemoryMetrics({
    trials: allTrials,
    scheduleStabilitiesDays: [3.2, 5.2, 6.1, 7.0, 10.4, 14.5],
    activeExposureMs: 18 * 60_000,
    windowDays: 28,
    computedAt: nowIso,
  });

  const interventions = generateAdaptiveInterventions({
    ownerId: "user-vanessa",
    trials: allTrials,
    minTrialsThreshold: 10,
    nowIso,
  });

  return { metrics, interventions };
}
