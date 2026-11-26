"""Regenerate the static RESTART pages and their offline manifest."""
from pathlib import Path
from hashlib import sha256
import json
import re
from subprocess import run

ROOT = Path(__file__).resolve().parents[2]
NAV = 'releases/navigation'
entries = {
    'index.html': ('home', 'Сила начинается внутри'),
    'founder.html': ('founder', 'Эльхан Гюльмалыев'),
    'about.html': ('about', 'О RESTART'),
    'philosophy.html': ('method', 'Философия'),
    'code.html': ('code', 'Кодекс школы'),
    'programme.html': ('programme', 'Программа 56 дней'),
    'my-path.html': ('path', 'Мой путь'),
    'journal.html': ('journal', 'Дневник'),
    'progress.html': ('progress', 'Мой прогресс'),
    'participation.html': ('signup', 'Участие'),
}
studio = {'practices.html': 'practices', 'activity.html': 'activity'}

def tag_path(path):
    version = sha256((ROOT/path).read_bytes()).hexdigest()[:12]
    return f'./{path}?v={version}'

def script(path):
    return f'<script defer src="{tag_path(path)}"></script>'

design = f'<link rel="stylesheet" href="{tag_path(NAV+"/design.css")}">'
motion_design = f'<link rel="stylesheet" href="{tag_path(NAV+"/motion.css")}">'
analytics = f'<link rel="stylesheet" href="{tag_path(NAV+"/analytics.css")}">' + script(NAV+'/analytics.js')
shell = script(NAV+'/shell.js')
header = '''<header class="school-bar" data-shell>
<a class="wordmark" href="./">RESTART</a>
<nav class="top-links" aria-label="Основная навигация"><a href="./about.html">О RESTART</a><a href="./founder.html">Основатель</a><a href="./practices.html">Практики</a><a href="./practices.html#courses">Академия</a><a href="./practices.html#live">Расписание</a></nav>
<nav class="dock" aria-label="Быстрые ссылки"><a href="./">Главная</a><a href="./my-path.html">Мой путь</a><a href="./practices.html">Практики</a><a href="./progress.html">Мой прогресс</a></nav>
<details class="all-menu" id="moreNav"><summary>Разделы</summary><nav class="all-links" aria-label="Все разделы">STATIC_LINKS</nav></details>
<select id="LANG_ID" aria-label="Язык / Dil / Language"><option value="ru">RU</option><option value="az">AZ</option><option value="en">EN</option></select>
</header>'''
static_links = ''.join(
    f'<a href="./{file}">{title}</a>' for file, (_, title) in entries.items()
) + '<a href="./practices.html">Практики</a><a href="./practices.html#courses">Академия</a><a href="./practices.html#live">Расписание</a><a href="./activity.html">История и избранное</a><a href="./app/">Приложение RESTART</a>'
header = header.replace('STATIC_LINKS', static_links)
footer = '<footer data-school-footer></footer>'
common_head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#faf8f1"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" href="./assets/pwa/restart-apple.png"><link rel="icon" href="./assets/pwa/restart-192.png">'
scripts = ''.join(script(path) for path in [NAV+'/shell.js', NAV+'/school-public.js', NAV+'/pages.js', NAV+'/school-runtime.js'])
mast_photos = {
    'home': (
        '<img src="./assets/brand/restart-1188.webp" '
        'srcset="./assets/brand/restart-640.webp 640w, ./assets/brand/restart-1188.webp 1188w" '
        'sizes="(max-width: 640px) calc(100vw - 5rem), (max-width: 1200px) 38vw, 440px" '
        'width="1188" height="1536" alt="RESTART · Elxan Gülmalıyev" fetchpriority="high">'
    ),
    'founder': '<img src="./assets/author.webp" width="408" height="510" alt="Elxan Gülmalıyev" fetchpriority="high">',
    'about': (
        '<img src="./assets/brand/restart-dawn-640.webp" '
        'srcset="./assets/brand/restart-dawn-640.webp 640w, ./assets/brand/restart-dawn-1280.webp 1280w" '
        'sizes="(max-width: 700px) calc(100vw - 5rem), 42vw" '
        'width="1280" height="720" alt="" fetchpriority="high">'
    ),
    'method': '<img src="./assets/hero.webp" width="900" height="900" alt="" decoding="async">',
    'programme': '<img src="./assets/hero.webp" width="900" height="900" alt="Elxan Gülmalıyev" fetchpriority="high">',
}
# A video is rendered only when the owner-supplied original has been processed.
portrait_video = 'assets/founder-portrait.mp4'
has_portrait_video = (ROOT / portrait_video).is_file()
portrait_frame = 'assets/founder-nunchaku-first-frame.webp'

