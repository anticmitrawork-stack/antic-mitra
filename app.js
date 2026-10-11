/* Antic Mitra — shared script for every page */
(()=>{
/* ====== EDIT THESE ====== */
const CONFIG={
  whatsapp:'',      // your WhatsApp number with country code, digits only, e.g. '919876543210'
  formEndpoint:''   // optional: Formspree / Google Apps Script URL to receive contact form submissions
};
/* ======================== */

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const page=($('main')||{}).dataset?.page||'home';

/* WhatsApp links */
if(CONFIG.whatsapp)$$('[data-wa]').forEach(a=>{a.href='https://wa.me/'+CONFIG.whatsapp+'?text='+encodeURIComponent('Hi Antic Mitra, I want to know more about AI automation.')});

/* active nav */
$$('[data-nav]').forEach(a=>{if(a.dataset.nav===page){a.classList.add('active');a.setAttribute('aria-current','page')}});

/* ---------- SOUND (Web Audio) ---------- */
const S={on:false,ctx:null,
  ensure(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)this.ctx=new C()}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();return this.ctx},
  tone(f,d=.08,type='sine',v=.05,delay=0,f2){if(!this.on)return;const c=this.ensure();if(!c||c.state!=='running')return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02)},
  hover(){this.tone(1400,.04,'sine',.012)},
  click(){this.tone(520,.09,'triangle',.05,0,880)},
  pop(){this.tone(880,.07,'sine',.04);this.tone(1320,.09,'sine',.03,.06)},
  send(){this.tone(660,.08,'triangle',.04,0,990)},
  chime(){[523,659,784,1047].forEach((f,i)=>this.tone(f,.35,'sine',.045,i*.07))}
};
const sndBtn=$('#sndBtn'),sndIco=$('#sndIco');
const ICO_ON='<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',ICO_OFF='<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>';
function setSound(on){S.on=on;if(sndBtn){sndBtn.setAttribute('aria-pressed',on);sndIco.innerHTML=on?ICO_ON:ICO_OFF}store.set('am-sound',on?'1':'0')}
if(sndBtn)sndBtn.addEventListener('click',()=>{setSound(!S.on);if(S.on){S.ensure();setTimeout(()=>S.chime(),30)}else if('speechSynthesis' in window)speechSynthesis.cancel()});
if(store.get('am-sound')==='1'){setSound(true);const unlock=()=>{S.ensure();removeEventListener('pointerdown',unlock)};addEventListener('pointerdown',unlock)}
document.addEventListener('pointerover',e=>{const t=e.target.closest('a,button,.card,summary,.svc-pick span');if(t&&!t.contains(e.relatedTarget))S.hover()});
document.addEventListener('click',e=>{if(e.target.closest('a,.tab,summary,.quick button,.svc-pick'))S.click()});

