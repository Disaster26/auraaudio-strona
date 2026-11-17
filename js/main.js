/* =====================================================================
   AURA AUDIO POLSKA - skrypt strony (wspólny dla wszystkich podstron)
   Bez bibliotek i frameworków. Każda funkcja odpowiada za jedną rzecz
   i jest uruchamiana na dole pliku. Gdy jakiegoś elementu nie ma na
   podstronie, funkcja po prostu nic nie robi.

   Spis: 1. menu na telefonie   2. zgoda na filmy i mapę (baner cookies)
         3. filmy - fasada      4. galeria filmów z pliku dane/filmy.json
         5. przeciąganie rzędów myszą   6. lightbox (powiększanie zdjęć)
         7. "Zapytaj o ..." -> formularz   8. formularz (wysyłka do wyslij.php)
         9. mapa Google po zgodzie        10. rok w stopce
   ===================================================================== */

// ścieżka do katalogu głównego strony (np. "../" na podstronie) - ustawiona w <body data-korzen="...">
const KORZEN = document.body.dataset.korzen || '';

/* ---------- 1. Menu na telefonie ---------- */
function menuTelefon() {
  const przycisk = document.querySelector('.burger');
  const menu = document.getElementById('menu');
  if (!przycisk || !menu) return;
  function ustaw(otwarte) {
    menu.classList.toggle('otwarte', otwarte);
    przycisk.setAttribute('aria-expanded', String(otwarte));
    przycisk.setAttribute('aria-label', otwarte ? 'Zamknij menu' : 'Otwórz menu');
  }
  przycisk.addEventListener('click', () => ustaw(!menu.classList.contains('otwarte')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) ustaw(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ustaw(false); });
}

/* ---------- 2. Zgoda na treści zewnętrzne (YouTube, Vimeo, Mapy Google) ----------
   Strona sama nie używa cookies. Filmy i mapa ładują się dopiero po zgodzie,
   bo ich dostawcy zapisują własne pliki. Wybór pamiętamy w przeglądarce. */
const ZGODA_KLUCZ = 'aura-zgoda-media';
function czyZgoda() {
  try { return localStorage.getItem(ZGODA_KLUCZ) === 'tak'; } catch (e) { return false; }
}
function zapiszZgode(tak) {
  try { localStorage.setItem(ZGODA_KLUCZ, tak ? 'tak' : 'nie'); } catch (e) {}
  const baner = document.getElementById('cookies');
  if (baner) baner.hidden = true;
  if (tak) document.dispatchEvent(new Event('zgoda-media'));
}
function banerCookies() {
  const baner = document.getElementById('cookies');
  if (!baner) return;
  baner.querySelector('.tak').addEventListener('click', () => zapiszZgode(true));
  baner.querySelector('.nie').addEventListener('click', () => zapiszZgode(false));
  // link "Ustawienia cookies" w stopce pokazuje baner ponownie
  document.querySelectorAll('[data-cookies]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); baner.hidden = false;
  }));
}

/* ---------- 3. Filmy: fasada (okładka + odtwórz) ----------
   Prawdziwy odtwarzacz wstawiamy dopiero po kliknięciu. */
