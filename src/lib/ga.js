// src/lib/ga.js
let loaded = false;

function loadScript(id) {
  if (loaded) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', id, {
    send_page_view: false,                // SPA tự bắn page_view
    debug_mode: import.meta.env.DEV ? true : undefined,
  });

  loaded = true;
}

export function initGA() {
  const id = import.meta.env.VITE_GA_ID;
  if (!id) return; // Dev chưa set ID thì bỏ qua
  loadScript(id);
}

export function pageview(path) {
  const id = import.meta.env.VITE_GA_ID;
  if (!id || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.origin + path,
    page_path: path,
  });
}

export function logEvent(name, params = {}) {
  const id = import.meta.env.VITE_GA_ID;
  if (!id || !window.gtag) return;
  window.gtag('event', name, params);
}

export function setUserProps(props = {}) {
  const id = import.meta.env.VITE_GA_ID;
  if (!id || !window.gtag) return;
  window.gtag('set', 'user_properties', props);
}
