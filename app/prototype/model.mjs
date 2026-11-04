export const lessons = [
 ['Parti da cinque parole','Prima misura il richiamo: leggi cinque parole, nascondile e scrivile in ordine. Il risultato iniziale serve a confrontare i tuoi tentativi, non misura la tua intelligenza.','Prova: mela, nave, chiave, luna, pane.'],
 ['Costruisci il tuo percorso','Scegli cinque punti distinti della stanza che conosci. Mantieni sempre lo stesso ordine e percorri mentalmente la stanza prima di aggiungere contenuti.','Indica porta, scrivania, letto, libreria e finestra sulla pianta. Adatta questi punti alla tua stanza.'],
 ['Crea associazioni personali','In ogni punto immagina un oggetto che compie un’azione con ciò che vuoi ricordare. Una scena specifica e riconoscibile è più utile di un’immagine decorativa.','Alla porta una mela gigantesca impedisce di entrare. Quale scena inventeresti tu?'],
 ['Richiama prima di rileggere','Guarda il luogo, tenta una risposta e solo dopo mostra la soluzione. Distingui il richiamo autonomo da quello con aiuto.','Ripeti i cinque punti senza guardare le risposte.'],
 ['Distribuisci i ripassi','Ripassa in momenti diversi. Se sbagli, correggi la scena e torna presto sul contenuto. Gli intervalli dell’app sono una regola iniziale adattabile, non una garanzia scientifica.','Confronta risposta attesa e risposta data; individua cosa ha causato l’errore.'],
 ['Numeri e suoni','Un codice fonetico converte numeri in suoni e poi parole: 0 s/z, 1 t/d, 2 n, 3 m, 4 r, 5 l, 6 c/g dolci, 7 c/g dure e k, 8 f/v, 9 p/b. Conta la pronuncia; le vocali collegano i suoni.','12 → t/n → tana. Scegli una tua immagine e mantieni il codice coerente.'],
 ['Carte: una mappa stabile','Per iniziare usa una carta per luogo e cinque carte. Scegli un’immagine stabile per ciascuna carta, distinguendo valore e seme. Allena prima il riconoscimento delle immagini, poi l’ordine.','Passa a 10, 26 e 52 carte quando riconosci bene le associazioni. Il sistema persona–azione–oggetto è un percorso avanzato separato.'],
 ['Studiare un argomento','Comprendi prima le idee e verifica le fonti. Usa i loci per la struttura e i concetti chiave; spiega poi l’argomento senza leggere. Ricordare parole non equivale a comprendere.','Scegli tre idee di un capitolo, spiegale e collocale in tre luoghi.']
];
export function initialState(){return {version:1,name:'La mia stanza',loci:[],reviews:[],completed:[]};}
export function validate(data){
 if(!data || data.version!==1 || typeof data.name!=='string' || data.name.length>120 || !Array.isArray(data.loci) || data.loci.length>200 || !Array.isArray(data.reviews)||!Array.isArray(data.completed)) throw Error('File LOCO non valido.');
 const ids=new Set();
 for(const p of data.loci){if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(p.id)||ids.has(p.id)||!['label','question','answer','scene'].every(k=>typeof p[k]==='string'&&p[k].length<=4000)||![p.x,p.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!Number.isFinite(p.due)||!Number.isInteger(p.streak)||p.streak<0)throw Error('Punti del percorso non validi.');ids.add(p.id);}
 if(!data.completed.every(n=>Number.isInteger(n)&&n>=0&&n<lessons.length)||data.reviews.length>100000||!data.reviews.every(r=>r&&typeof r.id==='string'&&Number.isFinite(r.at)&&['forgot','help','correct'].includes(r.outcome))) throw Error('Progressi non validi.');
 return data;
}
export function schedule(locus,outcome,now=Date.now()){
 if(!['forgot','help','correct'].includes(outcome))throw Error('Esito non valido');
 const streak=outcome==='correct'?locus.streak+1:0;
 const delay=outcome==='forgot'?10*60000:outcome==='help'?86400000:[1,3,7,14,30][Math.min(streak-1,4)]*86400000;
 return {...locus,streak,due:now+delay};
}
export function deck(random=Math.random){const cards=[];for(const s of ['♠','♥','♦','♣'])for(const v of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])cards.push(v+s);for(let i=cards.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
