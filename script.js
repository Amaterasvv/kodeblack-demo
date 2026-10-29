// ==================== Kode Black – main.js (robust) ====================
document.addEventListener("DOMContentLoaded", () => {
  // ========== HAMBURGER / OVERLAY ==========
  function toggleMenu() {
    const menu = document.getElementById("mobile-menu");
    const overlay = document.getElementById("overlay");
    if (!menu || !overlay) return;
    menu.classList.toggle("show");
    overlay.classList.toggle("show");
  }
  // expose ako ti treba na onclick=""
  window.toggleMenu = toggleMenu;

  const overlayEl = document.getElementById("overlay");
  if (overlayEl) {
    overlayEl.addEventListener("click", () => {
      const menu = document.getElementById("mobile-menu");
      if (menu) menu.classList.remove("show");
      overlayEl.classList.remove("show");
    });
  }

  // ========== NAVBAR FADE-IN ==========
  const header = document.querySelector(".navbar");
  if (header) header.style.opacity = 1;

  // ========== INTERSECTION OBSERVERS ==========
  const ioReveal = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("show")),
    { threshold: 0.1 }
  );
  document.querySelectorAll(".usluga-card, .work-item").forEach((el) => ioReveal.observe(el));

  // box / dojam-kartica s odgodom
  const boxes = document.querySelectorAll(".box");
  if (boxes.length) {
    const ioBoxes = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            ioBoxes.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    boxes.forEach((b) => ioBoxes.observe(b));
  }

  const kartice = document.querySelectorAll(".dojam-kartica");
  if (kartice.length) {
    const ioKartice = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vidljivo");
            ioKartice.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    kartice.forEach((k, i) => {
      k.style.transitionDelay = `${i * 0.15}s`;
      ioKartice.observe(k);
    });
  }

  // ========== PRIKAZ KARTICA USLUGA NA SCROLL ==========
  const cards = document.querySelectorAll(".usluge-section .usluga-card");
  function animateCards() {
    if (!cards.length) return;
    const triggerBottom = window.innerHeight * 0.85;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < triggerBottom) card.classList.add("visible");
    });
  }
  window.addEventListener("scroll", animateCards);
  animateCards();

  // ========== RANGE -> BUDŽET PRIKAZ ==========
  const sliderBudzet = document.getElementById("budzet");
  const outputBudzet = document.getElementById("budzet-value");
  if (sliderBudzet && outputBudzet) {
    const syncBudzet = () => {
      const value = parseInt(sliderBudzet.value, 10);
      outputBudzet.textContent = value >= 1500 ? "1500+" : value;
    };
    sliderBudzet.addEventListener("input", syncBudzet);
    syncBudzet();
  }

  // ========== HORIZONTALNI SLIDER (loop) ==========
  const sliderTrackWrapper = document.getElementById("sliderTrack");
  if (sliderTrackWrapper) {
    const originals = Array.from(sliderTrackWrapper.children);
    const totalSliderItems = originals.length;

    if (totalSliderItems > 0) {
      originals.forEach((card) => {
        sliderTrackWrapper.appendChild(card.cloneNode(true));
      });

      let sliderIndex = 0;
      let intervalId = null;

      const slideOnce = () => {
        const items = sliderTrackWrapper.children; // live HTMLCollection
        const current = items[sliderIndex];
        if (!current) return;

        const offset = current.offsetLeft;
        sliderTrackWrapper.style.transition = "transform 0.5s ease";
        sliderTrackWrapper.style.transform = `translateX(-${offset}px)`;

        sliderIndex++;

        if (sliderIndex >= totalSliderItems + 1) {
          setTimeout(() => {
            sliderTrackWrapper.style.transition = "none";
            sliderTrackWrapper.style.transform = "translateX(0)";
            sliderIndex = 0;
          }, 510);
        }
      };

      const start = () => {
        if (intervalId) return;
        intervalId = setInterval(slideOnce, 3000);
      };
      const stop = () => {
        if (!intervalId) return;
        clearInterval(intervalId);
        intervalId = null;
      };

      start();

      sliderTrackWrapper.addEventListener("mouseenter", stop);
      sliderTrackWrapper.addEventListener("mouseleave", start);

      window.addEventListener("resize", () => {
        sliderTrackWrapper.style.transition = "none";
        const items = sliderTrackWrapper.children;
        const current = items[Math.min(sliderIndex, items.length - 1)];
        const offset = current ? current.offsetLeft : 0;
        sliderTrackWrapper.style.transform = `translateX(-${offset}px)`;
      });
    }
  }
});