# Render a Russian fallback from the same content as the language switcher.
fallback_source = '\n'.join((ROOT / NAV / file).read_text() for file in ('school-public.js','pages.js','about.js','founder.js'))
fallback_source = """const document={addEventListener(){}};
const t=(...labels)=>labels[0], tracks=['MIND','BODY','NUTRITION','LIFE'];
const routes=ROUTES;
const pageUrl=key=> './'+routes[key];
const go=(key,label)=> '<a class="cta" href="'+pageUrl(key)+'">'+label+'</a>';
""".replace("ROUTES", json.dumps({**{page: file for file, (page, _) in entries.items()}, 'practices': 'practices.html', 'academy': 'practices.html#courses', 'schedule': 'practices.html#live'})) + fallback_source + "\nconsole.log(JSON.stringify({founder:founderPage(),founderIntro:founderContent.introduction[0],about:aboutPage(),method:philosophyPage(),programme:publicWeeks(),homeActions:homeActions(),homeFounder:homeFounder(),homeLead:pageIntros.home[0],homeMotto:homeMotto(),home:homePage()}));"
fallbacks = json.loads(run(['node'], input=fallback_source, text=True, encoding='utf-8', capture_output=True, check=True).stdout)

for file, (page,title) in entries.items():
    hero_image = mast_photos.get(page, '')
    if page in ('home', 'programme'):
        hero_image = f'<div class="motion-photo">{hero_image}</div>'
    actions = f'<div class="school-actions" id="home-actions">{fallbacks["homeActions"]}</div>' if page=='home' else ''
    kicker = 'RESTART' if page == 'home' else ''
    credit = f'<p id="home-founder"><a href="./founder.html">{fallbacks["homeFounder"]}</a></p>' if page == 'home' else ''
    lead = {'home': fallbacks['homeLead'], 'founder': fallbacks['founderIntro']}.get(page, '')
    motto = f'<blockquote id="home-motto">{fallbacks["homeMotto"]}</blockquote>' if page == 'home' else ''
    page_scripts = script(NAV+'/founder.js') + scripts if page == 'founder' else scripts
    page_design = design
    motion_script = script(NAV+'/motion.js') if page in ('home', 'about', 'method', 'programme', 'founder') else ''
    if page == 'about':
        actions = '<div class="school-actions"><a class="cta secondary" id="about-philosophy-jump" href="#about-directions">Читать философию RESTART</a></div>'
    if page in ('about', 'method'):
        page_scripts = script(NAV+'/about.js') + scripts
    if page in ('about', 'method', 'programme'):
        page_design += f'<link rel="stylesheet" href="{tag_path(NAV+"/about.css")}">'
    if page == 'founder':
        page_design += f'<link rel="stylesheet" href="{tag_path(NAV+"/founder.css")}">'
    if page == 'founder' and has_portrait_video:
        hero_image = (
            '<figure class="founder-motion"><div class="founder-portrait">'
            f'<img src="{tag_path(portrait_frame)}" width="540" height="960" alt="Elxan Gülmalıyev" fetchpriority="high">'
            f'<video data-first-frame data-src="{tag_path(portrait_video)}" poster="{tag_path(portrait_frame)}" '
            'muted playsinline autoplay loop preload="none" aria-hidden="true"></video></div>'
            '<figcaption><h2 class="founder-motion-title"><span lang="ru">Мастер владения нунчаками</span>'
            '<span lang="az">Nunçaku ustası</span><span lang="en">Nunchaku practitioner</span></h2></figcaption></figure>'
        )
        page_scripts += script(NAV+'/founder-portrait.js')

    (ROOT/file).write_text(f'''<!doctype html>
<html lang="ru"><head>{common_head}<title>{title} · RESTART</title>{page_design}{motion_design}{page_scripts}{motion_script}{analytics}</head>
<body data-page="{page}"><a class="school-skip" href="#top">К содержанию</a>{header.replace('LANG_ID','lang')}
<main class="school-main" id="top" tabindex="-1">
<div class="school-mast"><div><small id="kicker">{kicker}</small><h1 id="headline">{title}</h1>{credit}<p id="lead">{lead}</p>{actions}</div>{hero_image}</div>
{motto}<p id="notice" role="status"></p><section id="view">{fallbacks.get(page, "")}</section>
</main>{footer}</body></html>
''')

