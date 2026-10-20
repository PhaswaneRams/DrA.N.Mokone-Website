/* ==========================================================================
   Dr A.N. Mokone — prototype behaviour (plain JavaScript)
   SETTINGS: fill these in once the practice confirms them.
   ========================================================================== */
const CONFIG = {
  practiceName: 'Dr A.N. Mokone',
  phone: '',          // as displayed, e.g. '015 123 4567'
  whatsappNumber: '', // international format, digits only, e.g. '27711234567'
  email: '',          // e.g. 'reception@example.co.za'
};

const WA_OK = /^27\d{9}$/.test(CONFIG.whatsappNumber);
const MAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(CONFIG.email);
const PHONE_DIGITS = CONFIG.phone.replace(/\D/g, '');
const TEL = /^0\d{9}$/.test(PHONE_DIGITS) ? `tel:+27${PHONE_DIGITS.slice(1)}` : '';
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* unavailable */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* unavailable */ } },
};

/* Phone number everywhere */
if (CONFIG.phone) {
  document.querySelectorAll('[data-phone]').forEach((el) => {
    el.innerHTML = TEL ? `<a href="${TEL}">${CONFIG.phone}</a>` : CONFIG.phone;
  });
}

/* Mobile menu */
(() => {
  const btn = document.querySelector('.menu-btn');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  const set = (open) => {
    nav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
  });
})();

/* Only one FAQ open at a time within a group */
document.querySelectorAll('.faq').forEach((group) => {
  group.addEventListener('toggle', (e) => {
    if (!e.target.open) return;
    group.querySelectorAll('details[open]').forEach((d) => { if (d !== e.target) d.open = false; });
  }, true);
});

/* "Request this service" remembers the service for the form */
document.querySelectorAll('a[data-reason]').forEach((a) => {
  a.addEventListener('click', () => store.set('mokone-reason', a.dataset.reason));
});

/* ---------------- Appointment request form ---------------- */
const form = document.getElementById('booking');
if (form) initForm(form);

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function niceDate(iso) {
  if (!iso) return 'No preference';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function initForm(f) {
  const date = f.elements.date;
  date.min = todayIso();
  const contact = f.elements.contact;
  const label = document.getElementById('f-contact-label');
  const hint = document.getElementById('f-contact-hint');

  const saved = store.get('mokone-reason');
  if (saved) {
    const opt = Array.from(f.elements.reason.options).find((o) => o.text === saved);
    if (opt) f.elements.reason.value = opt.value || opt.text;
    store.del('mokone-reason');
  }

  // Buttons depend on what the practice has set up
  const actions = document.getElementById('actions');
  if (WA_OK || MAIL_OK) {
    actions.innerHTML = '';
    if (WA_OK) actions.insertAdjacentHTML('beforeend', '<button class="btn btn-primary" type="submit" data-channel="whatsapp">Send via WhatsApp</button>');
    if (MAIL_OK) actions.insertAdjacentHTML('beforeend', `<button class="btn ${WA_OK ? 'btn-ghost' : 'btn-primary'}" type="submit" data-channel="email">Send via email</button>`);
    f.querySelector('[data-config-note]').hidden = true;
  }

  f.querySelectorAll('input[name="method"]').forEach((r) => r.addEventListener('change', () => {
    clear('contact');
    contact.value = '';
    if (r.value === 'email') {
      contact.type = 'email'; contact.autocomplete = 'email'; contact.inputMode = 'email';
      label.textContent = 'Your email address'; hint.hidden = true;
    } else {
      contact.type = 'tel'; contact.autocomplete = 'tel'; contact.inputMode = 'tel';
      label.textContent = r.value === 'whatsapp' ? 'Your WhatsApp number' : 'Your phone number'; hint.hidden = false;
    }
  }));
  f.addEventListener('input', (e) => clear(e.target.name));
  f.addEventListener('change', (e) => clear(e.target.name));

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = {
      name: f.elements.name.value.trim(),
      method: f.querySelector('input[name="method"]:checked').value,
      contact: contact.value.trim(),
      date: date.value,
      time: f.elements.time.value,
      reason: f.elements.reason.value,
      message: f.elements.message.value.trim(),
    };
    const errs = {};
    if (v.name.length < 2) errs.name = 'Please enter your name.';
    if (v.method === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.contact)) errs.contact = 'Please enter a valid email address.';
    } else if (!/^(0\d{9}|27\d{9})$/.test(v.contact.replace(/\D/g, ''))) {
      errs.contact = 'Please enter a 10-digit phone number, for example 071 234 5678.';
    }
    if (!v.reason) errs.reason = 'Please choose a reason. You can pick “I would rather discuss it with the doctor”.';
    if (v.reason === 'Other' && !v.message) errs.message = 'Please add a short note about your visit.';
    if (v.date && v.date < todayIso()) errs.date = 'Please choose today or a later date.';
    showErrors(f, errs);
    if (Object.keys(errs).length) return;
    const channel = (e.submitter && e.submitter.dataset.channel) || 'copy';
    showDone(f, v, channel);
  });
}

