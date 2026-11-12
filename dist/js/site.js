/* GeniusEdge site script. Settings live in js/config.js; offers are generated into js/offers.js. */
(function () {
  "use strict";
  var CFG = window.GE_CONFIG || {};
  var OFFERS = window.GE_OFFERS || [];
  var offerById = {};
  OFFERS.forEach(function (o) { offerById[o.id] = o; });

  /* ---------------- helpers ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function safe(fn) { try { return fn(); } catch (e) { return null; } }
  function placeholder(v) { return !v || /^(G-X+|YOUR_)/.test(v); }

  /* ---------------- analytics (loaded only when real IDs are set) ---------------- */
  if (!placeholder(CFG.ga4)) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.ga4);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CFG.ga4);
  }
  if (!placeholder(CFG.metaPixel)) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", CFG.metaPixel);
    window.fbq("track", "PageView");
  }
  /* Never let analytics break a button. */
  function ga(name, params) { safe(function () { if (typeof window.gtag === "function") window.gtag("event", name, params || {}); }); }
  function fb(name, params) { safe(function () { if (typeof window.fbq === "function") window.fbq("track", name, params || {}); }); }

  /* ---------------- ad traffic (UTM) ---------------- */
  var qs = new URLSearchParams(window.location.search);
  var src = (qs.get("utm_source") || "").toLowerCase();
  if (qs.get("utm_source")) {
    safe(function () { sessionStorage.setItem("geSource", qs.get("utm_source") + (qs.get("utm_campaign") ? " / " + qs.get("utm_campaign") : "")); });
  }
  var adSource = safe(function () { return sessionStorage.getItem("geSource"); }) || "";
  var fromMeta = ["meta", "facebook", "instagram", "fb", "ig"].indexOf(src) > -1;
  if (fromMeta) ga("ad_landing", { source: adSource });

  /* ---------------- enrolment state ---------------- */
  function state() {
    if (CFG.forceState === "open" || CFG.forceState === "waitlist") return CFG.forceState;
    return new Date() >= new Date(CFG.enrolOpens) ? "open" : "waitlist";
  }
  function slugFor(id) { return (CFG.paystack && CFG.paystack[id]) || ""; }
  function payUrl(id) { return "https://paystack.com/pay/" + encodeURIComponent(slugFor(id)); }
  function waUrl(text) { return "https://wa.me/" + CFG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""); }

  var S = state();

  $$("[data-enrol]").forEach(function (el) {
    var id = el.getAttribute("data-enrol");
    var label = $(".enrol-label", el);
    var live = S === "open" && id && slugFor(id);
    if (label) label.textContent = live ? "Pay & enrol" : (S === "open" && !id ? "Pay & enrol" : "Join the waitlist");
    if (live) {
      el.href = payUrl(id);
      el.target = "_blank";
      el.rel = "noopener";
    }
    el.addEventListener("click", function (e) {
      ga("enrol_click", { offer: id || "any", state: S });
      if (live) {
        fb("InitiateCheckout", { content_name: id });
        ga("begin_checkout", { items: [{ item_id: id }] });
        return; /* follow the Paystack link */
      }
      if (S === "open" && !id) return; /* generic button: scroll to programmes */
      e.preventDefault();
      openModal(id);
    });
  });

  $$("[data-enrol-status]").forEach(function (el) {
    el.textContent = S === "open"
      ? "Paid enrolment is open. First sessions run in the week of 1 February 2027."
      : "Waitlist open. Paid enrolment opens 1 December 2026.";
  });

  /* WhatsApp links with programme-aware greetings */
  var GREET = {
    general: "Hi GeniusEdge! I'd like to find out more about your 2027 Maths programmes.",
    g12: "Hi GeniusEdge! I'd like to find out more about Grade 12 Weekly.",
    sc: "Hi GeniusEdge! I'd like to find out more about the Second Chances programme.",
    g10: "Hi GeniusEdge! I'd like to find out more about Grade 10 Weekly.",
    sat: "Hi GeniusEdge! I'd like to find out more about the Grade 10 Saturday Class.",
    bc: "Hi GeniusEdge! I'd like to find out more about the Exam Bootcamp."
  };
  $$("[data-wa]").forEach(function (a) {
    var k = a.getAttribute("data-wa");
    a.href = waUrl(GREET[k] || GREET.general);
    a.addEventListener("click", function () { ga("whatsapp_click", { programme: k }); });
  });

  /* ---------------- countdown ---------------- */
  var TERMS = [["Term 1", "2027-01-13", "2027-03-19"], ["Term 2", "2027-04-06", "2027-06-25"], ["Term 3", "2027-07-20", "2027-09-22"], ["Term 4", "2027-10-05", "2027-12-08"]];
  var cdNum = $("#cdNum"), cdLbl = $("#cdLbl");
  if (cdNum && cdLbl) {
    var now = new Date(), first = new Date(CFG.firstSession);
    var days = Math.ceil((first - now) / 86400000);
    if (days > 0) {
      cdNum.textContent = days;
      cdLbl.textContent = days === 1 ? "day to first session" : "days to first session";
    } else {
      var cur = TERMS.filter(function (t) { return now >= new Date(t[1]) && now <= new Date(t[2] + "T23:59:59"); })[0];
      cdNum.textContent = cur ? cur[0].replace("Term ", "T") : "2027";
      cdLbl.textContent = cur ? "school term in progress" : "school holidays";
    }
  }

  /* ---------------- seats left (optional) ---------------- */
  $$("[data-seats]").forEach(function (el) {
    el.textContent = "Capped at " + el.getAttribute("data-cap") + " seats";
  });
  if (CFG.seatsUrl) {
    fetch(CFG.seatsUrl).then(function (r) { return r.json(); }).then(function (m) {
      $$("[data-seats]").forEach(function (el) {
        var id = el.getAttribute("data-seats"), cap = el.getAttribute("data-cap");
        if (typeof m[id] === "number") {
          el.textContent = m[id] > 0 ? m[id] + " of " + cap + " seats left" : "Full. Join the waitlist for the next group";
        }
      });
    }).catch(function () { /* keep the cap text */ });
  }

  /* ---------------- menu ---------------- */
  var toggle = $("#menuToggle"), nav = $("#primaryNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- waitlist modal ---------------- */
  var modal = $("#enrolModal"), form = $("#enrolForm");
  if (modal && form) {
    var selOffer = $("#fOffer"), selGrade = $("#fGrade"), fit = $("#fitMsg"), lastFocus = null;

    var opt = document.createElement("option"); opt.value = ""; opt.textContent = "Select a programme"; selOffer.appendChild(opt);
    OFFERS.forEach(function (o) {
      var op = document.createElement("option");
      op.value = o.id; op.textContent = o.label + " · R" + o.price.toLocaleString("en-ZA") + o.unit;
      selOffer.appendChild(op);
    });

    /* Which grades each programme is for. Used to filter unqualified enquiries before they reach WhatsApp. */
    var FITS = { g12: ["12"], "sc-a": ["rewrite"], "sc-b": ["rewrite"], g10: ["10"], sat: ["10"], "bc-jun": ["12", "rewrite"], "bc-sep": ["12", "rewrite"] };
    var GRADE_NAME = { "10": "Grade 10", "12": "Grade 12", rewrite: "matric rewrite" };

    function checkFit() {
      var o = selOffer.value, g = selGrade.value, msg = "";
      if (g === "other") {
        msg = "We currently teach Mathematics for Grade 10, Grade 12 and matric rewrite learners. For another grade, message us on WhatsApp and we'll tell you what is possible.";
      } else if (o && g && FITS[o] && FITS[o].indexOf(g) === -1) {
        var who = FITS[o].map(function (x) { return GRADE_NAME[x]; }).join(" and ");
        msg = offerById[o].programme + " is for " + who + " learners. Please choose the programme that matches " + (GRADE_NAME[g] || "your learner's grade") + ".";
      }
      fit.hidden = !msg; fit.textContent = msg;
      return !msg;
    }
    /* Rewrite learners are usually over 18 and are the main contact, so the parent is optional for them. */
    var fParent = $("#fParent");
    function learnerLed() { return /^sc-/.test(selOffer.value) || selGrade.value === "rewrite"; }
    function adaptContact() {
      var led = learnerLed();
      $("#lParent").textContent = led ? "Parent or guardian's name (optional)" : "Parent or guardian's name";
      $("#lPhone").textContent = led ? "Your WhatsApp number" : "Parent's WhatsApp number";
      fParent.required = !led;
      if (led) fParent.classList.remove("bad");
    }
    selOffer.addEventListener("change", function () { checkFit(); adaptContact(); });
    selGrade.addEventListener("change", function () { checkFit(); adaptContact(); });

    window.openModal = function (id) {
      lastFocus = document.activeElement;
      if (id && offerById[id]) selOffer.value = id;
      var isOpen = S === "open";
      $("#enrolTitle").textContent = isOpen ? "Enrol your learner" : "Join the waitlist";
      $("#enrolEyebrow").textContent = isOpen ? "Enrol" : "Waitlist";
      $("#fSubmit").textContent = leadsOn() ? (isOpen ? "Enrol & open WhatsApp" : "Join & open WhatsApp") : "Send on WhatsApp";
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      (id ? $("#fGrade") : selOffer).focus();
      checkFit(); adaptContact();
      ga("enrol_modal_open", { offer: id || "unspecified", state: S });
    };
    function closeModal() {
      modal.hidden = true; document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $("#enrolClose").addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

    /* Waitlist lead capture: the lead is saved to a Google Sheet (via an Apps Script web app set in
       config.js as leadsUrl) AND WhatsApp opens with a pre-filled message, so the conversation starts
       and the lead is never lost if the parent does not press send. If leadsUrl is empty the form
       behaves as before and only opens WhatsApp. */
    var note = $(".modal-note"), submitBtn = $("#fSubmit");
    function leadsOn() { return !!CFG.leadsUrl; }
    function newLeadId() { return "GE-" + (Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase(); }
    function saveLead(lead) {
      if (!leadsOn()) return;
      /* text/plain + no-cors keeps this a "simple" request, which Apps Script accepts without a CORS preflight.
         keepalive lets it finish even though WhatsApp opens in another tab. Failures never block WhatsApp. */
      safe(function () {
        fetch(CFG.leadsUrl, {
          method: "POST", mode: "no-cors", keepalive: true,
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(lead)
        }).catch(function () { /* the WhatsApp message still carries every detail and the reference */ });
      });
    }
    if (note) note.textContent = leadsOn()
      ? "When you press the button we save these details to our waitlist and open WhatsApp with a message ready to send. Never send card details in chat."
      : "Nothing is submitted until you press send in WhatsApp. Never send card details in chat.";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      /* Honeypot: real people never see or fill this field. Bots do. Pretend success and do nothing. */
      var hp = $("#fWebsite");
      if (hp && hp.value) { form.reset(); closeModal(); return; }

      var ok = true;
      ["fOffer", "fGrade", "fLearner", "fParent", "fPhone"].forEach(function (id) {
        var el = document.getElementById(id), bad = !el.value.trim() && !(id === "fParent" && learnerLed());
        el.classList.toggle("bad", bad); if (bad) ok = false;
      });
      var digits = $("#fPhone").value.replace(/\D/g, "");
      if (digits.length < 9) { $("#fPhone").classList.add("bad"); ok = false; }
      if (!$("#fConsent").checked) { ok = false; fit.hidden = false; fit.textContent = "Please tick the consent box so we can store your details and contact you."; return; }
      if (!ok) { fit.hidden = false; fit.textContent = "Please complete the highlighted fields."; return; }
      if (!checkFit()) return;

      var o = offerById[selOffer.value];
      var led = learnerLed(), parent = $("#fParent").value.trim(), phone = $("#fPhone").value.trim();
      var mark = $("#fMark").value.trim(), learner = $("#fLearner").value.trim();
      var leadId = newLeadId();

      var lines = [
        (S === "open" ? "Enrolment request" : "Waitlist request") + " for 2027:",
        "Programme: " + o.label,
        "Learner: " + learner + " (" + (GRADE_NAME[selGrade.value] || selGrade.value) + ")"
      ];
      if (led) { lines.push("Learner WhatsApp: " + phone); if (parent) lines.push("Parent/guardian: " + parent); }
      else { lines.push("Parent: " + parent); lines.push("Parent WhatsApp: " + phone); }
      if (mark) lines.push("Latest Maths mark: " + mark);
      if (adSource) lines.push("Source: " + adSource);
      lines.push("Ref: " + leadId);

      /* Open WhatsApp FIRST and synchronously: browsers only allow pop-ups from the click itself. */
      window.open(waUrl(lines.join("\n")), "_blank", "noopener");

      saveLead({
        id: leadId, offerId: o.id, programme: o.label, grade: selGrade.value,
        learner: learner, parent: parent, phone: phone, contactType: led ? "learner" : "parent",
        mark: mark, consent: true, state: S, source: adSource || src || "direct",
        page: window.location.pathname, key: CFG.leadsKey || "", website: ""
      });

      /* The Lead event is what Meta optimises ad delivery towards. */
      fb("Lead", { content_name: o.label, value: o.price, currency: "ZAR" });
      ga("generate_lead", { offer: o.id, state: S, value: o.price, currency: "ZAR" });

      form.reset(); adaptContact(); fit.hidden = true; closeModal();
    });

    /* Ad visitors get the form once per session, after the page has had a moment to show. */
    if (fromMeta && !safe(function () { return sessionStorage.getItem("geAutoShown"); }) && !/^(legal|success)/.test(document.body.className)) {
      safe(function () { sessionStorage.setItem("geAutoShown", "1"); });
      var pageOffer = $("[data-enrol]:not([data-enrol=''])", document.querySelector(".ticket") || document);
      setTimeout(function () { window.openModal(pageOffer ? pageOffer.getAttribute("data-enrol") : ""); }, 1500);
    }
  } else {
    window.openModal = function () {};
  }

  /* ---------------- success page: Purchase event ---------------- */
  if (document.body.classList.contains("success-page")) {
    var id = qs.get("offer"), o = offerById[id];
    if (o) {
      var line = $("#okLine");
      if (line) line.textContent = "Thank you for enrolling in " + o.label + ". Your welcome pack is on its way by email and WhatsApp, with your timetable, class link and group invite.";
      var done = safe(function () { return sessionStorage.getItem("gePurchase:" + id); });
      if (!done) {
        fb("Purchase", { content_name: o.label, value: o.price, currency: "ZAR" });
        ga("purchase", { transaction_id: "ge-" + Date.now(), value: o.price, currency: "ZAR", items: [{ item_id: id, item_name: o.label }] });
        safe(function () { sessionStorage.setItem("gePurchase:" + id, "1"); });
      }
    }
  }
})();
