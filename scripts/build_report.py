"""Build a portable, interactive report that can be opened without a web server."""
import json
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
REPORTS = ROOT / 'reports'
REPORTS.mkdir(exist_ok=True)
data = json.loads((ROOT / 'data/arena-matches.json').read_text())
profiles = json.loads((ROOT / 'data/champion-profiles.json').read_text())
snapshot = json.dumps([data, profiles], ensure_ascii=False).replace('<', '\\u003c')
html = (ROOT / 'statistics.html').read_text()
html = html.replace('<link rel="stylesheet" href="statistics.css">', '<style>\n' + (ROOT / 'statistics.css').read_text() + '</style>')
html = html.replace('<link rel="stylesheet" href="navigation.css">', '<style>\n' + (ROOT / 'navigation.css').read_text() + '</style>')
html = html.replace('<script src="statistics-model.js"></script>', '<script>\n' + (ROOT / 'statistics-model.js').read_text() + '</script>')
html = html.replace('<script src="statistics.js"></script>', '<script>\nwindow.ArenaSnapshot = ' + snapshot + ';\n' + (ROOT / 'statistics.js').read_text() + '</script>')
html = html.replace('href="index.html"', 'href="https://a3ylf.github.io/lol-champions/"')
html = html.replace('href="statistics.html"', 'href="#"')
html = html.replace('href="patch-notes.html"', 'href="https://a3ylf.github.io/lol-champions/patch-notes.html"')
source = 'data:text/csv;charset=utf-8,' + quote((ROOT / 'data/arena-win-matches.csv').read_text())
html = html.replace('href="data/arena-win-matches.csv" download', 'href="' + source + '" download="arena-win-matches.csv"')
(REPORTS / 'arena-statistics.html').write_text(html)
print(f"Created reports/arena-statistics.html (self-contained, {len(data['matches'])}-match snapshot).")