(() => {
  const form = document.querySelector('form.newsletter[data-form="newsletter"]');
  if (!form) return;

  const email = form.querySelector('input[name="email"]');
  const consent = form.querySelector('input[name="consent"]');
  const btn = form.querySelector('.nl-btn');
  const bar = form.querySelector('.form-message'); // globalna traka

  // Helpers
  const setBtnLoading = (loading) => {
    if (!btn) return;
    btn.disabled = loading;
    btn.dataset.originalText ??= btn.textContent;
    btn.textContent = loading ? 'Šaljem…' : btn.dataset.originalText;
  };

  const showBar = (type, text) => {
    if (!bar) return;
    bar.textContent = text || '';
    bar.classList.remove('success', 'error', 'show');
    if (type) bar.classList.add(type);
    bar.classList.add('show');
  };

  const hideBar = () => {
    if (!bar) return;
    bar.classList.remove('show', 'success', 'error');
    bar.textContent = '';
  };

  const clearFieldErrors = () => {
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    form.querySelectorAll('.is-invalid').forEach(n => n.classList.remove('is-invalid'));
  };

  const addFieldError = (el, msg) => {
    if (!el) return;
    el.classList.add('is-invalid');
    // Ako je checkbox unutar labela, poruku stavljamo iza tog labela,
    // inače odmah ispod inputa.
    let anchor = el;
    const labelParent = el.closest('label');
    if (labelParent) anchor = labelParent;

    const hint = document.createElement('div');
    hint.className = 'field-error';
    hint.textContent = msg;
    anchor.insertAdjacentElement('afterend', hint);
  };

  const focusFirstInvalid = () => {
    const target = form.querySelector('.is-invalid');
    if (target) target.focus({ preventScroll: false });
  };

  const validateClientSide = () => {
    // Vraća objekt s poljima koja failaju (ne prekida slanje; koristimo za 422)
    const issues = {};
    if (!email.checkValidity() || !email.value.trim()) {
      issues.email = 'Unesite valjanu adresu e-pošte.';
    }
    if (!consent.checked) {
      issues.consent = 'Potrebna je privola.';
    }
    return issues;
  };

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    hideBar();

    setBtnLoading(true);
    showBar(null, 'Šaljem…');

    try {
      const fd = new FormData(form);
      // sigurnosti radi, osiguraj da je form=newsletter
      fd.set('form', 'newsletter');
      // (opcionalno) osvježi timestamp da ne zapne na “Too fast” ako je stranica dugo otvorena
      // fd.set('ts', Math.floor(Date.now() / 1000));

      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      // 200 OK → JSON {status:"ok", message:"..."}
      if (res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const msg = data.message || 'Hvala! Uspješno ste pretplaćeni.';
        showBar('success', msg);

        // reset nakon uspjeha
        form.reset();
        clearFieldErrors();

        // auto-hide nakon ~8s
        setTimeout(() => { hideBar(); }, 8000);
        return;
      }

      // Greške po statusu
      if (res.status === 422) {
        showBar('error', 'Provjerite uneseni e-mail i potvrdite privolu.');

        const issues = validateClientSide();
        if (issues.email) addFieldError(email, issues.email);
        if (issues.consent) addFieldError(consent, issues.consent);

        focusFirstInvalid();
        return;
      }

      if (res.status === 429) {
        showBar('error', 'Prebrzo slanje. Pokušajte ponovno za par sekundi.');
        return;
      }

      if (res.status === 400 || res.status === 405) {
        showBar('error', 'Nešto nije u redu s poslanim podacima.');
        return;
      }

      // 500 i ostalo
      showBar('error', 'Greška pri prijavi. Pokušajte kasnije.');
    } catch (err) {
      showBar('error', 'Greška pri prijavi. Pokušajte kasnije.');
      console.error('[Newsletter] Network/JS error:', err);
    } finally {
      setBtnLoading(false);
    }
  });
})();    