function adresOdtwarzacza(platforma, id) {
  if (platforma === 'vimeo') return 'https://player.vimeo.com/video/' + id + '?autoplay=1&dnt=1';
  return 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
}
function wlaczFilm(przycisk) {
  const iframe = document.createElement('iframe');
  iframe.src = adresOdtwarzacza(przycisk.dataset.platforma, przycisk.dataset.id);
  iframe.title = (przycisk.getAttribute('aria-label') || 'Film').replace('Odtwórz film: ', '');
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  przycisk.replaceChildren(iframe);
  przycisk.removeAttribute('aria-label');
  przycisk.style.cursor = 'default';
}
function pytanieOZgode(przycisk) {
  const rodzic = przycisk.parentElement;
  if (rodzic.querySelector('.film-zgoda')) return;
  const nazwa = przycisk.dataset.platforma === 'vimeo' ? 'Vimeo' : 'YouTube';
  const okno = document.createElement('div');
  okno.className = 'film-zgoda';
  okno.innerHTML = '<p>Film odtworzy się w odtwarzaczu ' + nazwa + ', który zapisuje własne pliki cookies. ' +
    '<a href="' + KORZEN + 'polityka-prywatnosci/">Szczegóły</a></p>' +
    '<button class="przycisk" type="button">Zgoda i odtwórz</button>';
  przycisk.after(okno);
  const btn = okno.querySelector('button');
  btn.addEventListener('click', () => { zapiszZgode(true); okno.remove(); wlaczFilm(przycisk); });
  btn.focus();
}
function fasadyFilmow() {
  document.addEventListener('click', (e) => {
    const przycisk = e.target.closest('button.film');
    if (!przycisk || przycisk.querySelector('iframe')) return;
    if (czyZgoda()) wlaczFilm(przycisk); else pytanieOZgode(przycisk);
  });
  // po zgodzie z banera znikają pytania przy filmach
  document.addEventListener('zgoda-media', () => document.querySelectorAll('.film-zgoda').forEach((o) => o.remove()));
}

/* ---------- 4. Galeria filmów z pliku dane/filmy.json ----------
   <div class="filmy-siatka" data-filmy="wszystkie|4"> - ile filmów pokazać. */
function miniatura(film) {
  if (film.miniatura) return KORZEN + film.miniatura;
  return 'https://i.ytimg.com/vi/' + film.id + '/hqdefault.jpg';   // brak własnej -> miniatura z YouTube
}
function kartaFilmu(film, ukryta, odRazu) {
  const karta = document.createElement('article');
  karta.className = 'film-karta';
  karta.hidden = ukryta;
  const przycisk = document.createElement('button');
  przycisk.type = 'button';
  przycisk.className = 'film';
  przycisk.dataset.platforma = film.platforma || 'youtube';
  przycisk.dataset.id = film.id;
  przycisk.setAttribute('aria-label', 'Odtwórz film: ' + film.tytul);
  const img = document.createElement('img');
  img.src = miniatura(film);
  img.width = 640; img.height = 360;
  img.alt = '';
  if (!odRazu) { img.loading = 'lazy'; img.decoding = 'async'; }   // pierwsze okładki od razu (bez czekania)
  const play = document.createElement('span');
  play.className = 'film-play';
  przycisk.append(img, play);
  const tytul = document.createElement('h3');
  tytul.textContent = film.tytul;
  const autor = document.createElement('p');
  autor.textContent = (film.autor || '') + (film.jezyk ? ' - ' + film.jezyk : '');
  karta.append(przycisk, tytul, autor);
  return karta;
}
function galeriaFilmow() {
  // filmy wczytujemy, gdy galeria zbliża się do ekranu
  const lista = document.querySelector('[data-filmy]');
  if (!lista) return;
  if (!('IntersectionObserver' in window)) { wczytajFilmy(lista); return; }
  const obs = new IntersectionObserver((w) => {
    if (w[0].isIntersecting) { obs.disconnect(); wczytajFilmy(lista); }
  }, { rootMargin: '600px' });
  obs.observe(lista);
}
async function wczytajFilmy(lista) {
  const limit = lista.dataset.filmy === 'wszystkie' ? Infinity : parseInt(lista.dataset.filmy, 10);
  const naStart = window.matchMedia('(max-width: 599px)').matches ? 4 : 8;
  try {
    const odp = await fetch(KORZEN + 'dane/filmy.json');
    const dane = await odp.json();
    const filmy = dane.filmy.slice(0, limit);
    const ukrywaj = limit === Infinity;
    filmy.forEach((film, i) => lista.append(kartaFilmu(film, ukrywaj && i >= naStart, ukrywaj && i < 2)));
    const wiecej = document.getElementById('filmy-wiecej');
    if (wiecej && ukrywaj && filmy.length > naStart) {
      wiecej.textContent = 'Pokaż wszystkie filmy (' + filmy.length + ')';
      wiecej.hidden = false;
      wiecej.addEventListener('click', () => {
        lista.querySelectorAll('.film-karta[hidden]').forEach((k) => { k.hidden = false; });
        wiecej.hidden = true;
      });
    }
  } catch (blad) {
    lista.innerHTML = '<p>Filmy są na kanale <a href="https://www.youtube.com/@AuraAudioOfficial/">Aura Audio na YouTube</a>.</p>';
  }
}

