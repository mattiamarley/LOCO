# LOCO — learning science, techniques and curriculum

**Scope:** evidence-informed product requirements, not medical advice, an efficacy guarantee, or a claim that LOCO's combined method has been clinically validated. This is a curated synthesis of the repository's earlier memory research (as inspected 2026-11-06). Methods are distinguished from implementation and hypotheses.

## 1. What the learner should achieve

Measure at least four different outcomes:

1. **Item recall:** accurately reproduce the target information.
2. **Sequence recall:** retrieve items in the intended order and location.
3. **Understanding:** explain meaning, causes and relationships.
4. **Transfer/application:** use knowledge in a different problem or setting.

Recognition of a familiar scene, a completed lesson, minutes in the app and aesthetic satisfaction do **not** establish any of these outcomes. A clever mnemonic can help retrieve a word while leaving its conceptual meaning unlearned; present a separate explanation task when understanding matters.

**Core cycle:** understand/source-check → choose atomic retrievable targets → encode with personal spatial cues → independently retrieve → receive feedback → repeat after a delay → apply and evaluate.

## 2. Evidence-based building blocks

| Principle | Product implication | Caveat |
| --- | --- | --- |
| Retrieval practice / testing effect | Prompt before answer reveal; log an actual attempt | Immediate familiarity can overstate delayed retention |
| Distributed practice | Review targets on separate days using a versioned scheduler | No one interval schedule is universally optimal |
| Method of Loci | Stable ordered landmarks as retrieval cues | Especially natural for ordered material; not proof of general intelligence gain |
| Generation effect | Let people author/transform cues rather than merely accept AI output | Extra value of *AI-assisted* personalization is unproven for LOCO |
| Chunking and linking | Teach segmentation, stories and bridges for multi-step information | Chunks require meaningful boundaries; long stories can cause interference |
| Interleaving | Mix *learned* categories when choosing a technique is part of the skill | Random mixing before comprehension may overwhelm a novice |
| Feedback and explanatory checks | Correct factual errors and request explanations | Mnemonic fluency must not be mistaken for scientific accuracy |
| Skill-specific practice | Test spatial, numerical and conceptual memory separately | Gains on an exercise do not imply transfer to unrelated abilities |

### Selected source references

- Roediger & Karpicke (2006), retrieval versus rereading: https://pubmed.ncbi.nlm.nih.gov/16507066/
- Karpicke & Roediger (2008), repeated retrieval: https://doi.org/10.1126/science.1152408
- Karpicke & Blunt (2011), retrieval and meaningful learning: https://pubmed.ncbi.nlm.nih.gov/21252317/
- Cepeda et al. (2008), spacing intervals: https://escholarship.org/uc/item/0kp5q19x
- Roediger (1980), mnemonic methods: https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-1980_JEPHLM.pdf
- Dresler et al. (2017), loci training and follow-up: https://pmc.ncbi.nlm.nih.gov/articles/PMC5439266/
- Legge et al. (2012), virtual environments and loci: https://pubmed.ncbi.nlm.nih.gov/23098905/
- Slamecka & Graf (1978), generation effect (earlier research collection); verify bibliographic access before quoting.
- Rohrer & Taylor (2007), interleaved math practice: https://digitalcommons.usf.edu/psy_facpub/1767/
- Owen et al. (2010), limits of transfer from brain training: https://pubmed.ncbi.nlm.nih.gov/20407435/

These studies cover varying populations and tasks. None alone validates all LOCO features or an exact outcome for adolescents. If the audience includes minors, validate separately.

## 3. Method of Loci: teachable procedure

A **palace** is an environment/route; a **locus** is a stable, individually identifiable anchor. Its order should be repeatable. Prefer a small initial route (e.g. five distinct landmarks) for usability, not because five is a scientifically mandated limit.

1. Choose a familiar location or explore a virtual scene first.
2. Set an unambiguous traversal order (door → hallway → sofa → window); avoid indistinguishable repeated points.
3. Practise the *empty* route and its spatial sequence.
4. Link one primary knowledge target to each locus; split complex facts or create multiple targets as needed.
5. Form a concrete, personally meaningful visual/verbal association between the target and location.
6. Retrieve the answer by mentally following the route; reveal the answer only after trying.
7. Repeat after a delay, logging errors and source corrections.

