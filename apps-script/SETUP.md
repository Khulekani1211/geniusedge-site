# Lead capture setup (about 10 minutes)

Result: every waitlist form submission becomes a row in a Google Sheet, and WhatsApp still opens
with the message ready. If you do nothing here, the site keeps working as before (WhatsApp only).

1. Go to sheets.google.com and create a blank spreadsheet called "GeniusEdge Leads".
2. Menu: Extensions > Apps Script. Delete the sample code and paste all of `Code.gs`.
3. At the top, set NOTIFY_EMAIL (or '' for no emails) and, if you like, SHARED_KEY to any random word.
4. Click Deploy > New deployment > type "Web app".
   - Execute as: Me
   - Who has access: Anyone
   Click Deploy and approve the permissions (the sheet and email access are your own).
5. Copy the Web app URL (it ends in /exec).
6. In the site's `js/config.js` set:
       leadsUrl: "<the /exec URL>",
       leadsKey: "<the same SHARED_KEY, or leave empty if you set none>"
   Re-upload config.js.
7. Test: open the URL in a browser; you should see {"ok":true,...}. Then submit the form on the site
   and check that a "Leads" tab appears with a new row.

Whenever you change Code.gs, use Deploy > Manage deployments > edit > New version, or the old code keeps running.

Keep the sheet private (do not share the link). Everything in config.js is public, so the key only
filters casual spam. For stronger protection later, move to a server that keeps a real secret.

## Automatic replies on WhatsApp
The site cannot send a WhatsApp message from your number by itself. Two options:
- Free, now: in the WhatsApp Business app set a Greeting message (Business tools > Greeting message)
  and Quick replies. When the parent presses send, they get your reply at once.
- Later: the WhatsApp Business Platform (Cloud API) can send template messages automatically, but it
  needs a Meta business account, an approved template and per-message fees.