/* ---------- 5. Rzędy zdjęć przesuwane myszą ----------
   Palcem działa zwykłe przewijanie w poziomie, tu dokładamy przeciąganie myszą. */
function przeciaganieMysza() {
  document.querySelectorAll('.rzad').forEach((rzad) => {
    let start = 0, przewiniecie = 0, wcisniety = false, przesunieto = false;
    rzad.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      wcisniety = true; przesunieto = false;
      start = e.clientX; przewiniecie = rzad.scrollLeft;
    });
    rzad.addEventListener('pointermove', (e) => {
      if (!wcisniety) return;
      const dx = e.clientX - start;
      if (Math.abs(dx) > 5) { przesunieto = true; rzad.classList.add('ciagniety'); }
      rzad.scrollLeft = przewiniecie - dx;
    });
    const koniec = () => { wcisniety = false; rzad.classList.remove('ciagniety'); };
    rzad.addEventListener('pointerup', koniec);
    rzad.addEventListener('pointerleave', koniec);
    // po przeciągnięciu puszczenie przycisku nie otwiera zdjęcia
    rzad.addEventListener('click', (e) => { if (przesunieto) { e.preventDefault(); e.stopPropagation(); przesunieto = false; } }, true);
    rzad.addEventListener('dragstart', (e) => e.preventDefault());
  });
}

/* ---------- 6. Lightbox: kliknięte zdjęcie otwiera się w powiększeniu ----------
   Działa dla każdego <a class="galeria-link" href="duze.webp">. Zdjęcia z tej samej
   galerii (data-galeria="nazwa") można przeglądać strzałkami, klawiaturą i palcem. */
function lightbox() {
  // okno powiększenia tworzymy dopiero przy pierwszym kliknięciu (szybszy start strony)
  let okno = null, img, podpis, grupa = [], indeks = 0;
  function zbuduj() {
    okno = document.createElement('dialog');
    okno.className = 'lightbox';
    okno.setAttribute('aria-label', 'Powiększone zdjęcie');
    okno.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-btn lb-zamknij" type="button" aria-label="Zamknij">&times;</button>' +
      '<button class="lb-btn lb-poprz" type="button" aria-label="Poprzednie zdjęcie">&lsaquo;</button>' +
      '<button class="lb-btn lb-nast" type="button" aria-label="Następne zdjęcie">&rsaquo;</button>';
    document.body.append(okno);
    img = okno.querySelector('img');
    podpis = okno.querySelector('figcaption');
    okno.querySelector('.lb-zamknij').addEventListener('click', () => okno.close());
    okno.querySelector('.lb-poprz').addEventListener('click', () => pokaz(indeks - 1));
    okno.querySelector('.lb-nast').addEventListener('click', () => pokaz(indeks + 1));
    okno.addEventListener('click', (e) => { if (e.target === okno || e.target.tagName === 'FIGURE') okno.close(); });
    okno.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') pokaz(indeks - 1);
      if (e.key === 'ArrowRight') pokaz(indeks + 1);
    });
    let x0 = null;   // przesuwanie palcem
    okno.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    okno.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50 && grupa.length > 1) pokaz(indeks + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  function pokaz(i) {
    indeks = (i + grupa.length) % grupa.length;
    const a = grupa[indeks];
    const miniatura = a.querySelector('img');
    img.src = a.href;
    img.alt = miniatura ? miniatura.alt : '';
    podpis.textContent = a.dataset.podpis || (miniatura ? miniatura.alt : '');
    const wiele = grupa.length > 1;
    okno.querySelector('.lb-poprz').hidden = !wiele;
    okno.querySelector('.lb-nast').hidden = !wiele;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.galeria-link');
    if (!a || e.defaultPrevented) return;
    e.preventDefault();
    if (!okno) zbuduj();
    const nazwa = a.dataset.galeria;
    grupa = nazwa ? Array.from(document.querySelectorAll('a.galeria-link[data-galeria="' + nazwa + '"]')) : [a];
    pokaz(grupa.indexOf(a));
    okno.showModal();
  });
}

