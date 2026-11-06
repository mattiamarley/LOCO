-- LOCO Backend Blueprint v2 — 003_seed_defaults.sql
-- Seed catalog: 8 Technique Lessons, Training Exercise Templates, Canonical Challenges

BEGIN;

INSERT INTO technique_lessons (slug, ordinal, title, skill, version, content_md) VALUES
  ('loci-foundations', 0, 'Il Palazzo della Memoria e i Loci', 'loci', 1, 'Scegli un ambiente familiare e fissa punti ordinati e distinti lungo un percorso coerente.'),
  ('vivid-associations', 1, 'Associazioni vivide, assurde e multisensoriali', 'loci', 1, 'Trasforma concetti astratti in immagini concrete con movimento, esagerazione ed emozione.'),
  ('link-story-method', 2, 'Metodo Link e Catena Narrativa', 'abstract', 1, 'Collega ogni elemento al successivo con una micro-scena causale difficile da spezzare.'),
  ('major-system-00-99', 3, 'Sistema Fonetico Leibniz / Major 00–99', 'major', 1, 'Converti coppie di cifre in consonanti e immagini stabili per numeri, date e formule.'),
  ('pao-system', 4, 'Sistema PAO (Persona-Azione-Oggetto)', 'pao', 1, 'Comprimi 6 cifre in una singola scena combinando Persona, Azione e Oggetto.'),
  ('names-and-faces', 5, 'Nomi e Volti', 'faces', 1, 'Individua un tratto distintivo del volto e ancoralo foneticamente al nome.'),
  ('abstract-concepts-lab', 6, 'Concetti Astratti e Spiegazione Attiva', 'abstract', 1, 'Separa la chiave visiva di accesso dalla spiegazione concettuale verificabile.'),
  ('spaced-retrieval-mastery', 7, 'Retrieval Practice e Ripetizione Dilazionata', 'speech', 1, 'Richiama attivamente a libro chiuso prima di guardare la risposta per consolidare la traccia.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO training_exercises (slug, title, skill, default_direction, generator_version, scorer_version, config_json) VALUES
  ('major-00-99', 'Major 00–99 Drill Bidirezionale', 'major', 'number_to_image', 'major-gen-v1', 'major-scorer-v1', '{"itemCount":20,"directions":["number_to_image","image_to_number"]}'::jsonb),
  ('loci-sprint', 'Loci Sprint Spaziale', 'loci', 'forward', 'loci-gen-v1', 'loci-scorer-v1', '{"itemCount":15,"orders":["forward","backward","random"]}'::jsonb),
  ('abstract-lab', 'Abstract Lab: Immagine e Concetto', 'abstract', 'forward', 'abstract-gen-v1', 'abstract-scorer-v1', '{"itemCount":10}'::jsonb),
  ('face-name-recall', 'Face & Name Studio', 'faces', 'face_to_name', 'faces-gen-v1', 'faces-scorer-v1', '{"itemCount":12}'::jsonb),
  ('speech-key-points', 'Speech Recall: Sequenza Argomenti', 'speech', 'forward', 'speech-gen-v1', 'speech-scorer-v1', '{"itemCount":8}'::jsonb),
  ('numbers-span-40', 'Number Span Rapido', 'numbers', 'forward', 'numbers-gen-v1', 'numbers-scorer-v1', '{"itemCount":20}'::jsonb),
  ('pao-triplets', 'PAO Triplet Compression', 'pao', 'number_to_scene', 'pao-gen-v1', 'pao-scorer-v1', '{"itemCount":12}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO challenge_definitions (slug, title, skill, description) VALUES
  ('numbers-40', 'Numbers 40 Benchmark', 'numbers', 'Memorizza e richiama 20 coppie numeriche in ordine entro il tempo limite.'),
  ('loci-sprint-20', 'Loci Sprint 20', 'loci', 'Posiziona e richiama 20 elementi nei loci in sequenza perfetta.'),
  ('major-speed-30', 'Major Speed 30', 'major', 'Conversione rapida di 30 coppie Major 00–99 senza errori.')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