**Critical LOCO interaction:** once the castle/environment is open, select a point using pointer/touch/gaze, confirm with **Add locus** (or optional voice command), and author/edit knowledge and its association **inside the scene**. A detached external editor must not be the required main path. The spatial anchor and association should remain stable when the camera moves.

**What makes a useful cue:** discriminability, personal familiarity, a vivid action, a clear link between imagined cue and target, and resistance to confusion with neighboring loci. Novelty or weirdness alone is not guaranteed to improve memory.

## 4. Other technique modules

### Linking and story method

For sequences, a learner can connect consecutive items into an action chain. Teach forward retrieval and error localization; avoid chains so ambiguous that one missed link hides all subsequent items. Offer an alternative of separate loci for high-stakes independent facts.

### Chunking

Group elements by meaningful structure (date periods, categories, causal chains). Verify whether the chunk helps explain a relationship or merely hides the detail. The learner should be able to decompose and retrieve the individual constituents.

### Phonetic / Major system (Italian convention)

This is **phoneme-to-digit encoding**, not arbitrary letter replacement. Consonant sounds encode digits; vowels aid word creation. The reverse operation decodes the word back to digits. A possible documented Italian mapping from earlier research:

| Digit | Consonant sound family | Example from prior LOCO research |
| --- | --- | --- |
| 0 | s, z, soft `sc` | *osso* → 0 |
| 1 | t, d | *tè* → 1 |
| 2 | n, `gn` | *neo* → 2 |
| 3 | m | *amo* → 3 |
| 4 | r | *re* → 4 |
| 5 | l, palatal `gl` | *ali* → 5 |
| 6 | soft c/g | *ciao* → 6 |
| 7 | hard c/g, k, q | *ago* → 7 |
| 8 | f, v | *uva* → 8 |
| 9 | p, b | *boa* → 9 |

This is a **versioned convention**, not a universal law. Hard/soft c/g, digraphs, double consonants, dialect and loanwords require a phonetic lexicon and tests. Validated simple examples under this convention: *toro* = 14, *luna* = 52, *pane* = 92, *mago* = 37, *micio* = 36. Do not generate authoritative answer keys by naïve letter substitution. Keep numeric-to-image and image-to-numeric accuracy as separate directions in the skill model.

### PAO (Person–Action–Object)

An optional advanced module: associate a person, action and object with numeric tokens, then recombine elements to encode longer strings. Teach a stable personal dictionary, one-to-one retrieval and interference checks; require learners to master simpler cues before advanced combinations. Evidence from password memorization does not automatically prove superiority for school subjects. Related paper discussed in prior research: https://arxiv.org/abs/1410.1490

### Interleaving, elaboration and application

After initial guided acquisition, mix problems requiring different recognition/recall strategies. Prompt explanations and examples, not merely correct multiple-choice selection. Keep a separate application/transfer test rather than assuming rapid Major-system training improves unrelated courses.

## 5. Recommended lesson architecture (target, not shipped content)

Every lesson should have: **why it helps → concise model → worked example → guided attempt → independent attempt → feedback → application → later micro-review**. A lesson completion checkbox is not a mastery assessment.

| Unit | Main objective | Sample activity | Evidence of mastery |
| --- | --- | --- | --- |
| 0. Recall vs recognition | Understand what a valid recall attempt is | Answer before flip; compare with recognition | Can distinguish independent recall from clue-assisted recall |
| 1. Palace basics | Build a distinct ordered route | Select 5 landmarks in a scene | Recall all landmarks in order without labels |
| 2. Association design | Build a personal cue tied to a locus | Encode an everyday list with images/actions | Recall target and explain why cue maps to it |
| 3. Studying and feedback | Correct source and item errors | Fix a misleading mnemonic | Can separate association from factual answer |
| 4. Spaced practice | Follow a due queue and interpret feedback | Review missed items on a subsequent day | Correct delayed recall without hints |
| 5. Story, linking, chunking | Choose technique by structure | Compare sequence as story vs loci | Can retrieve components and order |
| 6. Numbers & phonetics | Encode/decode digits reliably | Italian Major-system word-to-number drill | Bidirectional sound-based accuracy |
| 7. Advanced composition | Use PAO or complex loci when appropriate | Encode 6 digits with personal PAO | Correct element and sequence reconstruction |
| 8. Transfer to studying | Apply to real source material | Prepare an exam question + explanation | Correct answer + explanation on unseen variant |