/* ---------- LANGUAGE ---------- */
const TE={
 'nav.home':'హోమ్','nav.services':'సేవలు','nav.demo':'లైవ్ డెమో','nav.about':'మా గురించి','nav.contact':'కాంటాక్ట్','nav.sound':'సౌండ్',
 'cta.audit':'ఉచిత AI ఆడిట్ బుక్ చేయండి','cta.demo':'లైవ్ డెమో చూడండి','cta.wa':'WhatsApp లో చాట్ చేయండి','cta.services':'అన్ని సేవలు చూడండి',
 'hero.eyebrow':'AI ఆటోమేషన్ స్టూడియో','hero.h1a':'అసాధ్యాన్ని','hero.h1b':'ఆటోమేట్ చేద్దాం.',
 'hero.sub':'మేము WhatsApp AI బాట్‌లు, AI వాయిస్ ఏజెంట్లు, కస్టమ్ CRMలు తయారు చేస్తాము. మీ Google Business Profile, YouTube, సోషల్ మీడియా, బ్లాగ్‌లను పూర్తిగా ఆటోమేట్ చేస్తాము. మీ టీమ్ ఆఫ్‌లైన్‌లో ఉన్నా మీ బిజినెస్ 24/7 పనిచేస్తూనే ఉంటుంది.',
 'stat.1':'వేగంగా లీడ్ రిప్లై','stat.2':'రిపీటెడ్ పనులు ఆటోమేట్','stat.3':'ఎప్పుడూ ఆన్‌లో',
 'con.title':'ఆటోమేషన్ ఇంజిన్','con.tag':'సాంపుల్ ఫీడ్','con.foot':'ఈరోజు పూర్తైన పనులు',
 'tools.title':'మీరు ఇప్పటికే వాడుతున్న టూల్స్‌తో కలిసి పనిచేస్తుంది',
 'home.svc.eyebrow':'మేము ఏమి చేస్తాము','home.svc.h2':'మీ బిజినెస్‌ని ఆటోపైలట్‌లో పెట్టే నాలుగు మార్గాలు.','home.svc.sub':'ఒక్కో సర్వీస్ విడిగా పనిచేస్తుంది. అన్నీ కలిపితే మీ కస్టమర్ జర్నీ మొత్తం ఆటోమేట్ అవుతుంది.',
 'hf1.d':'ప్రతి ఎంక్వైరీకి సెకన్లలో రిప్లై, లీడ్ క్వాలిఫై, బుకింగ్‌లు, పేమెంట్‌లు.','hf2.d':'కొత్త లీడ్‌కి 30 సెకన్లలో కాల్ చేసి మీటింగ్ బుక్ చేస్తుంది.','hf3.d':'అన్ని లీడ్స్ ఒకే చోట, ఆటోమేటిక్ ఫాలో-అప్‌లతో.','hf4.t':'మార్కెటింగ్ ఆటోపైలట్','hf4.d':'Google Business Profile, YouTube, సోషల్ మీడియా, బ్లాగ్‌లు దానంతట అవే నడుస్తాయి.','more':'మరింత చూడండి',
 'home.demo.eyebrow':'ఇప్పుడే ట్రై చేయండి','home.demo.h2':'మా మాట నమ్మకండి. బాట్‌ని మీరే టెస్ట్ చేయండి.','home.demo.p':'WhatsApp బాట్‌తో చాట్ చేయండి, AI సేల్స్ కాల్ వినండి, ఆటోమేషన్ మీకు నెలకు ఎంత ఆదా చేస్తుందో లెక్కించండి.','home.demo.btn':'లైవ్ డెమో ఓపెన్ చేయండి',
 'svc.eyebrow':'మా సేవలు','svc.h1':'మీ బిజినెస్ ఆటోపైలట్‌లో నడవడానికి కావాల్సినవన్నీ.','svc.sub':'మొదటి WhatsApp మెసేజ్ నుంచి ఫైవ్-స్టార్ రివ్యూ వరకు, ప్రతి స్టెప్ దానంతట అదే జరుగుతుంది. ఒక సర్వీస్ ఎంచుకోండి లేదా అన్నీ కలపండి.',
 's1.t':'WhatsApp AI బాట్‌లు','s1.d':'ప్రతి ఎంక్వైరీకి సెకన్లలో రిప్లై ఇస్తుంది, లీడ్‌ని క్వాలిఫై చేస్తుంది, మీ కేటలాగ్ చూపిస్తుంది, బుకింగ్‌లు, పేమెంట్‌లు తీసుకుంటుంది. అవసరమైతే మీ టీమ్‌కి అప్పగిస్తుంది.',
 's2.t':'AI వాయిస్ ఏజెంట్లు','s2.d':'కొత్త లీడ్‌కి 30 సెకన్లలో కాల్ చేస్తుంది, మనిషిలా సహజంగా మాట్లాడుతుంది, మీటింగ్‌లను నేరుగా మీ క్యాలెండర్‌లో బుక్ చేస్తుంది.',
 's3.t':'కస్టమ్ CRM','s3.d':'యాడ్స్, WhatsApp, కాల్స్, ఈమెయిల్ నుంచి వచ్చే ప్రతి లీడ్ ఒకే పైప్‌లైన్‌లోకి వస్తుంది, ఆటోమేటిక్‌గా స్కోర్ చేసి అసైన్ అవుతుంది.',
 's4.t':'Google Business Profile','s4.d':'ప్రతి రివ్యూకి రిప్లై, వారానికో పోస్ట్, ఆఫర్లు, ప్రశ్నలకు జవాబులు. Google Maps లో మీ ర్యాంక్ పెరుగుతుంది.',
 's5.t':'YouTube ఆటోమేషన్','s5.d':'స్క్రిప్ట్, వాయిస్-ఓవర్, Shorts, టైటిల్స్, థంబ్‌నెయిల్స్, SEO ట్యాగ్‌లు. మీరు ఎడిట్ చేయకుండానే వీడియోలు షెడ్యూల్ ప్రకారం పబ్లిష్ అవుతాయి.',
 's6.t':'సోషల్ మీడియా ఆటోపైలట్','s6.d':'Instagram, Facebook, LinkedIn కోసం నెల మొత్తం పోస్ట్‌లు మీ బ్రాండ్ స్టైల్‌లో తయారై, బెస్ట్ టైమ్‌లో షెడ్యూల్ అవుతాయి. కామెంట్స్, DMలకు AI జవాబిస్తుంది.',
 's7.t':'బ్లాగ్ & SEO','s7.d':'కీవర్డ్ రీసెర్చ్, పెద్ద ఆర్టికల్స్, ఇంటర్నల్ లింక్స్ ప్రతి వారం మీ వెబ్‌సైట్‌లో పబ్లిష్ అవుతాయి.',
 's8.t':'డిజిటల్ మార్కెటింగ్','s8.d':'Google, Meta యాడ్ క్యాంపెయిన్లు, ఆటోమేటిక్ క్రియేటివ్ టెస్టింగ్, లీడ్స్ నేరుగా మీ CRM లోకి.',
 's9.t':'కస్టమ్ AI SaaS','s9.d':'ఎవరూ ఇంకా తయారు చేయని ఐడియా ఉందా? లాగిన్, బిల్లింగ్, డాష్‌బోర్డ్‌లతో మీ సొంత AI ప్రోడక్ట్ తయారు చేస్తాము.',
 'lab.eyebrow':'ఇంటరాక్టివ్ ల్యాబ్','lab.h1':'ఇక్కడే మీరే టెస్ట్ చేయండి.','lab.sub':'ఇవి పనిచేసే డెమోలు. బాట్‌తో చాట్ చేయండి, సాంపుల్ సేల్స్ కాల్ వినండి, లేదా ఆటోమేషన్ ఎంత సేవ్ చేస్తుందో లెక్కించండి.',
 'tab.chat':'WhatsApp బాట్','tab.voice':'వాయిస్ ఏజెంట్','tab.roi':'సేవింగ్స్ కాలిక్యులేటర్',
 'pc.h':'రాత్రి 2 గంటలకీ మేల్కొని ఉండే మీ బెస్ట్ సేల్స్‌పర్సన్.','pc.p':'ఏదైనా అడగండి: ధర, Google రివ్యూలు, YouTube, లేదా “తెలుగు” అని టైప్ చేయండి. మీ కస్టమర్ల WhatsApp లో ఎలా రిప్లై ఇస్తుందో అలాగే వెంటనే జవాబిస్తుంది.',
 'pc.1':'3 సెకన్లలోపు రిప్లై','pc.2':'తెలుగు, హిందీ, ఇంగ్లీష్ అర్థం చేసుకుంటుంది','pc.3':'హాట్ లీడ్స్‌ని ఆటోమేటిక్‌గా CRM కి పంపుతుంది','ph.status':'ఆన్‌లైన్ · వెంటనే రిప్లై',
 'pv.h':'ఒక్క నిమిషంలో సైట్ విజిట్ బుక్ చేసే కాల్.','pv.p':'కొత్త లీడ్ మీ Facebook ఫామ్ నింపుతుంది. 30 సెకన్లలో AI ఏజెంట్ కాల్ చేసి, క్వాలిఫై చేసి, సైట్ విజిట్ బుక్ చేస్తుంది. వాయిస్ వినడానికి పైన Sound ఆన్ చేయండి.',
 'pv.1':'30 సెకన్లలోపు కొత్త లీడ్‌కి కాల్','pv.2':'మధ్యలో ఆపినా మనిషిలా హ్యాండిల్ చేస్తుంది','pv.3':'CRM అప్‌డేట్ చేసి WhatsApp కన్ఫర్మేషన్ పంపుతుంది','pv.play':'సాంపుల్ కాల్ ప్లే చేయండి',
 'pr.h':'ప్రతి నెలా మీకు ఎంత తిరిగి వస్తుందో చూడండి.','pr.p':'మీ బిజినెస్‌కి తగ్గట్టు స్లైడర్లు కదపండి. ఆటోమేషన్ ఎన్ని గంటలు, ఎంత డబ్బు ఆదా చేస్తుందో చూపిస్తాము.',
 'pr.l1':'నెలకు లీడ్స్','pr.l2':'ఒక్కో లీడ్‌కి టీమ్ వెచ్చించే నిమిషాలు','pr.l3':'గంటకు స్టాఫ్ ఖర్చు (₹)','pr.o1':'గంటలు ఆదా / నెల','pr.o2':'ఆదా / నెల','pr.o3':'స్టాఫ్ రోజులు ఫ్రీ','pr.note':'అంచనా మాత్రమే. 70% మాన్యువల్ పని ఆటోమేట్ అవుతుందని అనుకుంటే.',
 'ab.eyebrow':'మా గురించి','ab.h1':'కష్టమైన పనులను ఆటోమేట్ చేసే స్నేహపూర్వక టీమ్.','ab.sub':'Antic Mitra చిన్న, మధ్య తరహా బిజినెస్‌లు స్టాఫ్ పెంచకుండా ఎదగడానికి AI ని సులభంగా, అర్థమయ్యేలా అందిస్తుంది.',
 'why.eyebrow':'ఈ పేరు ఎందుకు','why.h2':'కొత్త రకం టెక్నాలజీ. మీ వెంట ఉండే స్నేహితుడు.','why.a.s':'భిన్నంగా చేయడం','why.a.d':'నెమ్మదిగా సాగే మాన్యువల్ పనులు, పాత సాఫ్ట్‌వేర్‌తో మేము సరిపెట్టుకోము. మీ వర్క్‌ఫ్లోని మొదటి నుంచి ఆలోచించి, నమ్మకంగా పనిచేసే AI తో మారుస్తాము.','why.m.s':'మీ నమ్మకమైన మిత్రుడు','why.m.d':'మిత్ర అంటే స్నేహితుడు. టెక్నాలజీ కష్టంగా అనిపించకూడదు. అన్నీ మీ భాషలో వివరిస్తాము, లాంచ్ తర్వాత కూడా మీతోనే ఉంటాము.',
 'val.eyebrow':'మా పని విధానం','val.h2':'మీతో ఎలా పనిచేస్తాము','v1.t':'మీ భాషలో','v1.d':'టెక్నికల్ పదాలు లేకుండా తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో అన్నీ వివరిస్తాము.','v2.t':'మీ కోసమే తయారీ','v2.d':'టెంప్లేట్లు కాదు. ప్రతి బాట్, వర్క్‌ఫ్లో మీ బిజినెస్ నడిచే విధానానికి తగ్గట్టు డిజైన్ చేస్తాము.','v3.t':'లాంచ్ తర్వాత కూడా','v3.d':'మీ ఆటోమేషన్‌లను ప్రతి వారం మానిటర్ చేసి, సరిచేసి, మెరుగుపరుస్తాము.',
 'pro.eyebrow':'ఎలా పనిచేస్తుంది','pro.h2':'నాలుగు స్టెప్స్‌లో లైవ్.','pro.sub':'పెద్ద మీటింగ్‌లు లేవు, టెక్నికల్ పదాలు లేవు. చాలా బాట్‌లు, వాయిస్ ఏజెంట్లు 7 నుంచి 14 రోజుల్లో లైవ్ అవుతాయి.',
 'st1.t':'ఉచిత ఆడిట్','st1.d':'మీ టీమ్ ఎక్కడ ఎక్కువ టైమ్ కోల్పోతుందో 15 నిమిషాల కాల్‌లో కనుక్కుంటాము.','st2.t':'బిల్డ్ & ట్రైన్','st2.d':'మీ ప్రోడక్ట్స్, ధరలు, FAQలు, బ్రాండ్ వాయిస్‌పై AI ని ట్రైన్ చేస్తాము.','st3.t':'కనెక్ట్ & టెస్ట్','st3.d':'WhatsApp, CRM, పేమెంట్స్, యాడ్స్ కనెక్ట్ చేసి ప్రతి ఫ్లో టెస్ట్ చేస్తాము.','st4.t':'24/7 రన్','st4.d':'రాత్రింబవళ్లు పనిచేస్తుంది. ప్రతి వారం మానిటర్ చేసి మెరుగుపరుస్తాము.',
 'ct.eyebrow':'కాంటాక్ట్','ct.h1':'మీ బిజినెస్ గురించి మాట్లాడుకుందాం.','ct.sub':'ఉచిత 15 నిమిషాల AI ఆడిట్ బుక్ చేయండి. మీ టీమ్‌కి ఎక్కువ టైమ్ తీసుకునే పని ఏంటో చెప్పండి, దేన్ని ఆటోమేట్ చేయొచ్చో చూపిస్తాము.',
 'ct.form.h':'మీ ఉచిత ఆడిట్ బుక్ చేయండి','ct.name':'మీ పేరు','ct.phone':'WhatsApp నంబర్','ct.biz':'బిజినెస్ రకం','ct.svc':'మీరు ఏమి ఆటోమేట్ చేయాలనుకుంటున్నారు?','ct.msg':'ఇంకేమైనా చెప్పాలనుకుంటున్నారా?','ct.send':'ఉచిత ఆడిట్ రిక్వెస్ట్ పంపండి',
 'ct.ok.h':'రిక్వెస్ట్ అందింది!','ct.ok.p':'ధన్యవాదాలు. మీ 15 నిమిషాల ఆడిట్ టైమ్ ఫిక్స్ చేయడానికి WhatsApp లో మిమ్మల్ని సంప్రదిస్తాము.','ct.again':'మరో రిక్వెస్ట్ పంపండి',
 'ct.i.h':'తర్వాత ఏం జరుగుతుంది','ct.i1':'మీ రిక్వెస్ట్‌ని మేము చూస్తాము','ct.i2':'టైమ్ ఫిక్స్ చేయడానికి కాల్ లేదా WhatsApp చేస్తాము','ct.i3':'15 నిమిషాల్లో మీకు ఆటోమేషన్ ప్లాన్ ఇస్తాము','ct.w.h':'WhatsApp అంటే ఇష్టమా?','ct.w.p':'ఫామ్ వద్దు. నేరుగా మెసేజ్ పెట్టండి, మా టీమ్ రిప్లై ఇస్తుంది.',
 'faq.eyebrow':'ప్రశ్నలు','faq.h2':'బిజినెస్ ఓనర్లు మమ్మల్ని అడిగే ప్రశ్నలు',
 'f1.q':'WhatsApp బాట్ లేదా వాయిస్ ఏజెంట్ ఎంత త్వరగా సెటప్ అవుతుంది?','f1.a':'చాలా ప్రాజెక్ట్‌లు 7 నుంచి 14 వర్కింగ్ డేస్‌లో లైవ్ అవుతాయి. 48 గంటల్లో పనిచేసే ప్రోటోటైప్ చూపిస్తాము.',
 'f2.q':'బాట్ నా కస్టమర్లతో తెలుగులో మాట్లాడగలదా?','f2.a':'అవును. WhatsApp బాట్, వాయిస్ ఏజెంట్ రెండూ తెలుగు, హిందీ, ఇంగ్లీష్ ఇంకా చాలా భాషల్లో అర్థం చేసుకుని జవాబిస్తాయి.',
 'f3.q':'నా ప్రస్తుత CRM తో పనిచేస్తుందా?','f3.a':'అవును. HubSpot, Zoho, Salesforce, LeadSquared, Google Sheets, కస్టమ్ డేటాబేస్‌లు కనెక్ట్ చేస్తాము. CRM లేకపోతే మీకోసం సింపుల్ CRM తయారు చేస్తాము.',
 'f4.q':'Google Business Profile ఆటోమేషన్‌లో ఏమేమి ఉంటాయి?','f4.a':'ప్రతి రివ్యూకి ఆటోమేటిక్ రిప్లై, వారానికో పోస్ట్, ఆఫర్లు, ఫోటో అప్‌డేట్స్, కస్టమర్ ప్రశ్నలకు జవాబులు. మీ లిస్టింగ్ యాక్టివ్‌గా ఉండి Maps లో బెటర్ ర్యాంక్ వస్తుంది.',
 'f5.q':'ఈ సైట్‌లో సౌండ్ ఎఫెక్ట్స్ ఎలా పనిచేస్తాయి?','f5.a':'ఇవి మీ బ్రౌజర్‌లోనే Web Audio API తో తయారవుతాయి, పెద్ద ఆడియో ఫైల్స్ లేవు. సౌండ్ డిఫాల్ట్‌గా ఆఫ్‌లో ఉంటుంది; పైన ఉన్న Sound బటన్‌తో ఆన్ చేయండి.',
 'cta.eyebrow':'ఉచిత 15 నిమిషాల ఆడిట్','cta.h2':'కలిసి అసాధ్యాన్ని ఆటోమేట్ చేద్దాం.','cta.p':'మీ టీమ్ ఎక్కడ టైమ్ కోల్పోతుందో చెప్పండి. దాన్ని మ్యాప్ చేసి, మీ బిజినెస్ కోసం పనిచేసే ప్రోటోటైప్ చూపిస్తాము.',
 'rv.eyebrow':'ఎందుకు ఆటోమేట్ చేయాలి','rv.text':'మీ కస్టమర్లు అర్ధరాత్రి మెసేజ్ చేస్తారు, లంచ్ టైమ్‌లో కాల్ చేస్తారు, ఆదివారం రివ్యూ పెడతారు. ప్రతి ఒక్కరికీ జవాబిచ్చే AI ని మేము తయారు చేస్తాము, మీ టీమ్ డీల్స్ క్లోజ్ చేయడంపై దృష్టి పెట్టొచ్చు.',
 'ds.eyebrow':'మీకు ఏం వస్తుంది','ds.h2':'మీ పోటీదారులు అందుకోలేని వేగం.','ds.1':'WhatsApp రిప్లై టైమ్','ds.2':'ప్రతి కొత్త లీడ్‌కి కాల్-బ్యాక్','ds.3':'రోజుల్లో లైవ్','ds.4':'మీ బిజినెస్ జవాబిస్తూనే ఉంటుంది','dst.1':'ఇన్‌స్టంట్ రిప్లై','dst.2':'డైరెక్ట్ కాల్','dst.3':'త్వరగా లైవ్','dst.4':'ఎల్లప్పుడూ ఆన్‌లో','svc.ask':'దీని గురించి అడగండి',
 'sl1.3':'WhatsApp లోనే బుకింగ్‌లు, పేమెంట్‌లు','sl3.1':'ఆటోమేటిక్ లీడ్ స్కోరింగ్','sl3.2':'WhatsApp, SMS లో ఫాలో-అప్‌లు','sl3.3':'అన్ని లీడ్స్‌కి ఒకే డాష్‌బోర్డ్','sl4.1':'ప్రతి Google రివ్యూకి రిప్లై','sl4.2':'షెడ్యూల్ ప్రకారం YouTube Shorts','sl4.3':'ప్రతి వారం సోషల్ పోస్ట్‌లు, బ్లాగ్‌లు',
 'as.svc.h':'9 సేవలు, ఒకే పార్ట్‌నర్','as.demo.h':'3 పనిచేసే డెమోలు','as.d1':'లైవ్‌గా చాట్ చేయండి','as.d2':'సాంపుల్ సేల్స్ కాల్ వినండి','as.d3':'మీ నెలవారీ సేవింగ్స్ చూడండి',
 'as.a1':'రోజుల్లో లైవ్','as.a2':'మొదటి పనిచేసే ప్రోటోటైప్','as.a3':'ఆటోమేషన్‌లు నడుస్తూనే ఉంటాయి','as.a4':'భాషలు: తెలుగు, హిందీ, ఇంగ్లీష్',
 'as.ct.h':'ఉచిత ఆడిట్‌లో ఉండేవి','as.c1':'15 నిమిషాల కాల్','as.c1d':'మీ టీమ్ ఎక్కడ టైమ్ కోల్పోతుందో కనుక్కుంటాము','as.c2':'ఆటోమేషన్ ప్లాన్','as.c2d':'స్పష్టమైన స్టెప్స్, ఆశించిన సేవింగ్స్','as.c3':'మీ భాషలో','as.c3d':'తెలుగు, హిందీ లేదా ఇంగ్లీష్',
 'foot.p':'స్టాఫ్ పెంచకుండా ఎదగాలనుకునే బిజినెస్‌ల కోసం AI బాట్‌లు, వాయిస్ ఏజెంట్లు, CRMలు, పూర్తి మార్కెటింగ్ ఆటోమేషన్.','foot.s':'సేవలు','foot.c':'కంపెనీ'
};
const EN={};$$('[data-i18n]').forEach(el=>{EN[el.dataset.i18n]=el.textContent});
const PH_EN={};$$('[data-i18n-ph]').forEach(el=>{PH_EN[el.dataset.i18nPh]=el.placeholder});
const PH_TE={'ph.chat':'మెసేజ్ టైప్ చేయండి…','ph.name':'ఉదా. రవి కుమార్','ph.msg':'ఉదా. మాకు రోజుకు 50 ఎంక్వైరీలు వస్తాయి, అన్నింటికీ రిప్లై ఇవ్వలేకపోతున్నాం.'};
let lang='en';
function setLang(l){lang=l;document.documentElement.lang=l;const d=l==='te'?TE:EN;
  $$('[data-i18n]').forEach(el=>{const v=d[el.dataset.i18n]??EN[el.dataset.i18n];if(v!=null)el.textContent=v});
  $$('[data-i18n-ph]').forEach(el=>{const k=el.dataset.i18nPh;el.placeholder=(l==='te'&&PH_TE[k])||PH_EN[k]});
  const lb=$('#langBtn');if(lb)lb.textContent=l==='te'?'తెలుగు · EN':'EN · తెలుగు';store.set('am-lang',l);dispatchEvent(new Event('am-lang'))}
