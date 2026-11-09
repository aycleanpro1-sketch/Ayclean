(function () {
  'use strict';

  var WA_NUMBER = '32465380418';

  // En-tête : ombre au défilement
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Menu mobile
  var menuBtn = document.getElementById('menu-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    var setMenu = function (open) {
      mobileNav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menuBtn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(!mobileNav.classList.contains('open')); });
    mobileNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  // Apparition au défilement
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // Comparateurs avant / après
  document.querySelectorAll('.compare').forEach(function (box) {
    var range = box.querySelector('input[type="range"]');
    if (!range) return;
    var update = function () { box.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', update);
    update();
  });

  // Onglets avant / après (navigation clavier incluse)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.ba-tab'));
  var selectTab = function (tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });

  // Formulaire de devis
  var form = document.getElementById('quote-form');
  if (!form) return;

  var val = function (id) { return (document.getElementById(id).value || '').trim(); };

  var validate = function () {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (input) {
      var field = input.closest('.field');
      var valid = input.value.trim() !== '' && input.checkValidity();
      if (input.type === 'tel') valid = valid && input.value.replace(/\D/g, '').length >= 8;
      field.classList.toggle('error', !valid);
      if (!valid && ok) { input.focus(); ok = false; }
    });
    return ok;
  };

  form.querySelectorAll('.input').forEach(function (input) {
    input.addEventListener('input', function () { input.closest('.field').classList.remove('error'); });
  });

  var buildMessage = function () {
    var lines = [
      "Bonjour Ay'Clean, je souhaite un devis :",
      '- Nom : ' + val('prenom') + ' ' + val('nom'),
      '- Téléphone : ' + val('telephone'),
      '- Email : ' + val('email'),
      '- Type de logement : ' + val('type-logement'),
      '- Commune : ' + val('localisation'),
      '- Chambres : ' + val('chambres'),
      '- Fréquence : ' + val('frequence')
    ];
    if (val('message')) lines.push('- Précisions : ' + val('message'));
    return lines.join('\n');
  };

  var showMsg = function (id) {
    var el = document.getElementById(id);
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, id === 'form-success' ? 30000 : 8000);
  };

  var WEB3FORMS_KEY = '5477a320-dfa7-4234-a858-c0877fa7be68';
  var sendBtn = document.getElementById('send-btn');
  var sendLabel = sendBtn ? sendBtn.querySelector('span') : null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    if (document.getElementById('botcheck').checked) return;
    var oldLabel = sendLabel.textContent;
    sendBtn.disabled = true;
    sendLabel.textContent = 'Envoi en cours…';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: 'Demande de devis – ' + val('type-logement') + ' à ' + val('localisation'),
        from_name: "Site ayclean.be",
        name: val('prenom') + ' ' + val('nom'),
        email: val('email'),
        telephone: val('telephone'),
        type_de_logement: val('type-logement'),
        commune: val('localisation'),
        chambres: val('chambres'),
        frequence: val('frequence'),
        message: val('message') || '(aucune précision)',
        botcheck: ''
      })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.success) throw new Error(data.message || 'erreur');
      form.reset();
      showMsg('form-success');
      try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'devis-envoye', title: 'Devis envoyé', event: true }); } catch (err) {}
    }).catch(function () {
      showMsg('form-error');
    }).then(function () {
      sendBtn.disabled = false;
      sendLabel.textContent = oldLabel;
    });
  });

  var waLink = document.getElementById('send-wa');
  if (waLink) {
    waLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (!validate()) return;
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage()), '_blank', 'noopener');
      showMsg('form-success');
    });
  }
})();
