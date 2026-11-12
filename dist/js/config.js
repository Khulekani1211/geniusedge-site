/* =====================================================================
   GeniusEdge site settings. This is the ONLY file you need to edit
   after uploading. Everything else is generated.
   ===================================================================== */
window.GE_CONFIG = {

  /* WhatsApp Business number: international format, no +, no spaces. */
  whatsapp: "27739689838",

  /* Analytics. Leave as-is until you have the real IDs; the scripts are
     simply not loaded while these are placeholders. */
  ga4: "G-XXXXXXXXXX",            // analytics.google.com > Admin > Data streams
  metaPixel: "YOUR_PIXEL_ID",     // business.facebook.com > Events Manager

  /* When paid enrolment opens, and the first teaching day. */
  enrolOpens: "2026-12-01T00:00:00+02:00",
  firstSession: "2027-02-01T00:00:00+02:00",

  /* Paystack payment pages. Paste the page slug from the Paystack dashboard
     (the last part of https://paystack.com/pay/<slug>). While a slug is empty,
     that programme keeps showing "Join the waitlist" even after 1 December.
     Set each page's redirect URL to https://geniusedge.co.za/success.html?offer=<id> */
  paystack: {
    "g12":    "",   // Grade 12 Weekly
    "sc-a":   "",   // Second Chances, Intake A
    "sc-b":   "",   // Second Chances, Intake B
    "g10":    "",   // Grade 10 Weekly
    "sat":    "",   // Grade 10 Saturday Class
    "bc-jun": "",   // Exam Bootcamp, June
    "bc-sep": ""    // Exam Bootcamp, September/October
  },


    /* Lead capture. Paste the web app address from your Google Apps Script deployment
     (see apps-script/SETUP.md). While empty, the form only opens WhatsApp, as before.
     leadsKey must match SHARED_KEY in Code.gs; it only filters casual spam, it is not a secret. */
   leadsUrl: "",
   leadsKey: "",

  /* Optional live "seats left". A Google Apps Script web app that returns JSON
     like {"g12": 4, "sc-a": 10, "sat": 12}. Leave empty to show seat caps only. */
  seatsUrl: "",

  /* For testing only: "open" or "waitlist" overrides the date logic. */
  forceState: ""
};