const langBtn=$('#langBtn');if(langBtn)langBtn.addEventListener('click',()=>{setLang(lang==='en'?'te':'en');S.pop()});
if(store.get('am-lang')==='te')setLang('te');

/* ---------- NAV ---------- */
const nav=$('#nav');if(nav)addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>8),{passive:true});
const burger=$('#burger'),links=$('#navLinks');
if(burger)burger.addEventListener('click',()=>{const o=links.classList.toggle('open');burger.setAttribute('aria-expanded',o)});

/* ---------- NETWORK CANVAS (hero + page headers) ---------- */
const cv=$('.net');
if(cv){const cx=cv.getContext('2d'),host=cv.parentElement;let W,H,pts=[],mouse={x:-999,y:-999},col='#6D28D9',vis=true;
  const readCol=()=>{col=getComputedStyle(document.documentElement).getPropertyValue('--violet').trim()||'#6D28D9'};
  const hexA=(h,a)=>{if(h.startsWith('#')){const n=parseInt(h.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}return h};
  function size(){const r=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);const n=Math.round(Math.min(70,W*H/16000));pts=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3}))}
  function draw(){cx.clearRect(0,0,W,H);for(const p of pts){if(!RM){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;const dx=mouse.x-p.x,dy=mouse.y-p.y;if(Math.hypot(dx,dy)<160){p.x+=dx*.004;p.y+=dy*.004}}}
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){cx.strokeStyle=hexA(col,(1-d/130)*.22);cx.lineWidth=1;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}}
    for(const p of pts){const near=Math.hypot(mouse.x-p.x,mouse.y-p.y)<160;cx.fillStyle=hexA(col,near?.7:.35);cx.beginPath();cx.arc(p.x,p.y,near?2.6:1.8,0,7);cx.fill()}}
  function loop(){if(vis)draw();if(!RM)requestAnimationFrame(loop)}
  readCol();size();loop();addEventListener('resize',size);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readCol);
  new MutationObserver(readCol).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  host.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top});
  host.addEventListener('pointerleave',()=>{mouse.x=mouse.y=-999});
  new IntersectionObserver(([e])=>{vis=e.isIntersecting}).observe(cv);
}

