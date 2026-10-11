# Antic Mitra Website

Static multi-page website for Antic Mitra (AI automation studio).

## Pages
- `index.html` – Home
- `services.html` – Services
- `demo.html` – Live demo (WhatsApp bot, voice agent, savings calculator)
- `about.html` – About
- `contact.html` – Contact + FAQ

## Shared files
- `style.css` – all styles and brand colors
- `app.js` – animations, sound, Telugu/English toggle, demos, contact form

## Settings
Open `app.js` and edit the `CONFIG` block at the top:
- `whatsapp` – your WhatsApp number with country code, digits only (e.g. `919876543210`)
- `formEndpoint` – optional Formspree / Google Apps Script URL to receive contact form submissions

## Local Preview
Run the local server with Node.js:
```bash
node server.js
```
Then open `http://localhost:3000` in your browser.

## Deploy
No build step. Upload the folder to Vercel, Netlify or any static host.
