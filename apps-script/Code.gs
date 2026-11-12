/**
 * GeniusEdge waitlist capture: Google Apps Script web app.
 * Receives a lead from the website form and appends it to the "Leads" sheet.
 * Setup steps are in SETUP.md. Public address + a casual-spam key live in the site's config.js.
 */

// ---- settings you may change ------------------------------------------------
var SHEET_NAME   = 'Leads';
var NOTIFY_EMAIL = 'info@geniusedge.co.za'; // new-lead email to you. Use '' to switch off.
var SHARED_KEY   = '';                      // if set, must equal leadsKey in config.js
var ALLOWED_OFFERS = ['g12', 'sc-a', 'sc-b', 'g10', 'sat', 'bc-jun', 'bc-sep'];
var MAX_LEN = { id: 20, learner: 80, parent: 80, phone: 30, mark: 20, source: 80, page: 80, programme: 100 };

var HEADERS = ['Received', 'Ref', 'Status', 'Programme', 'Offer id', 'Grade', 'Learner', 'Parent or guardian',
               'Phone as typed', 'WhatsApp number', 'Open WhatsApp', 'Contact is', 'Latest mark',
               'Source', 'Page state', 'Page', 'Consent', 'Follow-up notes'];

// ---- web app entry points ---------------------------------------------------
function doGet() { return json_({ ok: true, service: 'GeniusEdge leads' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var problem = validate_(d);
    if (problem) return json_({ ok: false, error: problem });

    var sheet = getSheet_();
    var wa = normalisePhone_(d.phone);
    var row = [
      new Date(), clean_(d.id), 'New', clean_(d.programme), clean_(d.offerId), clean_(d.grade),
      clean_(d.learner), clean_(d.parent), clean_(d.phone), wa, '', clean_(d.contactType),
      clean_(d.mark), clean_(d.source), clean_(d.state), clean_(d.page), d.consent === true ? 'Yes' : 'No', ''
    ];
    sheet.appendRow(row);
    var r = sheet.getLastRow();
    if (wa) { // the link is built from digits only, so no user text ends up inside a formula
      sheet.getRange(r, 11).setFormula('=HYPERLINK("https://wa.me/' + wa + '","Open chat")');
    }
    notify_(d, wa);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// ---- helpers ----------------------------------------------------------------
function validate_(d) {
  if (d.website) return 'rejected';                                  // honeypot filled
  if (SHARED_KEY && d.key !== SHARED_KEY) return 'bad key';
  if (d.consent !== true) return 'no consent';
  if (ALLOWED_OFFERS.indexOf(d.offerId) === -1) return 'unknown offer';
  if (!d.learner || !d.phone) return 'missing fields';
  if (String(d.phone).replace(/\D/g, '').length < 9) return 'bad phone';
  for (var k in MAX_LEN) {
    if (d[k] && String(d[k]).length > MAX_LEN[k]) return 'too long: ' + k;
  }
  return '';
}

// Stops spreadsheet formula injection: a cell that starts with = + - @ is stored as plain text.
function clean_(v) {
  var s = (v === undefined || v === null) ? '' : String(v).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// South African numbers: 073 968 9838 -> 27739689838. Numbers already starting 27 are kept.
function normalisePhone_(raw) {
  var n = String(raw || '').replace(/\D/g, '');
  if (n.indexOf('00') === 0) n = n.slice(2);
  if (n.indexOf('0') === 0 && n.length === 10) return '27' + n.slice(1);
  if (n.indexOf('27') === 0 && n.length === 11) return n;
  return n; // anything else is stored as typed digits; check it by hand
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function notify_(d, wa) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail(NOTIFY_EMAIL, 'New waitlist lead: ' + clean_(d.programme),
      'Ref ' + clean_(d.id) + '\nLearner: ' + clean_(d.learner) + '\nGrade: ' + clean_(d.grade) +
      '\nParent: ' + clean_(d.parent) + '\nPhone: ' + clean_(d.phone) +
      (wa ? '\nOpen chat: https://wa.me/' + wa : ''));
  } catch (err) { /* a mail problem must never lose the lead */ }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