(() => {
  // Selektiramo baš ovaj mini-upit (ne dira druge forme)
  const form = document.querySelector('form.form-mini[data-form="question"]');
  if (!form) return;

  const nameInput   = form.querySelector('input[name="ime"]');
  const emailInput  = form.querySelector('input[name="email"]');
  const qTextarea   = form.querySelector('textarea[name="pitanje"]');
  const submitBtn   = form.querySelector('button[type="submit"]');

  // Globalna traka poruke (ako ne postoji, kreiramo odmah ispod gumba)
  let bar = form.querySelector('.form-message');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'form-message';
    bar.setAttribute('aria-live','polite');
    bar.setAttribute('role','status');
    submitBtn.insertAdjacentElement('afterend', bar);
  }

  // Helpers
  const setBtnLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.dataset.originalText ??= submitBtn.textContent;
    submitBtn.textContent = loading ? 'Šaljem…' : submitBtn.dataset.originalText;
  };

  const showBar = (type, text) => {
    bar.textContent = text || '';
    bar.classList.remove('success','error','show');
    if (type) bar.classList.add(type);
    bar.classList.add('show');
  };
  const hideBar = () => {
    bar.classList.remove('show','success','error');
    bar.textContent = '';
  };

  const clearFieldErrors = () => {
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    form.querySelectorAll('.is-invalid').forEach(n => n.classList.remove('is-invalid'));
  };
  const addFieldError = (el, msg) => {
    if (!el) return;
    el.classList.add('is-invalid');
    const hint = document.createElement('div');
    hint.className = 'field-error';
    hint.textContent = msg;
    el.insertAdjacentElement('afterend', hint);
  };
  const focusFirstInvalid = () => {
    const bad = form.querySelector('.is-invalid');
    if (bad) bad.focus({ preventScroll: false });
  };

  // Minimalna client-side validacija da označimo koja su polja kriva kod 422
  const validateClientSide = () => {
    const issues = {};
    if (!nameInput.value.trim()) issues.ime = 'Unesite ime.';
    if (!emailInput.value.trim() || !emailInput.checkValidity()) issues.email = 'Unesite valjan e-mail.';
    if (!qTextarea.value.trim()) issues.pitanje = 'Napišite pitanje.';
    return issues;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    hideBar();

    setBtnLoading(true);
    showBar(null, 'Šaljem…');

    try {
      const fd = new FormData(form);
      // safety: učvrstimo tip forme
      fd.set('form', 'mini');
      // opcionalno osvježi ts ako je stranica dugo otvorena
      // fd.set('ts', Math.floor(Date.now()/1000));

      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      if (res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const msg = data.message || 'Poruka je poslana. Hvala vam!';
        showBar('success', msg);

        form.reset();
        clearFieldErrors();

        // po želji: fokus na prvo polje
        nameInput?.focus();

        // auto-hide nakon ~8s
        setTimeout(() => { hideBar(); }, 8000);
        return;
      }

      if (res.status === 422) {
        showBar('error', 'Ispunite obvezna polja.');
        const issues = validateClientSide();
        if (issues.ime) addFieldError(nameInput, issues.ime);
        if (issues.email) addFieldError(emailInput, issues.email);
        if (issues.pitanje) addFieldError(qTextarea, issues.pitanje);
        focusFirstInvalid();
        return;
      }

      if (res.status === 429) {
        showBar('error', 'Prebrzo slanje. Pokušajte ponovno za par sekundi.');
        return;
      }

      if (res.status === 400 || res.status === 405) {
        showBar('error', 'Nešto nije u redu s poslanim podacima.');
        return;
      }

      showBar('error', 'Greška pri slanju poruke. Pokušajte kasnije.');
    } catch (err) {
      console.error('[Mini upit] Network/JS error:', err);
      showBar('error', 'Greška pri slanju poruke. Pokušajte kasnije.');
    } finally {
      setBtnLoading(false);
    }
  });
})();




