# Antic Mitra — Production GMB API Automation Engine 🚀

ఈ ప్రొడక్షన్-లెవల్ సిస్టమ్ ద్వారా మీ క్లయింట్లు (Avani Tiger Resort, Vaiava Studios మొదలైనవి) కోసం ప్రతిరోజూ ఆటోమేటిక్‌గా బ్యాక్‌గ్రౌండ్‌లో GMB పోస్ట్‌లను అప్‌లోడ్ చేయవచ్చు.

---

## 📌 స్టెప్ 1: Google Cloud Console లో OAuth క్రెడెన్షియల్స్ పొందడం (3 నిమిషాలు)

1. **Google Cloud Console కి వెళ్ళండి:**  
   👉 [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. కొత్త ప్రాజెక్ట్ క్రియేట్ చేయండి (ఉదా: `Antic-Mitra-Automations`).
3. **APIs & Services -> Enable APIs and Services** కి వెళ్లి ఈ 2 APIs ఎనేబుల్ చేయండి:
   - `Google My Business API`
   - `My Business Account Management API`
4. **OAuth Consent Screen** సెటప్ చేయండి:
   - User Type: **External** సెలెక్ట్ చేసి "Create" క్లిక్ చేయండి.
   - App Name: `Antic Mitra Poster`
   - User Support Email: మీ ఈమెయిల్ ఇవ్వండి.
5. **Credentials -> Create Credentials -> OAuth client ID**:
   - Application Type: **Web application**
   - Name: `Antic Mitra Web Client`
   - **Authorized redirect URIs** లో ఈ కింది లింక్ జోడించండి:
     👉 `http://localhost:5000/callback`
   - "Create" కొట్టగానే మీకు **Client ID** మరియు **Client Secret** వస్తాయి!

---

## 📌 స్టెప్ 2: config.env లో వివరాలు పేస్ట్ చేయడం

[config.env](file:///c:/Users/anjiy/Downloads/Anticmitra%20Ai%20Website/gmb_automation/config.env) ఫైల్ ఓపెన్ చేసి:
```env
GOOGLE_CLIENT_ID=మీ_క్లయింట్_ఐడి_ఇక్కడ
GOOGLE_CLIENT_SECRET=మీ_క్లయింట్_సీక్రెట్_ఇక్కడ
```

---

## 📌 స్టెప్ 3: 1-టైమ్ ఆథరైజేషన్ రన్ చేయడం (Permanent Refresh Token)

టర్మినల్‌లో ఈ కమాండ్ రన్ చేయండి:
```bash
node gmb_automation/oauth_server.js
```
బ్రౌజర్‌లో [http://localhost:5000](http://localhost:5000) ఓపెన్ చేసి మీ Google Account తో **"Allow"** క్లిక్ చేయండి.  
🎉 సిస్టమ్ శాశ్వత **REFRESH_TOKEN** ను ఆటోమేటిక్‌గా `config.env` లో సేవ్ చేసుకుంటుంది!

---

## 📌 స్టెప్ 4: రోజూ ఆటోమేటిక్ పోస్టింగ్ రన్ చేయడం

మీరు కేవలం [posts_queue.json](file:///c:/Users/anjiy/Downloads/Anticmitra%20Ai%20Website/gmb_automation/posts_queue.json) లో పోస్ట్‌లు మరియు తేదీలు రాసి పెడితే చాలు:
```bash
node gmb_automation/queue_scheduler.js
```
ఇది బ్యాక్‌గ్రౌండ్‌లో రన్ అయ్యి ఆ రోజు పోస్ట్‌లను ఆటోమేటిక్‌గా GMB లో పబ్లిష్ చేస్తుంది!
