# LoL Champions — Arena

Static champion tracker for Arena 1st-place finishes, with editable win dates
and a statistics page for the group's recorded matches. No API key or build
step is needed to run the site.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Use an HTTP server rather than opening the HTML
file directly, so the browser can fetch the local JSON data.

## Load the group's wins

Select **Importar histórico do grupo**, review the counts, then **Mesclar
progresso**. This adds 58 wins and fills 55 dates. Ahri, Dr. Mundo, and Xerath
remain undated. Known dates and unrelated wins already saved in the browser
are preserved. Repeating the import does not duplicate wins.

New individual wins default to today's local date. Click the date to edit it
or leave it unknown. Bulk marking keeps new dates unknown. Editing a historical
date clears its player/source metadata so it cannot falsely cite the old match.

Existing `lolMarcas` saves migrate in memory without inventing dates. New changes
are stored under `lolArenaProgress`; the original legacy save remains untouched.
Shared links include dates and available match sources. Old links still work.
Opening any progress link displays a merge/replace preview before changing data.
Other open tabs on the same origin update through browser storage events.

Progress remains local to each browser. Shared links are snapshots, not live
synchronization. To move updated dates to another device, create a new link.

## Statistics

**Estatísticas do grupo** opens the 19-match dashboard. It includes date filters,
class and conventional AD/AP distributions, compositions with or without player
order, editable champion classifications, source match links, CSV exports and
print/PDF styling. All percentages use the filtered number of matches, not the
number of unique champions. Repeated champion wins count separately here.

`reports/arena-statistics.html` is a self-contained copy of the interactive
report: open it directly in a browser, without a server. Regenerate it with
`python3 scripts/build_report.py` after changing the dashboard or its data.
The `reports/` directory also includes CSV exports and a printable PDF of the
initial 19-match report. Those are snapshots; export them again from the updated
dashboard when the data or classifications change.

The dashboard uses complete team match records; checking a champion in the
tracker cannot supply the other two players or a team composition. These are
counts within recorded wins, not win rates. Losses are not available.

Initial classes use the first tag in Riot Data Dragon 16.18.1. AD/AP labels are
explicitly revisable conventions, not observed builds or measured damage;
Locke is left undefined for review. Browser overrides affect charts and exports
but do not change the original dataset or travel in champion progress links.

## Arena patch notes

**Patch notes do Arena** opens `patch-notes.html`, with separate buff and nerf
lists and champion search. The local snapshot covers champion changes in the
Arena section of Riot's patch 26.19 notes, published September 22, 2026 and
reviewed September 23. Each entry is a brief summary; the page links to the
complete official notes for exact values and changes to augments and items.

Update `data/arena-patch-notes.json` manually after reviewing a new patch:
replace the patch number, publication/review dates, official source URL, and
both champion lists. These notes do not update automatically. Include only
Arena-specific champion changes and keep each champion in the appropriate
buff or nerf list; mixed changes should be described explicitly rather than
silently classified as a pure buff or nerf.

## Update the reviewed history

1. Add full team matches to `data/arena-win-matches.csv`.
2. Update each champion's earliest supported date in `data/arena-win-dates.csv`.
   Keep unknown dates blank. Add a champion profile to
   `data/champion-profiles.json` when necessary.
3. Run `python3 scripts/build_data.py` to regenerate the two JSON datasets.
4. Run the tests and publish all the site's HTML, JS, CSS and `data/` files.
5. Import the updated group history in each browser, or share a new progress
   link from a browser that already imported it.

## Verify

```sh
node tests/progress.test.js
node tests/statistics.test.js
```

See `data/README.md` for the evidence and date provenance.