(() => {
  const form = document.querySelector('form.dojmovi-form[data-form="review"]');
  if (!form) return;

  const nameInput = form.querySelector('input[name="ime"]');       // opcionalno
  const textArea  = form.querySelector('textarea[name="dojam"]');  // required
  const submitBtn = form.querySelector('button[type="submit"]');
  const ratingInputs = form.querySelectorAll('input[name="rating"]');
  const starsWrap = form.querySelector('.zvjezdice');

  // Globalna traka poruke (ako ne postoji, kreiramo ispod gumba)
  let bar = form.querySelector('.form-message');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'form-message';
    bar.setAttribute('aria-live','polite');
    bar.setAttribute('role','status');
    submitBtn.insertAdjacentElement('afterend', bar);
  }

  // Helpers
  const setBtnLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.dataset.originalText ??= submitBtn.textContent;
    submitBtn.textContent = loading ? 'Šaljem…' : submitBtn.dataset.originalText;
  };
  const showBar = (type, text) => {
    bar.textContent = text || '';
    bar.classList.remove('success','error','show');
    if (type) bar.classList.add(type);
    bar.classList.add('show');
  };
  const hideBar = () => {
    bar.classList.remove('show','success','error');
    bar.textContent = '';
  };

  const clearFieldErrors = () => {
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    form.querySelectorAll('.is-invalid').forEach(n => n.classList.remove('is-invalid'));
  };
  const addFieldError = (elOrAnchor, msg) => {
    if (!elOrAnchor) return;
    // Ako je radio grupa (zvjezdice), poruku stavljamo ispod .zvjezdice
    const anchor = elOrAnchor.classList?.contains('zvjezdice') ? elOrAnchor : elOrAnchor;
    const hint = document.createElement('div');
    hint.className = 'field-error';
    hint.textContent = msg;
    anchor.insertAdjacentElement('afterend', hint);

    // Označi invalid element (za textarea) ili sve radio inputs
    if (anchor === starsWrap) {
      ratingInputs.forEach(r => r.classList.add('is-invalid'));
    } else {
      anchor.classList.add('is-invalid');
    }
  };
  const focusFirstInvalid = () => {
    const checked = form.querySelector('input[name="rating"]:checked');
    // prioritet: dojam (textarea), pa rating
    const badTextarea = !textArea.value.trim();
    const badRating = !checked;
    if (badTextarea) { textArea.focus({ preventScroll: false }); return; }
    if (badRating && starsWrap) { starsWrap.querySelector('label')?.focus({ preventScroll: false }); }
  };

  const validateClientSide = () => {
    const issues = {};
    if (!textArea.value.trim()) issues.dojam = 'Unesite dojam.';
    if (!form.querySelector('input[name="rating"]:checked')) issues.rating = 'Odaberite ocjenu.';
    return issues;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    hideBar();

    setBtnLoading(true);
    showBar(null, 'Šaljem…');

    try {
      const fd = new FormData(form);
      // safety: učvrsti tip forme
      fd.set('form', 'dojam');
      // po želji osvježi timestamp ako je tab dugo otvoren
      // fd.set('ts', Math.floor(Date.now()/1000));

      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      if (res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const msg = data.message || 'Hvala vam! Vaše mišljenje nam pomaže unaprijediti uslugu.';
        showBar('success', msg);

        // reset forme: textarea + zvjezdice (radio)
        form.reset();
        clearFieldErrors();

        // opcija fokusa nakon successa: na textarea
        textArea?.focus();

        // auto-hide ~8s
        setTimeout(() => { hideBar(); }, 8000);
        return;
      }

      if (res.status === 422) {
        showBar('error', 'Napišite poruku i odaberite ocjenu.');
        const issues = validateClientSide();
        if (issues.dojam)  addFieldError(textArea, issues.dojam);
        if (issues.rating) addFieldError(starsWrap, issues.rating);
        focusFirstInvalid();
        return;
      }

      if (res.status === 429) {
        showBar('error', 'Prebrzo slanje. Pokušajte ponovno za par sekundi.');
        return;
      }

      if (res.status === 400 || res.status === 405) {
        showBar('error', 'Nešto nije u redu s poslanim podacima.');
        return;
      }

      showBar('error', 'Greška pri slanju. Pokušajte kasnije.');
    } catch (err) {
      console.error('[Dojam] Network/JS error:', err);
      showBar('error', 'Greška pri slanju. Pokušajte kasnije.');
    } finally {
      setBtnLoading(false);
    }
  });

  // UX: makni error highlight čim korisnik počne tipkati/birati
  textArea?.addEventListener('input', () => {
    textArea.classList.remove('is-invalid');
    const fe = textArea.nextElementSibling;
    if (fe?.classList?.contains('field-error')) fe.remove();
  });
  starsWrap?.addEventListener('click', () => {
    ratingInputs.forEach(r => r.classList.remove('is-invalid'));
    const fe = starsWrap.nextElementSibling;
    if (fe?.classList?.contains('field-error')) fe.remove();
  });
})();


