# GeniusEdge site: five programme pages from one template

## Upload
Upload everything inside `dist/` to your web root (public_html). Do NOT upload `join.php` or `send_message.php` from the old site.
The old database password appears in those files: delete them and rotate the password in your host's control panel.

## Edit one file: dist/js/config.js
- ga4 / metaPixel: paste real IDs (analytics stay off until then).
- paystack: paste each Paystack page slug (g12, sc-a, sc-b, g10, sat, bc-jun, bc-sep).
  Set each page's redirect URL to https://geniusedge.co.za/success.html?offer=<id>
- After 1 Dec 2026 (enrolOpens), a programme switches to "Pay & enrol" only once its slug is filled.
- forceState: "open" or "waitlist" for testing; clear before launch.

## Change content
Edit `src/data/programmes.json` (prices, schedules, FAQs) or `src/templates/programme.html` (the one template),
then run `pip install jinja2 && python3 build.py`. The build checks the session counts (38 / 69 / 44 / 34) and stops on a mismatch.

## Still open (not published as fact)
Saturday venue and Paystack address; bootcamp early-bird cut-off; Saturday price (R600 vs R900 standard);
whether January is a deposit; 2027 NSC dates (Grade 12 and Intake B end dates are placeholders).