/* ---------- CONSOLE FEED (home) ---------- */
const feed=$('#feed');
if(feed){
  const IC={wa:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',ai:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/><circle cx="12" cy="12" r="3"/>',crm:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',call:'<path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 6v12"/>',gbp:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/>',yt:'<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',soc:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',blog:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'};
  const EVENTS=[['wa','WhatsApp','New lead · Ravi K., 2BHK enquiry'],['ai','AI Bot','Qualified · budget ₹65L, 2 months'],['crm','CRM','Deal moved → Site visit'],['call','Voice Agent','Visit booked · Sat 11:00 AM'],['gbp','Google Profile','Replied to ★★★★★ review'],['yt','YouTube','Short published · “3 home loan tips”'],['soc','Instagram','Reel scheduled · Fri 6:30 PM'],['wa','WhatsApp','Payment link paid · ₹4,999'],['blog','Blog','Article live · “Best areas in Hyderabad”'],['ai','AI Bot','Replied in Telugu · 2.1s'],['crm','CRM','Follow-up sent to 42 leads'],['call','Voice Agent','Missed call returned in 28s']];
  let ei=0,tasks=1284;const fmtT=d=>d.toTimeString().slice(0,8);
  const pushEv=(t=new Date())=>{const [k,b,s]=EVENTS[ei++%EVENTS.length];const li=document.createElement('li');li.className='ev';li.innerHTML=`<span class="ev-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg></span><div><b>${b}</b><span>${s}</span></div><time>${fmtT(t)}</time>`;feed.prepend(li);while(feed.children.length>5)feed.lastChild.remove()};
  for(let i=4;i>=0;i--)pushEv(new Date(Date.now()-i*7000));
  if(!RM)setInterval(()=>{if(document.hidden)return;pushEv();tasks+=1+Math.floor(Math.random()*3);$('#taskCount').textContent=tasks.toLocaleString('en-IN')},2200);
}

/* ---------- COUNT UP ---------- */
if(!RM)$$('[data-count]').forEach(el=>{const end=+el.dataset.count,suf=el.dataset.suf;const t0=performance.now()+300;const f=t=>{const p=Math.min(1,Math.max(0,(t-t0)/1400)),e=1-Math.pow(1-p,3);el.textContent=Math.round(end*e)+suf;if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)});

/* ---------- REVEAL (only items below the fold) ---------- */
/* simple scroll animation: blocks fade + slide up once as they enter; siblings in a row are staggered */
if(!RM&&'IntersectionObserver' in window){
  const AUTO='.sec-head,.sc-tab,.sc-stage,.reveal-sec .eyebrow,.ds-head,.ds,.card,.step,.svc-row,.faq details,.phone,.panel-copy,.tabs,.cta,.foot>div,.split-copy,.ph-card,.form-card,.info .card,.tools p';
  $$(AUTO).forEach(el=>el.classList.add('rv'));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}}),{rootMargin:'0px 0px -10% 0px'});
  $$('.rv').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight*.9){const sib=[...el.parentElement.children].filter(c=>c.classList.contains('rv'));const k=Math.max(0,sib.indexOf(el));el.classList.add('pre','rev');el.style.transitionDelay=Math.min(k,5)*90+'ms';io.observe(el)}});
  setTimeout(()=>$$('.pre').forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.remove('pre')}),2500);
}

