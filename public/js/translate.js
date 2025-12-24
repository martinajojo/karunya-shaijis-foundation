(function () {
  const LANG_KEY = 'preferredLang';
  const COOKIE_NAME = 'googtrans';
  const TO_ML = '/en/ml';
  const TO_EN = '/en/en';
  const btn = document.getElementById('translate-toggle');

  function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; expires=' + expires + '; SameSite=Lax';
  }

  function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts.slice(1).join('=')) : r;
    }, '');
  }

  function currentPref() {
    return localStorage.getItem(LANG_KEY) || (getCookie(COOKIE_NAME) === TO_ML ? 'ml' : 'en');
  }

  function updateButtonUI(lang) {
    if (!btn) return;
    if (lang === 'ml') {
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = '<span class="translate-label-en">Read in English</span> — <span lang="en" class="translate-label-ml">ഇംഗ്ലീഷിൽ വായിക്കുക</span>';
    } else {
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<span class="translate-label-en">Read in Malayalam</span> — <span lang="ml" class="translate-label-ml">മലയാളത്തിൽ വായിക്കുക</span>';
    }
  }

  function applyGoogleTranslate(language) {
    if (language === 'ml') {
      setCookie(COOKIE_NAME, TO_ML);
      localStorage.setItem(LANG_KEY, 'ml');
    } else {
      setCookie(COOKIE_NAME, TO_EN);
      localStorage.setItem(LANG_KEY, 'en');
    }

    window._gtReady.then(() => {
      try {
        const selectEl = document.querySelector('.goog-te-combo') || document.querySelector('.goog-te-gadget select');
        if (selectEl) {
          selectEl.value = (language === 'ml' ? 'ml' : 'en');
          selectEl.dispatchEvent(new Event('change'));
        } else {
          location.reload();
        }
      } catch (e) {
        console.warn('applyGoogleTranslate error', e);
        location.reload();
      }
    }).catch(() => {
      location.reload();
    });
  }

  function init() {
    const pref = currentPref();
    updateButtonUI(pref);
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const nowPref = currentPref();
      if (nowPref === 'ml') {
        applyGoogleTranslate('en');
        updateButtonUI('en');
      } else {
        applyGoogleTranslate('ml');
        updateButtonUI('ml');
      }
    });

    // If user had Malayalam set, ensure cookie/localStorage are aligned and re-apply
    if (currentPref() === 'ml') {
      if (getCookie(COOKIE_NAME) !== TO_ML) {
        setCookie(COOKIE_NAME, TO_ML);
      }
      applyGoogleTranslate('ml');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
