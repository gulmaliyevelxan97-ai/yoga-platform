"""Regenerate the static RESTART pages and their offline manifest."""
from pathlib import Path
from hashlib import sha256
import json
import re

ROOT = Path(__file__).resolve().parents[2]
NAV = 'releases/navigation'
WEEK = 'releases/week'
entries = {
    'index.html': ('home', 'Не стать другим. Раскрыть себя.'),
    'about.html': ('about', 'О RESTART'),
    'philosophy.html': ('method', 'Философия'),
    'code.html': ('code', 'Кодекс школы'),
    'programme.html': ('programme', 'Программа 56 дней'),
    'my-path.html': ('path', 'Мой путь'),
    'journal.html': ('journal', 'Дневник'),
    'progress.html': ('progress', 'Мой прогресс'),
    'participation.html': ('signup', 'Участие'),
    'week-one.html': ('calendar', 'Неделя 1 · Пробуждение'),
}
studio = {'practices.html': 'practices', 'activity.html': 'activity'}

def tag_path(path):
    version = sha256((ROOT/path).read_bytes()).hexdigest()[:12]
    return f'./{path}?v={version}'

def script(path):
    return f'<script defer src="{tag_path(path)}"></script>'

design = f'<link rel="stylesheet" href="{tag_path(NAV+"/design.css")}">'
shell = script(NAV+'/shell.js')
header = '''<header class="school-bar" data-shell>
<a class="wordmark" href="./">RESTART</a>
<nav class="top-links" aria-label="Main"></nav>
<nav class="dock" aria-label="Quick links"></nav>
<details class="all-menu" id="moreNav"><summary>Разделы</summary><nav class="all-links" aria-label="All sections"></nav></details>
<select id="LANG_ID" aria-label="Язык / Dil / Language"><option value="ru">RU</option><option value="az">AZ</option><option value="en">EN</option></select>
</header>'''
footer = '<footer data-school-footer></footer>'
common_head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#faf8f1"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./assets/pwa/restart-apple.png"><link rel="icon" href="./assets/pwa/restart-192.png">'
scripts = ''.join(script(path) for path in [NAV+'/shell.js', WEEK+'/content.js', WEEK+'/assessment.js', WEEK+'/school.js', NAV+'/pages.js', WEEK+'/week.js'])
mast_photos = {
    'home': (
        '<img src="./assets/brand/restart-1188.webp" '
        'srcset="./assets/brand/restart-640.webp 640w, ./assets/brand/restart-1188.webp 1188w" '
        'sizes="(max-width: 640px) calc(100vw - 5rem), (max-width: 1200px) 38vw, 440px" '
        'width="1188" height="1536" alt="RESTART · Elxan Gülmalıyev" fetchpriority="high">'
    ),
    'about': '<img src="./assets/author.webp" width="408" height="510" alt="Elxan Gülmalıyev" decoding="async">',
    'method': '<img src="./assets/hero.webp" width="900" height="900" alt="" decoding="async">',
    'programme': '<img src="./assets/performance.webp" width="640" height="800" alt="" decoding="async">',
}
for file, (page,title) in entries.items():
    hero_image = mast_photos.get(page, '')
    actions = '<div class="school-actions" id="home-actions"></div>' if page=='home' else ''
    (ROOT/file).write_text(f'''<!doctype html>
<html lang="ru"><head>{common_head}<title>{title} · RESTART</title>{design}{scripts}</head>
<body data-page="{page}"><a class="school-skip" href="#top">К содержанию</a>{header.replace('LANG_ID','lang')}
<main class="school-main" id="top" tabindex="-1">
<div class="school-mast"><div><small id="kicker"></small><h1 id="headline">{title}</h1><p id="lead"></p>{actions}</div>{hero_image}</div>
<p id="notice" role="status"></p><section id="view"></section>
</main>{footer}</body></html>
''')

source = (ROOT/NAV/'studio-template.html').read_text()
for file,page in studio.items():
    text = re.sub(r'<header>.*?</header>',header.replace('LANG_ID','language'),source,count=1,flags=re.S)
    text = text.replace('<body>',f'<body data-page="{page}">')
    text = text.replace('</head>',design+shell+script(NAV+'/studio-shell.js')+'</head>')
    text = re.sub(r'<footer>.*?</footer>',footer,text,count=1,flags=re.S)
    text = text.replace('./releases/week/index.html#signup','./participation.html').replace('./releases/week/index.html#progress','./progress.html')
    if page == 'practices':
        text = text.replace('<main id="top">','<main id="top"><div class="studio-switch"><label for="practice-type" id="practice-type-label">Тип занятия</label><select id="practice-type"><option value="all">Все</option><option value="guided">Практики с таймером</option><option value="video">Видео</option></select></div>',1)
    text = re.sub(r"\./([^\"?]+\.(?:js|css))\?v=[a-f0-9]+", lambda match: tag_path(match[1]), text)
    (ROOT/file).write_text(text)

sw = ROOT/'service-worker.js'
worker = sw.read_text()
match = re.search(r'const ASSETS = (\[.*?\]);',worker,re.S)
assets = {a.split('?')[0]:a for a in json.loads(match[1])}
for file in [*entries,*studio]:
    assets['./'+file] = './'+file
    for script_or_css in re.findall(r'(?:src|href)="(\./[^"]+\.(?:js|css)\?v=[a-f0-9]+)"',(ROOT/file).read_text()):
        assets[script_or_css.split('?')[0]] = script_or_css
# The legacy week page uses unversioned copies of its four scripts.
week_paths = ['./'+WEEK+'/'+f for f in ['content.js','week.js','assessment.js','school.js']]
values = list(assets.values()) + [a for a in week_paths if a not in assets.values()]
digest = sha256()
for asset in values:
    digest.update((ROOT/asset.split('?')[0]).read_bytes())
worker=worker[:match.start(1)]+json.dumps(values,indent=2)+worker[match.end(1):]
sw.write_text(re.sub("const VERSION = '.*?'",f"const VERSION = '{digest.hexdigest()[:14]}'",worker))
