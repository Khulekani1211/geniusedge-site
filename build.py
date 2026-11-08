#!/usr/bin/env python3
"""GeniusEdge site generator.

One data file (src/data/programmes.json) + one programme template
(src/templates/programme.html) -> five programme pages, plus the home page,
legal pages and the redirect stubs. Run:  python3 build.py
Output goes to ./dist (upload the contents of dist/ to your hosting).
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

data = json.loads((SRC / "data" / "programmes.json").read_text(encoding="utf-8"))
site = data["site"]
programmes = data["programmes"]
YEAR = site["year"]

D = lambda s: dt.date.fromisoformat(s)
TERMS = [(t["id"], D(t["start"]), D(t["end"])) for t in data["terms"]]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def in_term(day):
    return any(a <= day <= b for _, a, b in TERMS)


def count_sessions(rule):
    """Sessions per calendar month, using the same rules as the sessions workbook."""
    counts = {m: 0 for m in range(1, 13)}
    for start, end in rule["ranges"]:
        day, last = D(start), D(end)
        while day <= last:
            if day.weekday() in rule["weekdays"] and (not rule["termOnly"] or in_term(day)):
                counts[day.month] += 1
            day += dt.timedelta(days=1)
    return counts


def money(n):
    return f"R{n:,.0f}"


# ---- enrich programme records ---------------------------------------------
for p in programmes:
    p["priceText"] = money(p["offers"][0]["price"])
    p["standardText"] = money(p["offers"][0]["standard"]) if p["offers"][0]["standard"] else None
    if p["rule"]["weekdays"]:
        counts = count_sessions(p["rule"])
        p["counts"] = counts
        p["total"] = sum(counts.values())
        pay = p["billing"]["payments"]
        p["avg"] = round(p["total"] / pay, 1)
        active = [m for m in range(1, 13) if counts[m]]
        p["monthChips"] = [
            {"label": MONTHS[m - 1], "n": counts[m], "off": counts[m] != p["advertised"]}
            for m in active
        ]
        if p["rule"].get("intakes"):
            p["intakeTotals"] = []
            for name, a, b in p["rule"]["intakes"]:
                sub = [m for m in range(a, b + 1)]
                p["intakeTotals"].append({
                    "name": name,
                    "total": sum(counts[m] for m in sub),
                    "chips": [{"label": MONTHS[m - 1], "n": counts[m], "off": counts[m] != p["advertised"]} for m in sub],
                })
        off = [c for c in p["monthChips"] if c["off"]]
        p["offMonths"] = ", ".join(f'{c["label"]} ({c["n"]})' for c in off)

# sanity check against the workbook totals agreed earlier in the project
EXPECTED = {"g12": 38, "sc": 69, "g10": 44, "sat": 34}
for p in programmes:
    if p["id"] in EXPECTED and p["total"] != EXPECTED[p["id"]]:
        sys.exit(f"Session count mismatch for {p['id']}: {p['total']} != {EXPECTED[p['id']]}")

# flat offers list for JS (modal select, WhatsApp text)
offers = []
for p in programmes:
    for o in p["offers"]:
        offers.append({**o, "programme": p["name"], "slug": p["slug"], "id": o["id"]})


# ---- year timeline (home page) ---------------------------------------------
def pct(day):
    a, b = dt.date(YEAR, 1, 1), dt.date(YEAR, 12, 31)
    return round((day - a).days / (b - a).days * 100, 2)


def bar(start, end, cls="", label=""):
    s, e = D(start), D(end)
    return {"left": pct(s), "width": round(pct(e) - pct(s) + 0.4, 2), "cls": cls, "label": label}


timeline = {
    "months": MONTHS,
    "terms": [{"id": i, **bar(a.isoformat(), b.isoformat())} for i, a, b in TERMS],
    "rows": [
        {"name": "Grade 12 Weekly", "slug": "grade-12-weekly", "bars": [bar("2027-02-01", "2027-10-21", "navy")]},
        {"name": "Second Chances", "slug": "second-chances", "bars": [
            bar("2027-02-01", "2027-05-31", "coral", "A"), bar("2027-07-01", "2027-10-31", "coral", "B")]},
        {"name": "Grade 10 Weekly", "slug": "grade-10-weekly", "bars": [bar("2027-02-01", "2027-11-30", "navy")]},
        {"name": "Grade 10 Saturday", "slug": "grade-10-saturday", "bars": [
            bar(a.isoformat(), b.isoformat(), "navy")
            for _, a, b in TERMS
            if b >= dt.date(YEAR, 2, 1)
        ]},
        {"name": "Exam Bootcamp", "slug": "exam-bootcamp", "bars": [
            bar("2027-06-28", "2027-07-02", "amber", "Jun"), bar("2027-09-27", "2027-10-01", "amber", "Sep")]},
    ],
}
# Term 1 bar for Saturday class starts on 1 Feb, not 13 Jan
timeline["rows"][3]["bars"][0] = bar("2027-02-01", "2027-03-19", "navy")

# ---- jinja ------------------------------------------------------------------
env = Environment(
    loader=FileSystemLoader(str(SRC / "templates")),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)
env.filters["money"] = money
by_slug = {p["slug"]: p for p in programmes}


def render(template, out, **ctx):
    html = env.get_template(template).render(
        site=site, programmes=programmes, offers=offers, by_slug=by_slug, **ctx
    )
    (DIST / out).write_text(html, encoding="utf-8")
    print("wrote", out)


DIST.mkdir(exist_ok=True)
for sub in ("css", "js", "img"):
    (DIST / sub).mkdir(exist_ok=True)

# the five programme pages, all from ONE template
for p in programmes:
    related = [by_slug[s] for s in p["related"]]
    render("programme.html", f'{p["slug"]}.html', p=p, related=related,
           page_title=f'{p["name"]} | GeniusEdge Tutoring', page_desc=p["metaDescription"],
           canonical=f'{site["domain"]}/{p["slug"]}.html')

render("home.html", "index.html", timeline=timeline, general_faq=data["generalFaq"],
       page_title="GeniusEdge Tutoring | Maths for Grade 10, Grade 12 and matric rewrite",
       page_desc="Small-group Mathematics tutoring for Grade 10, Grade 12 and matric rewrite learners in 2027. Online and in person in Johannesburg. Groups of up to 10, marked homework, voice-note feedback.",
       canonical=site["domain"] + "/")
render("terms.html", "terms.html", page_title="Terms and policies | GeniusEdge Tutoring",
       page_desc="Fees, billing, cancellation, refunds and delivery for GeniusEdge Tutoring programmes.",
       canonical=f'{site["domain"]}/terms.html')
render("privacy.html", "privacy.html", page_title="Privacy notice | GeniusEdge Tutoring",
       page_desc="How GeniusEdge Tutoring collects, uses and protects personal information.",
       canonical=f'{site["domain"]}/privacy.html')
render("success.html", "success.html", page_title="Welcome to GeniusEdge",
       page_desc="Payment received.", canonical=f'{site["domain"]}/success.html', noindex=True)

# redirect stubs so old links keep working
for old, new in (("faq.html", "index.html#faq"), ("services.html", "index.html#programmes")):
    (DIST / old).write_text(
        f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
        f'<meta http-equiv="refresh" content="0; url={new}"><link rel="canonical" href="{site["domain"]}/{new}">'
        f'<title>Redirecting</title></head><body><a href="{new}">Continue to GeniusEdge</a></body></html>',
        encoding="utf-8",
    )

# generated JS data (offers) + sitemap + robots
(DIST / "js" / "offers.js").write_text(
    "/* Generated by build.py from src/data/programmes.json. Do not edit by hand. */\n"
    "window.GE_OFFERS = " + json.dumps(offers, indent=1, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
urls = [site["domain"] + "/"] + [f'{site["domain"]}/{p["slug"]}.html' for p in programmes] + [
    f'{site["domain"]}/terms.html', f'{site["domain"]}/privacy.html']
(DIST / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {site['domain']}/sitemap.xml\n", encoding="utf-8")

# print session summary so counts can be eyeballed at build time
for p in programmes:
    if "total" in p:
        print(f'{p["name"]:<20} {p["total"]:>3} sessions / {p["billing"]["payments"]} payments = {p["avg"]} avg; off-months: {p["offMonths"] or "none"}')
