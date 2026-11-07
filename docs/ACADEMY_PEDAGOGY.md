# LOCO Academy 2.0 — Pedagogical Architecture & Scientific Principles

This document is the permanent repository reference for the pedagogical engine of **LOCO Academy 2.0** (`contentVersion: "2.0.0"`). It distills the instructional design rules applied across all 12 courses and 56 lessons.

---

## 1. Core Learning Cycle

Every lesson in LOCO Academy 2.0 teaches a real, transferable skill through a disciplined cycle:

1. **Comprehend & Extract (`Capire`)** — Isolate verifiable targets and distinguish arbitrary facts (`pure facts`) from causal models (`sequential/causal facts`) before applying mnemonics.
2. **Anchor Spatially (`Ancorare`)** — Select stable, distinct, non-ambiguous spatial loci along a fixed direction of travel (`1 → N`) supporting both sequential walkthroughs and direct random access (`Locus #k`).
3. **Encode Actively (`Codificare`)** — Bind the target to its locus or chain neighbor through a concrete physical action, sensory detail, and an interpretable semantic or phonetic key (`cue → answer`).
4. **Retrieve Blindly (`Recuperare`)** — Attempt recall with answers and scene labels hidden (`blindBeforeReveal: true`). Recognition while reading is never credited as recall.
5. **Diagnose & Repair (`Diagnosticare`)** — Classify errors into specific causal categories (`attention_reading`, `wrong_target`, `weak_cue`, `ambiguous_locus`, `order_omission_inversion`, `phonetic_encoding`, `source_misconception`, `retention_decay`) and execute a surgical repair.
6. **Consolidate Over Time (`Consolidare`)** — Separate immediate provisional success (`provisionally_passed`) from delayed retention (`mastered_after_delay`) scheduled via spaced repetition.

---

## 2. Six Foundational Pedagogical Pillars

### 2.1 Retrieval Practice vs. Illusion of Competence
- Re-reading notes, highlighting text, or recognizing an option when visible produces fluency illusions.
- LOCO enforces **blind retrieval**: the learner must commit an answer before any solution or model reference is revealed.
- If the learner reveals the solution before submitting (`submittedBeforeReveal: false`) or uses hints (`hintsUsed > 0`), the attempt is recorded honestly as study or `assisted` practice—never as autonomous mastery.

### 2.2 Spatial Loci Invariants
- **Stability:** Loci must be fixed architectural or furniture anchors (`Porta`, `Lampada`, `Scrivania`), never moving entities (`gatto che dorme`) or indistinguishable duplicates (`3 sedie identiche`).
- **Fixed Route & Direct Addressing:** Every route has a deterministic order (`1..N`) and milestone numbering (every 5th locus: `#5`, `#10`, `#15`, `#20`, `#25`) so the learner can jump directly to `Locus #14` without scanning from `#1`.
- **Construction $\neq$ Recall:** Clicking loci in a room or filling a scene builder only records construction (`skill_practiced`). Memory credit requires a subsequent blind verification phase with labels hidden.

### 2.3 Associative & Linked Chains
- In a Linked chain, item $i$ must physically act upon item $i+1$.
- Each link encodes a single clear directional transition (`A → B`, then `B → C`) rather than a vague paragraph where order collapses.
- When a link breaks (e.g., recalling `martello → sirena → sedia → mappa` and omitting `mongolfiera` in `K04`), the learner repairs only the broken bridge (`sedia → mongolfiera → mappa`) rather than restarting from scratch.

### 2.4 Italian Phonetic System (`major-it-v1`)
- Phonetic conversion is governed by **pronounced consonant phonemes**, never raw spelling:
  - `0` = `/s/, /z/, /ʃ/` (`S`, `Z`, soft `SC` as in `scena` → `02`, `sci` → `0`, `zucchero` → `074`)
  - `1` = `/t/, /d/` (`T`, `D` as in `toro` → `14`, `tuffo` → `18`)
  - `2` = `/n/, /ɲ/` (`N`, `GN` as in `gnomo` → `23`, `noce` → `26`)
  - `3` = `/m/` (`M` as in `mano` → `32`, `micio` → `36`, `mago` → `37`)
  - `4` = `/r/` (`R` as in `riva` → `48`, `raso` → `40`)
  - `5` = `/l/, /ʎ/` (`L`, palatal `GL` as in `luna` → `52`, `foglia` → `85`)
  - `6` = `/tʃ/, /dʒ/` (soft `C/G` before `E/I` as in `ciao` → `6`, `micio` → `36`, `gemma` → `63`)
  - `7` = `/k/, /g/` (hard `C/G`, `CH`, `GH`, `K`, `Q` as in `casa` → `70`, `mago` → `37`, `zucchero` → `074`)
  - `8` = `/f/, /v/` (`F`, `V` as in `faro` → `84`, `fumo` → `83`)
  - `9` = `/p/, /b/` (`P`, `B` as in `pane` → `92`, `botte` → `91`)
- Geminate consonants count as a single phonetic unit (`tuffo` → `18`, `sasso` → `00`, `botte` → `91`).
- Leading zeros are strictly preserved (`"02"`, `"0"`, `"074"`).
- Competence is trained and tracked bidirectionally: **Forward** (`Number → Word`) and **Reverse** (`Word → Number`).

### 2.5 Deep Study, Elaborative Interrogation & Transfer
- Mnemonics are never used as a substitute for causal understanding (`T01`, `R04`).
- Formulas and scientific principles (such as Ohm's Law $V = R \times I$ in `R04`) are tested via **transfer to new numerical values** (`R = 12 Ω, I = 2 A → 24 V`), never by parroting the worked example.

### 2.6 Critical Verification of AI & External Tools (`A01`–`A04`, `W01`–`W04`)
- AI-extracted study cards (`A01`), AI-suggested mnemonic cues (`A02`), Socratic hints (`A03`), and diagnostic reports (`A04`) require explicit human verification against the source text and declared sample sizes.
- Spatial lessons (`W01`–`W04`) operate fully in local/manual mode without requiring paid external mapping or 3D scanning APIs.

---

## 3. Canonical 8-Stage Lesson Structure

Every lesson in `app/components/webapp/loco-academy-player-v2.json` follows an 8-stage progression:

| Stage # | Stage Type | Pedagogical Purpose |
|---|---|---|
| 1 | `hook` | Concrete cognitive problem that exposes why intuition or passive reading fails. |
| 2 | `explanation` | Concise operational principle (with optional expandable deep-dive and explicit learning objective). |
| 3 | `expert_walkthrough` | Step-by-step mental model of how an expert executes the technique and avoids common traps. |
| 4 | `demonstration` | Concrete worked example on Set A with an active comprehension check. |
| 5 | `guided_practice` | Scaffolded interactive practice on Set A (`ordered_words`, `loci_pick`, `builder_pair`, `major_mini`, or `structured_checks`). |
| 6 | `independent_challenge` | Unassisted test on a **brand-new stimulus (Set B)** using the lesson's dedicated game widget (`<lessonId>-lab-v2`). |
| 7 | `diagnostic_feedback` | Causal error analysis (`ErrorDiagnosisCategory`), verification authority badge, and surgical repair action. |
| 8 | `reflection_and_next` | Metacognitive consolidation, mastery gate summary, and connection to spaced review or the next lesson. |
