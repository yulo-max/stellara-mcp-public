"""Builds data/celebrities.json: ~1000 most-followed real people on X.
Sources: Wikidata (P31=Q5, P2002 X username, P8687 followers with X qualifier, P569 birth date, P19+P625 birthplace)
and Grokipedia (lead/meta text) as cross-check and gap filler. Birth times only from documented overrides.
Usage: python3 scripts/build_celebrities.py <cache dir with wd_details.json, labels.json, descriptions.json, gk/*.html>
"""
import json, re, os, sys, html, gzip, math, datetime
cache = sys.argv[1] if len(sys.argv) > 1 else './celebs'
root = os.path.join(os.path.dirname(__file__), '..')
MONTHS = 'January February March April May June July August September October November December'.split()
PAT = re.compile(r'born\b[^)]{0,160}?((?:%s) \d{1,2}, \d{4}|\d{1,2} (?:%s) \d{4})' % ('|'.join(MONTHS), '|'.join(MONTHS)))
PLACE = re.compile(r'[Bb]orn (?:on )?(?:(?:%s) \d{1,2}, \d{4}|\d{1,2} (?:%s) \d{4}),? in ([A-Z][\w\'’.\- ]+(?:, [A-Z][\w\'’.\- ]+){0,2})' % ('|'.join(MONTHS), '|'.join(MONTHS)))
# Documented birth times (published birth certificates, Rodden AA via Astro-Databank).
TIMES = {'Q76': ('19:24', 'Published Hawaii birth certificate (Astro-Databank, Rodden AA)'),
         'Q22686': ('10:54', 'Published birth certificate (Astro-Databank, Rodden AA)')}

def gk_parse(qid):
    p = os.path.join(cache, 'gk', qid + '.html')
    if not os.path.exists(p) or os.path.getsize(p) < 1000: return None, None
    t = html.unescape(open(p, encoding='utf8', errors='ignore').read())
    m = re.search(r'<meta name="description" content="([^"]*)"', t)
    head = m.group(1) if m else ''
    if head.startswith('Grokipedia is'): return None, None
    d = PAT.search(head) or PAT.search(t[:250000])
    date = None
    if d:
        s = d.group(1)
        for fmt in ('%B %d, %Y', '%d %B %Y'):
            try: date = datetime.datetime.strptime(s, fmt).date().isoformat(); break
            except ValueError: pass
    pl = PLACE.search(re.sub(r'<[^>]+>', ' ', t[:250000]))
    return date, (pl.group(1).strip() if pl else None)

# nearest gazetteer place -> IANA timezone
grid = {}
for line in gzip.open(os.path.join(root, 'data', 'gazetteer.tsv.gz'), 'rt', encoding='utf8'):
    c = line.rstrip('\n').split('\t'); la, lo = float(c[4]), float(c[5])
    grid.setdefault((round(la), round(lo)), []).append((la, lo, c[6]))
def tz_for(la, lo):
    best = None
    for dla in (-1, 0, 1):
        for dlo in (-1, 0, 1):
            for (a, b, tz) in grid.get((round(la) + dla, round(lo) + dlo), []):
                d = (a - la) ** 2 + ((b - lo) * math.cos(math.radians(la))) ** 2
                if best is None or d < best[0]: best = (d, tz)
    return best[1] if best else None

wd = json.load(open(os.path.join(cache, 'wd_details.json')))
labels = json.load(open(os.path.join(cache, 'labels.json')))
desc = json.load(open(os.path.join(cache, 'descriptions.json')))
wd.sort(key=lambda x: -x['followers'])
people, stats = [], {'high': 0, 'medium': 0, 'low': 0, 'skipped_no_date': 0, 'skipped_no_handle': 0, 'gk_place_fill': 0}
for x in wd:
    if len(people) >= 1000: break
    q = x['qid']; name = labels.get(q, {}).get('label') or x['name']
    if not x['handles']: stats['skipped_no_handle'] += 1; continue
    days = sorted({v[:10] for v, p in x['dobs'] if p >= 11})
    gdate, gplace = gk_parse(q)
    if len(days) == 1 and gdate == days[0]: date, src, conf = days[0], 'Wikidata + Grokipedia (agree)', 'high'
    elif len(days) == 1 and not gdate: date, src, conf = days[0], 'Wikidata (Grokipedia: no date found)', 'medium'
    elif len(days) == 1: date, src, conf = days[0], f'Wikidata; Grokipedia says {gdate} (conflict)', 'low'
    elif len(days) > 1 and gdate in days: date, src, conf = gdate, f'Wikidata has {len(days)} values; Grokipedia agrees with this one', 'medium'
    elif not days and gdate: date, src, conf = gdate, 'Grokipedia (Wikidata: no full date)', 'medium'
    else: stats['skipped_no_date'] += 1; continue
    if date.startswith('-') or date < '1880': stats['skipped_no_date'] += 1; continue
    place = lat = lon = None; psrc = None
    for pl, coord in x['places'].items():
        if coord:
            m = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', coord); lon, lat = float(m.group(1)), float(m.group(2)); place = pl; break
    if place:
        psrc = 'Wikidata P19' + (' + Grokipedia (agree)' if gplace and place.split(',')[0].lower() in gplace.lower() else '')
    elif gplace:
        place, psrc = gplace, 'Grokipedia (no coordinates)'; stats['gk_place_fill'] += 1
    tz = tz_for(lat, lon) if lat is not None else None
    t = TIMES.get(q)
    # Several X usernames (e.g. personal + office account): prefer the one closest to the person's name.
    from difflib import SequenceMatcher
    nn = re.sub(r'[^a-z0-9]', '', name.lower())
    handles = sorted(x['handles'], key=lambda h: -SequenceMatcher(None, nn, h.lower()).find_longest_match(0, len(nn), 0, len(h)).size)
    stats[conf] += 1
    people.append({'qid': q, 'name': name, 'x_handle': '@' + handles[0], 'aliases': ['@' + h for h in handles[1:]], 'followers': int(x['followers']),
                   'description': desc.get(q), 'birth_date': date, 'birth_date_source': src, 'birth_date_confidence': conf,
                   'birth_place': place, 'birth_place_source': psrc, 'latitude': round(lat, 4) if lat is not None else None,
                   'longitude': round(lon, 4) if lon is not None else None, 'timezone': tz,
                   'birth_time': t[0] if t else None, 'birth_time_source': t[1] if t else None})
out = {'generated': datetime.date.today().isoformat(),
       'license': 'Wikidata data is CC0. Grokipedia used only to cross-check dates/places (facts).',
       'ranking': 'Wikidata P8687 follower counts with X user-id qualifier (snapshot); humans only (P31=Q5).',
       'stats': stats, 'people': people}
json.dump(out, open(os.path.join(root, 'data', 'celebrities.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(people), stats)