For each lesson, persist separate states: **not started**, **in progress**, **practice completed**, and **mastery evidence** if measured. Do not infer mastery from the act of opening content.

## 6. Review implementation rules

A recall attempt contains the prompt and optionally a non-revealing locus reference. No correct answer, revealing association, full source chunk or generated picture that effectively gives away the target should be exposed before the attempt if it would invalidate blind recall.

Record, at minimum: user/target ID, target revision, palace/locus and scene revision when relevant, prompt mode/direction, started/completed timestamp, actual answer or assessment (if provided), hint count, whether answer was seen before attempt, latency, independent correctness, effective grade, scheduler algorithm/version, due date and idempotency key.

**Existing backend rules:** `simple-v1` / `fsrs-7` exist in `app/server/src/srs.ts`. `viewedAnswerBeforeAttempt=true` forces an `again`/forgot result, and hints cap the attainable grade (as specified in server tests). Never change these semantics silently during refactors.

Keep attempts as events. When a factual answer is materially edited, create a new revision and explicitly decide how to reconcile review history. A wrong answer learned confidently is not learning success. Repeated errors can trigger: split a complicated item, make the locus more distinctive, verify source accuracy, or revise an association.

## 7. Metrics and adaptive teaching

The v2 backend describes 18 metric families (see `app/server/docs/PERFORMANCE_V2.md`):

1. Immediate recall accuracy
2. Delayed recall accuracy
3. Encoding speed
4. Retrieval speed
5. Retention efficiency
6. Learning rate
7. Error rate
8. Hint dependency
9. Memory stability
10. Recall consistency
11. Training volume
12. Review efficiency
13. Spatial memory
14. Visual encoding
15. Numerical memory
16. Conceptual association
17. Sequential memory
18. Technique mastery

They map to five dashboard groupings: overview, memory skills, technique mastery, learning analytics, and records/rankings. Use **sample size, `nValid`, `nUnassisted`, window (`windowDays`), `formulaVersion`, confidence level** and relevant skill/direction. When the sample is too small, return an insufficient-evidence state rather than a fabricated numerical score.

Track numerical skills **by direction** (number → image and image → number), confusion with adjacent loci, and verified delayed recall. The most promising umbrella evaluation indicator is *correct items recalled after a delay per total minute of study*, paired with explanation accuracy, error and attrition rates; do not collapse everything into a gimmicky 'IQ' score.

Adaptive suggestions should cite an interpretable reason code and observational evidence. To claim an intervention helped, compare tasks matched in skill, direction, difficulty/group and sufficient sample size; otherwise report **inconclusive**.

## 8. AI: useful assistant, not ground truth

- **Concept extraction:** produce source-linked proposals that need user confirmation.
- **Mnemonic ideation:** offer a few editable alternatives; ask the learner to articulate why the cue works.
- **Media generation:** only after cue confirmation and only when it supports recall; reuse stable assets when possible.
- **Tutoring:** give graduated hints and error explanations; never accidentally disclose the answer before a blind attempt.
- **Semantic grading:** show rubric, source and an appeal/correction route; keep manual self-assessment fallback.
- **Scheduling:** deterministic application logic is authoritative; AI can explain or suggest priorities but not silently invent due dates.

Cost design matters: earlier planning assumed a tentative **€100/month** pilot budget shared across hosting, AI, Maps and contingency; actual cost per active user/job must be measured before rollout. Rate-limit optional expensive features and handle unavailable providers gracefully.

## 9. Learning quality and evidence plan

Functional tests must verify hidden answers, truthful hint attribution, stable loci, revision reconciliation, timezone-safe schedule, idempotent attempts, and correct skill-direction tracking.

To test incremental learning benefit, compare groups with similar material and total study time, e.g. **retrieval + spacing** versus **loci + retrieval + spacing**. Predefine outcomes, randomization and analyses. Include delayed tests (illustratively 24 hours, 7 days, 30 days), sequence errors, comprehension/application, creation time, attrition, overload and false recollections. These are evaluation time points, not mandatory app review intervals.

Report negative or uncertain findings. Do not promise far transfer or uniform effectiveness across subjects, participants or age groups. Make accommodations for learners who prefer verbal/textual cues instead of vivid imagery.
