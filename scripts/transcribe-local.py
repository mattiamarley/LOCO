from pathlib import Path
import sys,json,subprocess
sys.path.insert(0,'/private/tmp/loco-audio-deps')
import numpy as np
from faster_whisper import WhisperModel
model=WhisperModel('small',device='cpu',compute_type='int8',download_root='/private/tmp/loco-whisper-models')
for filename in ['Spot ADV.mov','DEF MOBILE.mov']:
 audio = np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(Path('PROJECT START FOLDER/Video')/filename),'-f','f32le','-ac','1','-ar','16000','-']), dtype=np.float32)
 segments,info=model.transcribe(audio,language='it',beam_size=5,vad_filter=True)
 lines=[]; raw=[]
 for s in segments:
  entry={'start':round(s.start,2),'end':round(s.end,2),'text':s.text.strip()};raw.append(entry)
  lines.append(f'[{int(s.start)//60:02}:{int(s.start)%60:02} - {int(s.end)//60:02}:{int(s.end)%60:02}] {s.text.strip()}')
 stem='spot-adv' if filename.startswith('Spot') else 'demo-mobile'
 Path(f'research/media/{stem}-transcript.txt').write_text('\n'.join(lines))
 Path(f'research/media/{stem}-transcript.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2))
 print(filename,len(raw),'segments',flush=True)