/* scroll progress bar + back to top */
const prog=document.createElement('div');prog.className='scroll-prog';prog.setAttribute('aria-hidden','true');document.body.append(prog);
const toTop=document.createElement('button');toTop.className='to-top';toTop.setAttribute('aria-label','Back to top');toTop.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';document.body.append(toTop);
toTop.addEventListener('click',()=>{scrollTo({top:0,behavior:RM?'auto':'smooth'});S.click()});
const onProg=()=>{const h=document.documentElement.scrollHeight-innerHeight;prog.style.transform=`scaleX(${h>0?scrollY/h:0})`;toTop.classList.toggle('show',scrollY>innerHeight*.8)};
addEventListener('scroll',onProg,{passive:true});onProg();

/* ---------- SPOTLIGHT / MAGNETIC / GLOW ---------- */
const Z=()=>parseFloat(getComputedStyle(document.body).zoom)||1;
$$('.card').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),z=Z();c.style.setProperty('--mx',(e.clientX-r.left)/z+'px');c.style.setProperty('--my',(e.clientY-r.top)/z+'px')}));
if(!RM&&matchMedia('(pointer:fine)').matches){
  $$('.magnetic').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`});b.addEventListener('pointerleave',()=>b.style.transform='')});
  const g=$('#glow');if(g)addEventListener('pointermove',e=>{g.style.opacity=1;const z=Z();g.style.transform=`translate(${e.clientX/z-210}px,${e.clientY/z-210}px)`},{passive:true});
}

/* ---------- TABS (demo) ---------- */
const tabs=$$('.tab');
function showTab(t){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);$('#'+x.getAttribute('aria-controls')).hidden=!on})}
tabs.forEach(t=>t.addEventListener('click',()=>showTab(t)));
const tabFromHash=()=>{const t=tabs.find(x=>x.id==='t-'+location.hash.slice(1));if(t)showTab(t);return t};
if(tabs.length){tabFromHash();
  $$('.ph-list a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=tabs.find(x=>x.id==='t-'+a.getAttribute('href').slice(1));if(t){e.preventDefault();showTab(t);$('.tabs').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})}}));
  addEventListener('hashchange',tabFromHash)}

/* ---------- CHAT BOT ---------- */
const msgs=$('#msgs');
if(msgs){
  const R=[
   [/తెలుగు|telugu/i,'తప్పకుండా! మేము WhatsApp బాట్‌లు, AI వాయిస్ ఏజెంట్లు, కస్టమ్ CRMలు తయారు చేస్తాము. Google Business Profile, YouTube, సోషల్ మీడియా, బ్లాగ్‌లు కూడా పూర్తిగా ఆటోమేట్ చేస్తాము. మీ బిజినెస్ ఏంటి? దానికి తగ్గ డెమో చూపిస్తాను.'],
   [/price|pricing|cost|rate|ధర|రేట్/i,'Pricing depends on your workflow and volume. We start with a free 15-minute audit, then give you a fixed quote with no hidden costs. Want to book the audit?'],
   [/review|google|gbp|maps|profile/i,'For Google Business Profile we auto-reply to every review in your brand voice, post weekly updates and offers, and answer customer questions. Active profiles get more calls and direction requests from Maps.'],
   [/youtube|video|shorts/i,'YouTube automation covers scripts, AI voice-over, Shorts, titles, thumbnails and SEO tags. Videos get published on a fixed schedule while you focus on your business.'],
   [/insta|facebook|linkedin|social/i,'We create a month of posts in your brand style, schedule them at the best times, and let AI answer comments and DMs, so leads from social go straight to your CRM.'],
   [/voice|call|phone/i,'Our AI voice agent calls new leads within 30 seconds, talks naturally, handles interruptions and books meetings. Open the “Voice agent” tab above to play a sample call.'],
   [/crm|hubspot|zoho|sheet/i,'We connect HubSpot, Zoho, Salesforce, LeadSquared or Google Sheets. No CRM yet? We build a simple one with lead scoring and automatic follow-ups.'],
   [/blog|seo|article/i,'We research keywords and publish SEO articles to your website every week, with internal links, so you keep getting traffic from Google.'],
   [/audit|book|yes|sure|ok/i,'Great! Open the Contact page and fill the short form. The team will get in touch to schedule your 15-minute call.'],
   [/automate|build|do you|services|what/i,'We automate the full customer journey: WhatsApp AI bots, AI voice agents, custom CRMs, Google Business Profile, YouTube, social media, blogs and ad campaigns. Which one should I show you?'],
   [/hi|hello|hey|namaste|నమస్తే/i,'Hello! 👋 I\'m the Antic Mitra assistant. Ask me about WhatsApp bots, voice agents, Google reviews, YouTube or pricing.']
  ];
  const reply=q=>{for(const [re,a] of R)if(re.test(q))return a;return 'Good question! I can tell you about WhatsApp bots, voice agents, CRMs, Google Business Profile, YouTube, social media or pricing. Which one interests you?'};
  const addMsg=(t,me)=>{const d=document.createElement('div');d.className='msg'+(me?' me':'');d.textContent=t;msgs.append(d);msgs.scrollTop=msgs.scrollHeight};
  const ask=q=>{if(!q.trim())return;addMsg(q,true);S.send();const ty=document.createElement('div');ty.className='msg typing';ty.innerHTML='<i></i><i></i><i></i>';msgs.append(ty);msgs.scrollTop=msgs.scrollHeight;setTimeout(()=>{ty.remove();addMsg(reply(q));S.pop()},700+Math.random()*500)};
  addMsg('Hi! 👋 I\'m the Antic Mitra assistant. I can show you how a WhatsApp bot would work for your business.');
  addMsg('What would you like to automate first?');
  $('#quick').addEventListener('click',e=>{const b=e.target.closest('button');if(b)ask(b.dataset.q)});
  $('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatIn');ask(i.value);i.value=''});
}

/* ---------- VOICE DEMO ---------- */
const bars=$('#bars');
if(bars){
  for(let i=0;i<36;i++)bars.append(document.createElement('i'));
  const barEls=$$('i',bars);let speaking=false,barT,playing=false,tStart,timerI;
  const animBars=()=>barEls.forEach((b,i)=>{b.style.height=(speaking?8+Math.abs(Math.sin(Date.now()/140+i*.6))*30+Math.random()*22:6)+'px';b.style.opacity=speaking?.9:.3});
  const SCRIPT=[['a','Hi Priya, this is Maya from Sunrise Homes. You asked about our 2BHK in Kondapur a few minutes ago. Is now a good time?'],['c','Yes, but I only have a minute.'],['a','Sure, I\'ll be quick. Are you planning to move in within three months, or later?'],['c','Probably in two months.'],['a','Perfect. We have site visits this Saturday at 11 AM or 4 PM. Which works for you?'],['c','11 is fine.'],['a','Done! I\'m sending the location on WhatsApp now. See you on Saturday, Priya.'],['s','✓ CRM updated · Visit booked Sat 11:00 · WhatsApp sent']];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const say=(text,who)=>new Promise(res=>{if(!(S.on&&'speechSynthesis' in window)){setTimeout(res,Math.max(1400,text.length*55));return}const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';u.rate=1.04;u.pitch=who==='a'?1.15:.85;const vs=speechSynthesis.getVoices().filter(v=>/en/i.test(v.lang));if(vs.length)u.voice=vs[who==='a'?0:Math.min(1,vs.length-1)];let done=false;const fin=()=>{if(!done){done=true;res()}};u.onend=fin;u.onerror=fin;setTimeout(fin,text.length*120+2000);speechSynthesis.speak(u)});
  $('#playCall').addEventListener('click',async()=>{if(playing)return;playing=true;const tr=$('#transcript');tr.innerHTML='';$('#vNote').textContent=S.on?'':(lang==='te'?'వాయిస్ కోసం పైన Sound ఆన్ చేయండి':'Turn on Sound at the top to hear the voices');
    S.tone(440,.25,'sine',.04);S.tone(440,.25,'sine',.04,.35);await sleep(900);
    tStart=Date.now();timerI=setInterval(()=>{const s=Math.floor((Date.now()-tStart)/1000);$('#vTimer').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},250);
    barT=setInterval(animBars,90);
    for(const [w,t] of SCRIPT){const d=document.createElement('div');d.className='tl'+(w==='c'?' caller':w==='s'?' sys':'');if(w!=='s')d.innerHTML=`<b>${w==='a'?'AI AGENT':'CALLER'}</b>`;d.append(t);tr.append(d);tr.scrollTop=tr.scrollHeight;
      if(w==='s'){S.chime();break}speaking=true;await say(t,w);speaking=false;await sleep(350)}
    clearInterval(timerI);setTimeout(()=>{clearInterval(barT);animBars()},300);playing=false});
  animBars();
}

/* ---------- ROI ---------- */
if($('#rLeads')){
  const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
  const roi=()=>{const L=+$('#rLeads').value,M=+$('#rMins').value,C=+$('#rCost').value;$('#oLeads').textContent=L.toLocaleString('en-IN');$('#oMins').textContent=M;$('#oCost').textContent='₹'+C;const h=L*M*.7/60;$('#vHours').textContent=Math.round(h).toLocaleString('en-IN');$('#vMoney').textContent=inr(h*C);$('#vDays').textContent=Math.round(h/8).toLocaleString('en-IN')};
  let last=0;$$('.roi input').forEach(i=>i.addEventListener('input',()=>{roi();const n=performance.now();if(n-last>60){S.tone(900+(+i.value%400),.03,'sine',.015);last=n}}));roi();
}

/* ---------- PROCESS RAIL ---------- */
const stepsEl=$('#steps');
if(stepsEl){const stepEls=$$('.step'),fill=$('#railFill');
  const rail=()=>{const r=stepsEl.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.75-r.top)/(r.height+innerHeight*.25)));fill.style.width=p*100+'%';stepEls.forEach((s,i)=>s.classList.toggle('on',p>=i/4+.02))};
  addEventListener('scroll',rail,{passive:true});rail();}

/* ---------- SERVICE SHOWCASE (home): click or auto-rotate, no scroll pinning ---------- */
const sc=$('#showcase');
if(sc){
  const tabsS=$$('.sc-tab',sc),panels=$$('.sc-panel',sc);let cur=0,visible=false;
  const show=(i,user)=>{cur=i;tabsS.forEach((b,k)=>{const on=k===i;b.classList.toggle('active',on);b.setAttribute('aria-selected',on);const bar=$('.sc-bar i',b);bar.style.animation='none';void bar.offsetWidth;bar.style.animation=''});panels.forEach((p,k)=>p.classList.toggle('active',k===i));sc.classList.toggle('paused',!!user&&false);if(user)S.click()};
  tabsS.forEach((b,i)=>{b.addEventListener('click',()=>show(i,true));$('.sc-bar i',b).addEventListener('animationend',()=>{if(b.classList.contains('active'))show((i+1)%tabsS.length)})});
  sc.addEventListener('keydown',e=>{if(!e.target.classList.contains('sc-tab'))return;const d=e.key==='ArrowDown'||e.key==='ArrowRight'?1:e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();const n=(cur+d+tabsS.length)%tabsS.length;show(n,true);tabsS[n].focus()}});
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>sc.classList.toggle('offscreen',!e.isIntersecting)).observe(sc);
}

/* ---------- SCROLL TEXT REVEAL (home) ---------- */
const rvText=$('#revealText');
if(rvText){
  const HL=/^(midnight|lunch|Sunday|every|AI|అర్ధరాత్రి|లంచ్|ఆదివారం|ప్రతి|AI)/i;
  let words=[];
  const split=()=>{const t=rvText.textContent.trim();rvText.textContent='';words=t.split(/\s+/).map(w=>{const s=document.createElement('span');s.className='w'+(HL.test(w)?' hl':'');s.textContent=w+' ';rvText.append(s);return s});paint()};
  const paint=()=>{if(RM){words.forEach(w=>w.classList.add('on'));return}const r=rvText.getBoundingClientRect();const p=Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(r.height+innerHeight*.35)));const k=Math.round(p*words.length);words.forEach((w,i)=>w.classList.toggle('on',i<k))};
  split();addEventListener('scroll',paint,{passive:true});addEventListener('am-lang',split);
}

/* ---------- DARK STATS COUNT-UP (home) ---------- */
const dsEls=$$('.ds [data-to]');
if(dsEls.length&&!RM&&'IntersectionObserver' in window){
  const io2=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io2.disconnect();const t0=performance.now();
    const f=t=>{const p=Math.min(1,(t-t0)/1300),ez=1-Math.pow(1-p,3);dsEls.forEach(el=>el.textContent=Math.round(+el.dataset.to*ez));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f);S.chime()}),{threshold:.4});
  io2.observe($('.ds-grid'));
}

/* ---------- CONTACT FORM ---------- */
const form=$('#auditForm');
if(form){
  form.addEventListener('submit',async e=>{e.preventDefault();
    const fd=new FormData(form),data=Object.fromEntries(fd.entries());data.services=fd.getAll('services').join(', ');
    if(CONFIG.formEndpoint){try{await fetch(CONFIG.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})}catch(err){}}
    const okWa=$('#okWa');
    if(CONFIG.whatsapp&&okWa){okWa.hidden=false;okWa.href='https://wa.me/'+CONFIG.whatsapp+'?text='+encodeURIComponent(`Hi Antic Mitra, I'm ${data.name} (${data.business}). I'd like a free AI audit for: ${data.services||'general automation'}. ${data.message||''}`)}
    form.hidden=true;$('#formOk').hidden=false;S.chime()});
  $('#again').addEventListener('click',()=>{form.reset();form.hidden=false;$('#formOk').hidden=true});
}
})();
