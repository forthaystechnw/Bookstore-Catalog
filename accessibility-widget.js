/*!
 * Tech Tigers Accessibility Widget
 * Drop-in, dependency-free accessibility toolbar.
 * Usage: add a script tag referencing this file with the defer attribute,
 * placed right before the closing body tag of the page.
 * Safe to include on multiple pages — settings persist across the site via localStorage
 * (with an in-memory fallback if storage is unavailable, e.g. private browsing).
 */
(function () {
  "use strict";

  if (window.__tigerAccessWidgetLoaded) return; // prevent double-init if script is included twice
  window.__tigerAccessWidgetLoaded = true;

  var STORAGE_KEY = "tigerAccessWidgetPrefs_v1";
  var GOLD = "#fbbe00";

  var defaults = {
    textScale: 100, // 80–200, step 10
    lineSpacing: "normal", // normal | relaxed | loose
    letterSpacing: "normal", // normal | wide | wider
    dyslexiaFont: false,
    mode: "default", // default | dark | highcontrast
    grayscale: false,
    underlineLinks: false,
    highlightLinks: false,
    bigCursor: false,
    pauseAnimations: false
  };

  // ---------- Storage (with safe fallback) ----------
  var memoryFallback = {};
  var storageAvailable = (function () {
    try {
      var k = "__tiger_access_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function loadPrefs() {
    var raw = null;
    try {
      raw = storageAvailable
        ? window.localStorage.getItem(STORAGE_KEY)
        : memoryFallback[STORAGE_KEY];
    } catch (e) {
      raw = null;
    }
    if (!raw) return Object.assign({}, defaults);
    try {
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed);
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function savePrefs(state) {
    var raw = JSON.stringify(state);
    try {
      if (storageAvailable) {
        window.localStorage.setItem(STORAGE_KEY, raw);
      } else {
        memoryFallback[STORAGE_KEY] = raw;
      }
    } catch (e) {
      memoryFallback[STORAGE_KEY] = raw;
    }
  }

  var state = loadPrefs();

  // ---------- Styles ----------
  // Loads Atkinson Hyperlegible (open-license, purpose-built for low-vision readability)
  // only when the "Readable font" option is actually turned on, so there's no extra
  // network request for visitors who never open the panel.
  function ensureReadableFontLoaded() {
    if (document.getElementById("tiger-access-readable-font-link")) return;
    var link = document.createElement("link");
    link.id = "tiger-access-readable-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap";
    document.head.appendChild(link);
  }

  var styleEl = document.createElement("style");
  styleEl.id = "tiger-access-widget-styles";
  styleEl.textContent =
    /* Exclude the widget itself from every site-wide override below using
       :not(.tiger-access-widget):not(.tiger-access-widget *) so the panel always stays readable
       no matter what combination of modes a visitor turns on. */
    "" +
    ".tiger-access-widget,.tiger-access-widget *{box-sizing:border-box;}" +
    ".tiger-access-widget{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:'Barlow',Arial,sans-serif;font-size:16px;line-height:1.4;letter-spacing:normal;}" +

    /* Toggle button with a small tiger-stripe ring as the signature touch */
    ".tiger-access-toggle-btn{position:relative;width:56px;height:56px;border-radius:50%;border:none;" +
    "background:#000;color:" + GOLD + ";cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.35);padding:0;}" +
    ".tiger-access-toggle-btn::before{content:'';position:absolute;inset:-5px;border-radius:50%;" +
    "background:repeating-conic-gradient(" + GOLD + " 0deg 18deg,#000 18deg 36deg);" +
    "-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 4px));" +
    "mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 4px));}" +
    ".tiger-access-toggle-btn svg{width:30px;height:30px;position:relative;z-index:1;}" +
    ".tiger-access-toggle-btn:hover{background:#1a1a1a;}" +
    ".tiger-access-toggle-btn:focus-visible{outline:3px solid " + GOLD + ";outline-offset:3px;}" +

    /* Panel */
    ".tiger-access-panel{position:fixed;bottom:0;right:0;height:100%;width:340px;max-width:92vw;z-index:2;" +
    "background:#fff;color:#111;box-shadow:2px 0 24px rgba(0,0,0,.3);" +
    "transform:translateX(110%);transition:transform .25s ease;overflow-y:auto;" +
    "border-left:6px solid " + GOLD + ";}" +
    ".tiger-access-panel.tiger-access-open{transform:translateX(0);}" +
    ".tiger-access-panel-head{background:#000;color:#fff;padding:18px 16px;display:flex;" +
    "align-items:center;justify-content:space-between;position:sticky;top:0;z-index:1;}" +
    ".tiger-access-panel-head h2{margin:0;font-family:'Barlow Condensed',Arial,sans-serif;" +
    "font-size:20px;letter-spacing:.04em;text-transform:uppercase;font-weight:700;}" +
    ".tiger-access-close-btn{background:transparent;border:2px solid transparent;color:#fff;" +
    "width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;}" +
    ".tiger-access-close-btn:hover{background:rgba(255,255,255,.12);}" +
    ".tiger-access-close-btn:focus-visible{outline:2px solid " + GOLD + ";outline-offset:2px;}" +

    ".tiger-access-section{padding:16px;border-bottom:1px solid #eee;}" +
    ".tiger-access-eyebrow{font-family:'Barlow Condensed',Arial,sans-serif;font-size:13px;" +
    "letter-spacing:.12em;text-transform:uppercase;color:#444;font-weight:700;margin:0 0 10px;" +
    "border-left:4px solid " + GOLD + ";padding-left:8px;}" +

    ".tiger-access-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}" +
    ".tiger-access-row:last-child{margin-bottom:0;}" +
    ".tiger-access-label{font-size:14px;font-weight:600;}" +

    ".tiger-access-stepper{display:flex;align-items:center;gap:6px;}" +
    ".tiger-access-step-btn{width:32px;height:32px;border-radius:6px;border:2px solid #000;" +
    "background:#fff;color:#000;font-weight:700;font-size:14px;cursor:pointer;}" +
    ".tiger-access-step-btn:hover{background:#000;color:" + GOLD + ";}" +
    ".tiger-access-step-btn:focus-visible{outline:3px solid " + GOLD + ";outline-offset:2px;}" +
    ".tiger-access-step-readout{min-width:42px;text-align:center;font-size:13px;font-weight:700;}" +

    ".tiger-access-group{display:flex;gap:6px;flex-wrap:wrap;}" +
    ".tiger-access-pill{border:2px solid #000;background:#fff;color:#000;border-radius:999px;" +
    "padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;text-transform:uppercase;" +
    "letter-spacing:.03em;}" +
    ".tiger-access-pill[aria-checked='true'],.tiger-access-pill[aria-pressed='true']{background:#000;color:" + GOLD + ";}" +
    ".tiger-access-pill:focus-visible{outline:3px solid " + GOLD + ";outline-offset:2px;}" +

    ".tiger-access-switch{position:relative;width:44px;height:24px;border-radius:999px;border:2px solid #000;" +
    "background:#fff;cursor:pointer;padding:0;flex:none;}" +
    ".tiger-access-switch::after{content:'';position:absolute;top:1px;left:1px;width:16px;height:16px;" +
    "border-radius:50%;background:#000;transition:transform .15s ease;}" +
    ".tiger-access-switch[aria-pressed='true']{background:" + GOLD + ";}" +
    ".tiger-access-switch[aria-pressed='true']::after{transform:translateX(18px);}" +
    ".tiger-access-switch:focus-visible{outline:3px solid " + GOLD + ";outline-offset:2px;}" +

    ".tiger-access-footer{padding:16px;}" +
    ".tiger-access-reset-btn{width:100%;background:#fff;border:2px solid #000;color:#000;" +
    "font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:10px;" +
    "border-radius:6px;cursor:pointer;font-size:13px;}" +
    ".tiger-access-reset-btn:hover{background:#000;color:" + GOLD + ";}" +
    ".tiger-access-reset-btn:focus-visible{outline:3px solid " + GOLD + ";outline-offset:2px;}" +
    ".tiger-access-footnote{margin:10px 0 0;font-size:11px;color:#666;line-height:1.4;}" +

    ".tiger-access-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:1;" +
    "opacity:0;pointer-events:none;transition:opacity .2s ease;}" +
    ".tiger-access-overlay.tiger-access-open{opacity:1;pointer-events:auto;}" +

    "@media (max-width:480px){.tiger-access-widget{right:12px;bottom:12px;}.tiger-access-toggle-btn{width:50px;height:50px;}}" +

    /* ---------------- Site-wide effects (always exclude the widget) ---------------- */

    "html.tiger-access-mode-dark *:not(.tiger-access-widget):not(.tiger-access-widget *){" +
    "background-color:#1a1a1a !important;color:#e9e9e9 !important;border-color:#444 !important;}" +
    "html.tiger-access-mode-dark a:not(.tiger-access-widget *){color:#ffce3a !important;}" +
    "html.tiger-access-mode-dark img:not(.tiger-access-widget img),html.tiger-access-mode-dark svg:not(.tiger-access-widget svg)" +
    "{opacity:.92;}" +

    "html.tiger-access-mode-highcontrast *:not(.tiger-access-widget):not(.tiger-access-widget *){" +
    "background-color:#000 !important;color:#fff !important;border-color:#fff !important;}" +
    "html.tiger-access-mode-highcontrast a:not(.tiger-access-widget *){color:#ffd400 !important;" +
    "text-decoration:underline !important;}" +
    "html.tiger-access-mode-highcontrast img:not(.tiger-access-widget img),html.tiger-access-mode-highcontrast svg:not(.tiger-access-widget svg)" +
    "{filter:grayscale(1) contrast(1.2);}" +
    "html.tiger-access-mode-highcontrast button:not(.tiger-access-widget button)," +
    "html.tiger-access-mode-highcontrast input:not(.tiger-access-widget input)," +
    "html.tiger-access-mode-highcontrast select:not(.tiger-access-widget select)," +
    "html.tiger-access-mode-highcontrast textarea{border:2px solid #fff !important;}" +

    "html.tiger-access-grayscale *:not(html):not(body):not(.tiger-access-widget):not(.tiger-access-widget *){filter:grayscale(1) !important;}" +

    "html.tiger-access-line-relaxed *:not(.tiger-access-widget):not(.tiger-access-widget *){line-height:1.6 !important;}" +
    "html.tiger-access-line-loose *:not(.tiger-access-widget):not(.tiger-access-widget *){line-height:2 !important;}" +

    "html.tiger-access-letter-wide *:not(.tiger-access-widget):not(.tiger-access-widget *){letter-spacing:.04em !important;}" +
    "html.tiger-access-letter-wider *:not(.tiger-access-widget):not(.tiger-access-widget *){letter-spacing:.09em !important;}" +

    "html.tiger-access-dyslexia-font *:not(.tiger-access-widget):not(.tiger-access-widget *){" +
    "font-family:'Atkinson Hyperlegible',Verdana,Arial,sans-serif !important;}" +

    "html.tiger-access-underline-links a:not(.tiger-access-widget *){text-decoration:underline !important;" +
    "text-decoration-thickness:2px !important;}" +

    "html.tiger-access-highlight-links a:not(.tiger-access-widget *){background-color:#fff3b0 !important;" +
    "color:#000 !important;outline:1px solid #000 !important;padding:0 2px !important;}" +

    "html.tiger-access-pause-animations *:not(.tiger-access-widget):not(.tiger-access-widget *)," +
    "html.tiger-access-pause-animations *:not(.tiger-access-widget):not(.tiger-access-widget *)::before," +
    "html.tiger-access-pause-animations *:not(.tiger-access-widget):not(.tiger-access-widget *)::after{" +
    "animation:none !important;transition:none !important;scroll-behavior:auto !important;}" +

    "html.tiger-access-big-cursor *:not(.tiger-access-widget):not(.tiger-access-widget *){" +
    "cursor:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 32 32'><path d='M4 2 L4 28 L11 21 L16 30 L20 28 L15 19 L26 19 Z' fill='black' stroke='white' stroke-width='2'/></svg>\") 4 4,auto !important;}";

  document.head.appendChild(styleEl);

  // ---------- Icon ----------
  var ICON_SVG =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.6"/>' +
    '<circle cx="12" cy="7.2" r="1.8" fill="currentColor"/>' +
    '<path d="M6.2 9.6c1.9.9 3.8 1.35 5.8 1.35s3.9-.45 5.8-1.35" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M12 11v3.2l-2.4 5.4M12 14.2 14.4 19.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  // ---------- Build DOM ----------
  var root = document.createElement("div");
  root.className = "tiger-access-widget";
  root.innerHTML =
    '<div class="tiger-access-overlay" id="tigerAccessOverlay"></div>' +
    '<button type="button" class="tiger-access-toggle-btn" id="tigerAccessToggleBtn" ' +
    'aria-haspopup="dialog" aria-expanded="false" aria-controls="tigerAccessPanel" ' +
    'aria-label="Open accessibility settings">' +
    ICON_SVG +
    "</button>" +
    '<div class="tiger-access-panel" id="tigerAccessPanel" role="dialog" aria-modal="true" ' +
    'aria-labelledby="tigerAccessPanelTitle" tabindex="-1">' +
    '<div class="tiger-access-panel-head">' +
    '<h2 id="tigerAccessPanelTitle">Accessibility</h2>' +
    '<button type="button" class="tiger-access-close-btn" id="tigerAccessCloseBtn" aria-label="Close accessibility settings">&#10005;</button>' +
    "</div>" +

    '<div class="tiger-access-section">' +
    '<p class="tiger-access-eyebrow">Text</p>' +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessTextSizeLabel">Text size</span>' +
    '<div class="tiger-access-stepper">' +
    '<button type="button" class="tiger-access-step-btn" id="tigerAccessTextDec" aria-label="Decrease text size">&minus;</button>' +
    '<span class="tiger-access-step-readout" id="tigerAccessTextReadout" aria-live="polite">100%</span>' +
    '<button type="button" class="tiger-access-step-btn" id="tigerAccessTextInc" aria-label="Increase text size">+</button>' +
    "</div></div>" +

    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessLineLabel">Line spacing</span>' +
    '<div class="tiger-access-group" role="radiogroup" aria-labelledby="tigerAccessLineLabel" id="tigerAccessLineGroup">' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="normal">Normal</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="relaxed">Relaxed</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="loose">Loose</button>' +
    "</div></div>" +

    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessLetterLabel">Letter spacing</span>' +
    '<div class="tiger-access-group" role="radiogroup" aria-labelledby="tigerAccessLetterLabel" id="tigerAccessLetterGroup">' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="normal">Normal</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="wide">Wide</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="wider">Wider</button>' +
    "</div></div>" +

    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessDyslexiaLabel">Readable font</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessDyslexia" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessDyslexiaLabel"></button>' +
    "</div>" +
    "</div>" +

    '<div class="tiger-access-section">' +
    '<p class="tiger-access-eyebrow">Color &amp; contrast</p>' +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessModeLabel">Display mode</span>' +
    '<div class="tiger-access-group" role="radiogroup" aria-labelledby="tigerAccessModeLabel" id="tigerAccessModeGroup">' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="default">Default</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="dark">Dark</button>' +
    '<button type="button" class="tiger-access-pill" role="radio" data-value="highcontrast">High contrast</button>' +
    "</div></div>" +

    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessGrayscaleLabel">Grayscale</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessGrayscale" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessGrayscaleLabel"></button>' +
    "</div>" +
    "</div>" +

    '<div class="tiger-access-section">' +
    '<p class="tiger-access-eyebrow">Links</p>' +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessUnderlineLabel">Underline links</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessUnderline" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessUnderlineLabel"></button>' +
    "</div>" +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessHighlightLabel">Highlight links</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessHighlight" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessHighlightLabel"></button>' +
    "</div>" +
    "</div>" +

    '<div class="tiger-access-section">' +
    '<p class="tiger-access-eyebrow">Pointer &amp; motion</p>' +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessCursorLabel">Large cursor</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessCursor" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessCursorLabel"></button>' +
    "</div>" +
    '<div class="tiger-access-row">' +
    '<span class="tiger-access-label" id="tigerAccessPauseLabel">Stop animations</span>' +
    '<button type="button" class="tiger-access-switch" id="tigerAccessPause" role="switch" ' +
    'aria-pressed="false" aria-labelledby="tigerAccessPauseLabel"></button>' +
    "</div>" +
    "</div>" +

    '<div class="tiger-access-footer">' +
    '<button type="button" class="tiger-access-reset-btn" id="tigerAccessReset">Reset all settings</button>' +
    '<p class="tiger-access-footnote">Your choices are saved on this device and apply across the catalog and admin pages.</p>' +
    "</div>" +
    "</div>";

  document.body.appendChild(root);

  // ---------- Element refs ----------
  var toggleBtn = root.querySelector("#tigerAccessToggleBtn");
  var panel = root.querySelector("#tigerAccessPanel");
  var overlay = root.querySelector("#tigerAccessOverlay");
  var closeBtn = root.querySelector("#tigerAccessCloseBtn");
  var textReadout = root.querySelector("#tigerAccessTextReadout");
  var textDec = root.querySelector("#tigerAccessTextDec");
  var textInc = root.querySelector("#tigerAccessTextInc");
  var lineGroup = root.querySelector("#tigerAccessLineGroup");
  var letterGroup = root.querySelector("#tigerAccessLetterGroup");
  var modeGroup = root.querySelector("#tigerAccessModeGroup");
  var dyslexiaSwitch = root.querySelector("#tigerAccessDyslexia");
  var grayscaleSwitch = root.querySelector("#tigerAccessGrayscale");
  var underlineSwitch = root.querySelector("#tigerAccessUnderline");
  var highlightSwitch = root.querySelector("#tigerAccessHighlight");
  var cursorSwitch = root.querySelector("#tigerAccessCursor");
  var pauseSwitch = root.querySelector("#tigerAccessPause");
  var resetBtn = root.querySelector("#tigerAccessReset");

  // ---------- Apply state to the page ----------
  var html = document.documentElement;

  function setClass(name, on) {
    html.classList.toggle(name, !!on);
  }

  function render() {
    html.style.fontSize = state.textScale + "%";
    textReadout.textContent = state.textScale + "%";

    setClass("tiger-access-line-relaxed", state.lineSpacing === "relaxed");
    setClass("tiger-access-line-loose", state.lineSpacing === "loose");

    setClass("tiger-access-letter-wide", state.letterSpacing === "wide");
    setClass("tiger-access-letter-wider", state.letterSpacing === "wider");

    setClass("tiger-access-dyslexia-font", state.dyslexiaFont);
    if (state.dyslexiaFont) ensureReadableFontLoaded();

    setClass("tiger-access-mode-dark", state.mode === "dark");
    setClass("tiger-access-mode-highcontrast", state.mode === "highcontrast");

    setClass("tiger-access-grayscale", state.grayscale);
    setClass("tiger-access-underline-links", state.underlineLinks);
    setClass("tiger-access-highlight-links", state.highlightLinks);
    setClass("tiger-access-big-cursor", state.bigCursor);
    setClass("tiger-access-pause-animations", state.pauseAnimations);

    updateGroup(lineGroup, state.lineSpacing);
    updateGroup(letterGroup, state.letterSpacing);
    updateGroup(modeGroup, state.mode);
    dyslexiaSwitch.setAttribute("aria-pressed", String(state.dyslexiaFont));
    grayscaleSwitch.setAttribute("aria-pressed", String(state.grayscale));
    underlineSwitch.setAttribute("aria-pressed", String(state.underlineLinks));
    highlightSwitch.setAttribute("aria-pressed", String(state.highlightLinks));
    cursorSwitch.setAttribute("aria-pressed", String(state.bigCursor));
    pauseSwitch.setAttribute("aria-pressed", String(state.pauseAnimations));
  }

  function updateGroup(groupEl, value) {
    var btns = groupEl.querySelectorAll(".tiger-access-pill");
    for (var i = 0; i < btns.length; i++) {
      var match = btns[i].getAttribute("data-value") === value;
      btns[i].setAttribute("aria-checked", String(match));
    }
  }

  function update(partial) {
    Object.assign(state, partial);
    savePrefs(state);
    render();
  }

  // ---------- Wire up controls ----------
  textDec.addEventListener("click", function () {
    update({ textScale: Math.max(80, state.textScale - 10) });
  });
  textInc.addEventListener("click", function () {
    update({ textScale: Math.min(200, state.textScale + 10) });
  });

  function wireGroup(groupEl, key) {
    groupEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".tiger-access-pill");
      if (!btn) return;
      var obj = {};
      obj[key] = btn.getAttribute("data-value");
      update(obj);
    });
  }
  wireGroup(lineGroup, "lineSpacing");
  wireGroup(letterGroup, "letterSpacing");
  wireGroup(modeGroup, "mode");

  function wireSwitch(el, key) {
    el.addEventListener("click", function () {
      var obj = {};
      obj[key] = !state[key];
      update(obj);
    });
  }
  wireSwitch(dyslexiaSwitch, "dyslexiaFont");
  wireSwitch(grayscaleSwitch, "grayscale");
  wireSwitch(underlineSwitch, "underlineLinks");
  wireSwitch(highlightSwitch, "highlightLinks");
  wireSwitch(cursorSwitch, "bigCursor");
  wireSwitch(pauseSwitch, "pauseAnimations");

  resetBtn.addEventListener("click", function () {
    update(Object.assign({}, defaults));
  });

  // ---------- Open / close ----------
  var lastFocused = null;

  function openPanel() {
    lastFocused = document.activeElement;
    panel.classList.add("tiger-access-open");
    overlay.classList.add("tiger-access-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    panel.focus();
    document.addEventListener("keydown", onKeydown, true);
  }

  function closePanel() {
    panel.classList.remove("tiger-access-open");
    overlay.classList.remove("tiger-access-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    } else {
      toggleBtn.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
      return;
    }
    if (e.key === "Tab") {
      var focusable = panel.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  toggleBtn.addEventListener("click", function () {
    if (panel.classList.contains("tiger-access-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });
  closeBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  // ---------- Init ----------
  render();

  // Minimal public API in case the host page wants to trigger it programmatically.
  window.TigerAccessWidget = {
    open: openPanel,
    close: closePanel,
    reset: function () {
      update(Object.assign({}, defaults));
    }
  };
})();
