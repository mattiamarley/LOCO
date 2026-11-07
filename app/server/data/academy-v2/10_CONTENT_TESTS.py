#!/usr/bin/env python3
"""Standard-library validation for the LOCO Academy v2 authoring pack.
Only verifies editorial integrity, NOT React runtime, pedagogy with humans, or science.
"""
from pathlib import Path
from collections import Counter
import csv,json,sys,re
ROOT=Path(__file__).resolve().parent
p=json.loads((ROOT/'03_LESSONS_56_AUTHORING.json').read_text(encoding='utf-8'))
q=json.loads((ROOT/'04_LESSONS_PLAYER_CONTENT.json').read_text(encoding='utf-8'))
items=p['lessons']; public=q['lessons']; ids=[r['id'] for r in items]
issues=[]
def req(c,msg):
 if not c:issues.append(msg)
req(len(items)==56, 'Expected 56 lessons')
req(len(p['courses'])==12, 'Expected 12 courses')
req(len(set(ids))==len(ids), 'Duplicate lesson ID')
req(ids==[r['id'] for r in public], 'Public lesson order drift')
req(Counter(r['tier'] for r in items)=={'free':32,'plus':20,'pro':4}, 'Tier split mismatch')
req([r['id'] for r in items if r['id'].startswith('S')]==['S01','S02','S03','S04','S05','S06'],'Onboarding ID drift')
req(len(set(r['game']['gameId'] for r in items))==56,'Game IDs must be unique')
req(len(set(r['game']['newStimulus'] for r in items))==56,'Independent stimuli must be different')
req(len(set(r['expertExplanation'] for r in items))==56,'Expert explanation duplicated')
req(len(set(r['title'] for r in items))==56,'Duplicate title')
for x in items:
 id=x['id']; st=x['steps'];game=x['game']; req(len(st)==8, id+': needs eight authored stages')
 req([s['type'] for s in st]==['hook','explanation','expert_walkthrough','demonstration','guided_practice','independent_challenge','diagnostic_feedback','reflection_and_next'],id+': inconsistent lesson steps')
 req(len(x['expertExplanation'])>160, id+': explanation too short')
 req(len(x['sourceInspiredBy'])>=2, id+': missing book-method references')
 req(all(ref['section'] for ref in x['sourceInspiredBy']),id+': source reference empty')
 req(len(game['newStimulus'])>30,id+': independent challenge underspecified')
 req(len(game['masteryGate'])>15,id+': mastery criterion missing')
 req(game['evaluation']['blindBeforeReveal'] is True,id+': no blind-recall guard')
 req(st[5]['interactive']['noAnswerVisible'] is True,id+': public checkpoint must be hidden before attempt')
 req(st[5]['interactive']['mustAttempt'] is True,id+': checkpoint must require attempt')
 req(x['contentVersion']=='2.0.0',id+': version drift')
 req(not re.search(r'guided-unimplemented|simulatedPlanTier|isCorrect:\s*true',json.dumps(x,ensure_ascii=False),re.I),id+': legacy placeholder or key in new content')
 req(all(pr in ids for pr in x['prerequisites']),id+': dangling prerequisite')
 req(x['id']==x['legacyId'],id+': legacy ID changed')
 req(x['id'] in [lid for c in p['courses'] if c['courseId']==x['courseId'] for lid in c['lessonIds']],id+': course mapping mismatch')
 req(x['game']['evaluation']['method'] != 'simple_nonempty_text',id+': invalid rubric')
 req('mastery' not in st[-1]['interactive'] or st[-1]['interactive'].get('masteryDeferred',False),id+': mastery awarded just for reading')
req(len({r['game']['kind'] for r in items})>=25,'Insufficient game archetype variety')
req(len({ref['sourceId'] for r in items for ref in r['sourceInspiredBy'] if ref['sourceId']!='learning_science'})>=6,'Six books not represented')
with (ROOT/'07_SOURCE_CROSSWALK_56.csv').open(encoding='utf-8',newline='') as f:
 cross=list(csv.DictReader(f))
req({x['lesson_id'] for x in cross}==set(ids),'Source crosswalk misses some lessons')
req(not any('originalReading' in r or 'originalCheckpoint' in r for r in public),'Public projection includes editorial keys')
if issues:
 print('FAILED:',len(issues),'issue(s)');[print(' - '+i) for i in issues];sys.exit(1)
print('PASS: 56 lessons; 12 courses; 32/20/4 tiers; 56 distinct challenges; eight stages each; six source books; prerequisite/version/assessment schema checks.')
print('NOT VERIFIED HERE: all game renderers, semantic scoring validity, browser responsive behavior, learning effectiveness or factual source QA.')