source = (ROOT/NAV/'studio-template.html').read_text()
for file,page in studio.items():
    text = re.sub(r'<header>.*?</header>',header.replace('LANG_ID','language'),source,count=1,flags=re.S)
    text = text.replace('<a class="skip" href="#practices" data-t="skip">Перейти к занятиям</a>', '<a class="school-skip" href="#top">К содержанию</a>')
    text = text.replace('<main id="top">', '<main id="top" tabindex="-1">')
    text = text.replace('<body>',f'<body data-page="{page}">')
    text = text.replace('</head>',design+motion_design+shell+script(NAV+'/studio-shell.js')+analytics+'</head>')
    text = re.sub(r'<footer>.*?</footer>',footer,text,count=1,flags=re.S)
    if page == 'practices':
        text = text.replace('<main id="top" tabindex="-1">','<main id="top" tabindex="-1"><div class="studio-switch"><label for="practice-type" id="practice-type-label">Тип занятия</label><select id="practice-type"><option value="all">Все</option><option value="guided">Практики с таймером</option><option value="video">Видео</option></select></div>',1)
    text = re.sub(r"\./([^\"?]+\.(?:js|css))\?v=[a-f0-9]+", lambda match: tag_path(match[1]), text)
    (ROOT/file).write_text(text)

sw = ROOT/'service-worker.js'
worker = sw.read_text()
match = re.search(r'const ASSETS = (\[.*?\]);',worker,re.S)
assets = {a.split('?')[0]:a for a in json.loads(match[1])}
assets.pop('./'+NAV+'/founder-portrait.js', None)
assets.pop('./'+portrait_frame, None)
if has_portrait_video:
    assets['./'+portrait_frame] = tag_path(portrait_frame)
# The founder gallery is available offline; videos remain on-demand.
for photo in ('group', 'talk', 'outdoors'):
    path = './assets/founder-workshop-' + photo + '.webp'
    assets[path] = path
for file in [*entries,*studio]:
    assets['./'+file] = './'+file
    for script_or_css in re.findall(r'(?:src|href)="(\./[^"]+\.(?:js|css)\?v=[a-f0-9]+)"',(ROOT/file).read_text()):
        assets[script_or_css.split('?')[0]] = script_or_css
values = list(assets.values())
digest = sha256()
for asset in values:
    digest.update((ROOT/asset.split('?')[0]).read_bytes())
worker=worker[:match.start(1)]+json.dumps(values,indent=2)+worker[match.end(1):]
sw.write_text(re.sub("const VERSION = '.*?'",f"const VERSION = '{digest.hexdigest()[:14]}'",worker))