(() => {
  const form = document.querySelector('#kontakt-form[data-form="contact"]');
  if (!form) return;

  // Polja
  const ime       = form.querySelector('input[name="ime"]');
  const prezime   = form.querySelector('input[name="prezime"]');
  const email     = form.querySelector('input[name="email"]');
  const telefon   = form.querySelector('input[name="telefon"]');
  const djelatnost= form.querySelector('select[name="djelatnost"]');
  const firmaGrp  = form.querySelector('.radio-grupa'); // Da/Ne
  const firmaRadios = form.querySelectorAll('input[name="firma"]');
  const usluga    = form.querySelector('select[name="usluga"]');
  const poruka    = form.querySelector('textarea[name="poruka"]');
  const budzetInp = form.querySelector('#budzet');
  const budzetVal = form.querySelector('#budzet-value');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Globalna traka poruke (ako ne postoji, kreiramo na dno forme)
  let bar = form.querySelector('.form-message');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'form-message';
    bar.setAttribute('aria-live','polite');
    bar.setAttribute('role','status');
    submitBtn.insertAdjacentElement('afterend', bar);
  }

  // Budžet: live prikaz
  if (budzetInp && budzetVal) {
    const syncBudget = () => { budzetVal.textContent = budzetInp.value; };
    budzetInp.addEventListener('input', syncBudget);
    syncBudget();
  }

  // Helpers
  const setBtnLoading = (loading) => {
    submitBtn.disabled = loading;
    submitBtn.dataset.originalText ??= submitBtn.textContent;
    submitBtn.textContent = loading ? 'Šaljem…' : submitBtn.dataset.originalText;
  };

  const showBar = (type, text) => {
    bar.textContent = text || '';
    bar.classList.remove('success','error','show');
    if (type) bar.classList.add(type);
    bar.classList.add('show');
  };
  const hideBar = () => {
    bar.classList.remove('show','success','error');
    bar.textContent = '';
  };

  const clearFieldErrors = () => {
    form.querySelectorAll('.field-error').forEach(n => n.remove());
    form.querySelectorAll('.is-invalid').forEach(n => n.classList.remove('is-invalid'));
  };
  const addFieldError = (elOrAnchor, msg) => {
    if (!elOrAnchor) return;
    const hint = document.createElement('div');
    hint.className = 'field-error';
    hint.textContent = msg;

    // Ako dodajemo grešku za radio grupu (firma), ankiramo ispod grupe
    if (elOrAnchor === firmaGrp) {
      elOrAnchor.insertAdjacentElement('afterend', hint);
      firmaRadios.forEach(r => r.classList.add('is-invalid'));
    } else {
      elOrAnchor.classList.add('is-invalid');
      elOrAnchor.insertAdjacentElement('afterend', hint);
    }
  };
  const focusFirstInvalid = () => {
    const first = form.querySelector('.is-invalid');
    if (first) first.focus({ preventScroll: false });
  };

  // Client-side validacija:
  // - Backend *minimalno* traži: ime+prezime (ili barem ime?), valjan email i poruku.
  // - Na UI-ju po tvojim atributima tražimo i ostalo (telefon pattern, selecti, radio).
  const validateClientSide = () => {
    const issues = {};

    // Ime/Prezime (traženi su required u HTML-u)
    if (!ime.value.trim()) issues.ime = 'Unesite ime.';
    if (!prezime.value.trim()) issues.prezime = 'Unesite prezime.';

    // E-mail
    if (!email.value.trim() || !email.checkValidity()) {
      issues.email = 'Unesite valjan e-mail.';
    }

    // Telefon (ima pattern="^[0-9 +]{8,20}$" i required)
    if (!telefon.value.trim() || !telefon.checkValidity()) {
      issues.telefon = 'Unesite telefon (8–20 znakova, samo brojke i +).';
    }

    // Djelatnost (select required)
    if (!djelatnost.value) issues.djelatnost = 'Odaberite djelatnost.';

    // Firma (radio required)
    const firmaChecked = form.querySelector('input[name="firma"]:checked');
    if (!firmaChecked) issues.firma = 'Odaberite imate li registriranu firmu.';

    // Usluga (select required)
    if (!usluga.value) issues.usluga = 'Odaberite paket usluga.';

    // Poruka (required)
    if (!poruka.value.trim()) issues.poruka = 'Napišite poruku.';

    return issues;
  };

  // UX: čišćenje greške čim korisnik tipka/bira
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList.contains('is-invalid')) {
      t.classList.remove('is-invalid');
      const fe = t.nextElementSibling;
      if (fe?.classList?.contains('field-error')) fe.remove();
    }
  });
  firmaGrp?.addEventListener('click', () => {
    firmaRadios.forEach(r => r.classList.remove('is-invalid'));
    const fe = firmaGrp.nextElementSibling;
    if (fe?.classList?.contains('field-error')) fe.remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    hideBar();

    // Prvo lokalna validacija (bolji UX, odmah pokažemo koja polja fale)
    const issues = validateClientSide();
    if (Object.keys(issues).length) {
      showBar('error', 'Ispunite obvezna polja.');
      if (issues.ime) addFieldError(ime, issues.ime);
      if (issues.prezime) addFieldError(prezime, issues.prezime);
      if (issues.email) addFieldError(email, issues.email);
      if (issues.telefon) addFieldError(telefon, issues.telefon);
      if (issues.djelatnost) addFieldError(djelatnost, issues.djelatnost);
      if (issues.firma) addFieldError(firmaGrp, issues.firma);
      if (issues.usluga) addFieldError(usluga, issues.usluga);
      if (issues.poruka) addFieldError(poruka, issues.poruka);
      focusFirstInvalid();
      return;
    }

    setBtnLoading(true);
    showBar(null, 'Šaljem…');

    try {
      const fd = new FormData(form);
      // sigurnosti radi učvrsti form type
      fd.set('form', 'kontakt');
      // (opcionalno) osvježi ts da se izbjegne 429 ako je tab dugo otvoren
      // fd.set('ts', Math.floor(Date.now()/1000));

      const res = await fetch(form.action, {
        method: 'POST',
        body: fd,
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      if (res.ok) {
        let data = {};
        try { data = await res.json(); } catch {}
        const msg = data.message || 'Hvala! Vaša poruka je poslana. Odgovorit ćemo u najkraćem roku.';
        showBar('success', msg);

        form.reset();
        clearFieldErrors();
        // vrati fokus na prvo polje
        ime?.focus();

        // auto-hide ~8s
        setTimeout(() => { hideBar(); }, 8000);
        return;
      }

      // Backend 422 (specifično za ime+prezime+email+poruka)
      if (res.status === 422) {
        showBar('error', 'Ispunite ime, valjan e-mail i poruku.');
        // označi minimalni set koje backend traži
        if (!ime.value.trim()) addFieldError(ime, 'Unesite ime.');
        if (!prezime.value.trim()) addFieldError(prezime, 'Unesite prezime.');
        if (!email.value.trim() || !email.checkValidity()) addFieldError(email, 'Unesite valjan e-mail.');
        if (!poruka.value.trim()) addFieldError(poruka, 'Napišite poruku.');
        focusFirstInvalid();
        return;
      }

      if (res.status === 429) {
        showBar('error', 'Prebrzo slanje. Pokušajte ponovno za par sekundi.');
        return;
      }

      if (res.status === 400 || res.status === 405) {
        showBar('error', 'Nešto nije u redu s poslanim podacima.');
        return;
      }

      showBar('error', 'Došlo je do greške pri slanju. Pokušajte kasnije.');
    } catch (err) {
      console.error('[Kontakt] Network/JS error:', err);
      showBar('error', 'Došlo je do greške pri slanju. Pokušajte kasnije.');
    } finally {
      setBtnLoading(false);
    }
  });
})();