function clear(name) {
  if (!name || !form) return;
  const el = form.elements[name];
  const err = document.getElementById(`err-${name}`);
  if (err) err.remove();
  if (el && el.removeAttribute) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  const alert = form.querySelector('.alert');
  if (alert && !form.querySelector('.error')) alert.remove();
}

function showErrors(f, errs) {
  f.querySelectorAll('.error, .alert').forEach((n) => n.remove());
  f.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
  const keys = Object.keys(errs);
  if (!keys.length) return;
  f.insertAdjacentHTML('afterbegin', `<p class="alert" role="alert">Please fix ${keys.length === 1 ? 'the highlighted field' : `the ${keys.length} highlighted fields`}.</p>`);
  keys.forEach((k) => {
    const el = f.elements[k];
    const p = document.createElement('p');
    p.className = 'error'; p.id = `err-${k}`; p.textContent = errs[k];
    el.after(p);
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', p.id);
  });
  f.elements[keys[0]].focus();
}

function showDone(f, v, channel) {
  const how = v.method === 'email' ? `Email — ${v.contact}` : `${v.method === 'whatsapp' ? 'WhatsApp' : 'Phone call'} — ${v.contact}`;
  const lines = [
    `Hello ${CONFIG.practiceName}'s practice. I would like to request an appointment.`,
    '',
    `Name: ${v.name}`,
    `Preferred date: ${niceDate(v.date)}`,
    `Preferred time: ${v.time || 'No preference'}`,
    `Reason: ${v.reason}`,
    `Please contact me by: ${how}`,
  ];
  if (v.message) lines.push(`Message: ${v.message}`);
  lines.push('', 'Please let me know an available time. Thank you.');
  const text = lines.join('\n');

  let url = '';
  let title = 'Your request is ready to send';
  let intro = 'Copy the message below and send it to the practice.';
  if (channel === 'whatsapp') {
    url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
    title = 'Your WhatsApp message is ready';
    intro = 'Tap <b>Open WhatsApp</b>, check the message and press send.';
  } else if (channel === 'email') {
    url = `mailto:${CONFIG.email}?subject=${encodeURIComponent(`Appointment request — ${CONFIG.practiceName}`)}&body=${encodeURIComponent(text)}`;
    title = 'Your email is ready';
    intro = 'Tap <b>Open email</b>, check the message and press send.';
  }

  const box = document.createElement('div');
  box.className = 'done';
  box.setAttribute('role', 'status');
  box.innerHTML = `
    <h2 tabindex="-1" style="font-size:1.5rem">${title}</h2>
    <p>${intro}</p>
    <p class="warn">Your appointment is not booked yet. The practice will contact you to confirm a time.</p>
    <label for="copy-text"><b>Your message</b></label>
    <textarea class="copy" id="copy-text" readonly>${esc(text)}</textarea>
    <div class="btn-row">
      ${url ? `<a class="btn btn-primary" href="${url}"${channel === 'whatsapp' ? ' target="_blank" rel="noopener noreferrer"' : ''}>${channel === 'whatsapp' ? 'Open WhatsApp' : 'Open email'}</a>` : ''}
      <button class="btn ${url ? 'btn-ghost' : 'btn-primary'}" type="button" data-copy>Copy message</button>
      ${TEL ? `<a class="btn btn-ghost" href="${TEL}">Call ${CONFIG.phone}</a>` : ''}
      <button class="btn btn-ghost" type="button" data-again>Start again</button>
    </div>
    <p class="hint" data-status aria-live="polite"></p>`;
  f.hidden = true;
  f.after(box);
  box.querySelector('h2').focus();

  const ta = box.querySelector('textarea');
  const status = box.querySelector('[data-status]');
  box.querySelector('[data-copy]').addEventListener('click', () => {
    const fallback = () => { ta.focus(); ta.select(); status.textContent = 'Text selected. Press Ctrl+C, or long-press and choose Copy.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(() => { status.textContent = 'Copied.'; }, fallback);
    } else fallback();
  });
  box.querySelector('[data-again]').addEventListener('click', () => {
    box.remove();
    f.hidden = false;
    f.elements.name.focus();
  });
}
