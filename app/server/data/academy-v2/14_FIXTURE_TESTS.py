#!/usr/bin/env python3
"""Checks content fixture coverage and deterministic example consistency; not a UI/runtime test."""
import json,sys
from pathlib import Path
p=Path(__file__).resolve().parent
j=json.loads((p/'12_GAME_FIXTURES_AUTHORING.json').read_text())['fixtures']
lessons=json.loads((p/'03_LESSONS_56_AUTHORING.json').read_text())['lessons']
assert len(j)==56
assert set(j)=={x['id'] for x in lessons}
assert len({v['id'] for v in j.values()})==56
n_d=0;n_r=0
for id,x in j.items():
 assert x['datasetVersion'].startswith('2.0.0'),id
 assert x['authoringOnly'] is True,id
 assert isinstance(x['data'],dict),id
 if x['scoringMode']=='deterministic_or_hybrid':
  n_d+=1
  assert x['data']['kind']!='rubric_task',id
  assert 'answer' in x['data'] or 'examples' in x['data'],id
 else:
  n_r+=1
  assert x['data']['kind']=='rubric_task',id
  assert len(x['data']['evaluationRubric'])>=3,id
# Hand-validated reference pairs in major-it-v1.
a=j['N02']['data'];assert dict(zip(a['words'],a['answer']))['scena']=='02'
assert dict(zip(a['words'],a['answer']))['tuffo']=='18'
assert dict(zip(a['words'],a['answer']))['gnomo']=='23'
b=j['N04']['data'];assert dict(zip(b['words'],b['answer']))['riva']=='48'
assert dict(zip(b['words'],b['answer']))['fumo']=='83'
assert j['N05']['data']['answer']['Statuto Albertino']=='1848'
assert j['R04']['data']['answer']['floats']=='B'
assert j['U02']['data']['answer']['speedAccuracyBestCompromiseTrial']==2
print(f'PASS: {len(j)} lesson fixtures; {n_d} deterministic/hybrid; {n_r} manually/rubric assessed. Core major/date/numeric sample checks passed.')
print('NOTE: no browser, scoring or human learning validation performed by this script.')