/* ---------- 7. Produkt z adresu (kontakt/?produkt=S1D) wpisuje się do formularza ---------- */
function produktZAdresu() {
  const pole = document.getElementById('f-wiadomosc');
  if (!pole) return;
  const produkt = new URLSearchParams(location.search).get('produkt');
  if (produkt && /^[\w ./+-]{1,40}$/.test(produkt)) {
    pole.value = 'Interesuje mnie: ' + produkt + '. ';
    const temat = document.getElementById('f-temat');
    if (temat) temat.value = 'Cena i dostępność';
  }
}

/* ---------- 8. Formularz ----------
   Wysyła dane do wyslij.php (PHP na serwerze home.pl), który wysyła maila
   do Aura Audio i potwierdzenie do klienta. Na wersji testowej (data-pokaz)
   tylko pokazuje komunikat. */
function formularz() {
  const f = document.getElementById('formularz');
  if (!f) return;
  const info = document.getElementById('formularz-info');
  let znacznik = null;
  // znacznik czasu (ochrona przed robotami) pobieramy przy pierwszym kontakcie z formularzem
  async function pobierzZnacznik() {
    if (znacznik || f.dataset.pokaz) return;
    try {
      const odp = await fetch(f.action + '?znacznik=1', { headers: { Accept: 'application/json' } });
      znacznik = (await odp.json()).z;
      f.querySelector('[name="_z"]').value = znacznik;
    } catch (e) {}
  }
  f.addEventListener('focusin', pobierzZnacznik, { once: true });
  function komunikat(tekst, ok) {
    info.textContent = tekst;
    info.classList.toggle('ok', !!ok);
    info.hidden = false;
  }
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    if (f.dataset.pokaz) {
      komunikat('To wersja testowa strony - formularz niczego nie wysyła. Na stronie auraaudio.pl wiadomość trafi na info@auraaudio.pl, a klient dostanie potwierdzenie na swój adres.', true);
      return;
    }
    const przycisk = f.querySelector('[type="submit"]');
    przycisk.disabled = true;
    komunikat('Wysyłanie...', true);
    try {
      await pobierzZnacznik();
      const odp = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
      const dane = await odp.json();
      komunikat(dane.komunikat, dane.success);
      if (dane.success) f.reset();
    } catch (blad) {
      komunikat('Nie udało się wysłać wiadomości. Zadzwoń: 507 037 035 albo napisz na info@auraaudio.pl.', false);
    }
    przycisk.disabled = false;
  });
}

/* ---------- 9. Mapa Google: tylko po zgodzie ---------- */
function mapa() {
  const el = document.getElementById('mapa');
  if (!el) return;
  function wstaw() {
    if (el.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = el.dataset.src;
    iframe.title = el.dataset.tytul || 'Mapa Google';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    el.replaceChildren(iframe);
  }
  const btn = el.querySelector('button');
  if (btn) btn.addEventListener('click', () => { zapiszZgode(true); wstaw(); });
  if (czyZgoda()) wstaw();
  document.addEventListener('zgoda-media', wstaw);
}

/* ---------- 10. Bieżący rok w stopce ---------- */
function rokWStopce() {
  const rok = document.getElementById('rok');
  if (rok) rok.textContent = new Date().getFullYear();
}

/* ---------- Start ----------
   Najpierw to, co potrzebne od razu; reszta, gdy przeglądarka skończy rysować stronę. */
menuTelefon();
banerCookies();
fasadyFilmow();
lightbox();
produktZAdresu();
formularz();
mapa();
const pozniej = window.requestIdleCallback || ((f) => setTimeout(f, 200));
pozniej(galeriaFilmow);
pozniej(przeciaganieMysza);
pozniej(rokWStopce);
