# Dr A.N. Mokone: website prototype (HTML + CSS)

These are plain HTML pages with one stylesheet and one small script. There is no build step: upload the folder to any host. For a quick public link, drag the folder onto https://app.netlify.com/drop.

## Pages
- `index.html` (Home)
- `services.html` (all nine services)
- `about.html`
- `contact.html` (appointment request form)
- `privacy.html` (POPIA template)

## Settings (top of `site.js`)
```js
phone: '015 123 4567',          // shown everywhere and becomes a tap-to-call link
whatsappNumber: '27711234567',  // turns on "Send via WhatsApp"
email: 'reception@example.co.za'// turns on "Send via email"
```
Until these are set, the form prepares the request for the patient to copy.

## Still needed from the practice
- Phone number, WhatsApp number and email
- Practice address (and a map pin)
- Consulting hours
- Whether walk-ins are seen
- Medical aid and fee information, if it should be published
- A short introduction for the About page, plus a photo, if wanted
- Information Officer name for the privacy policy
- Confirm the qualification reads "MBChB (MEDUNSA)"

Remove the yellow "Website prototype for review" bar (`<div class="proto">`) once the client approves.
