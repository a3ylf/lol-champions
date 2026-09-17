# Arena win dates

Transcribed from the screenshots supplied by the user on 2026-09-17.
The challenge counts Arena 1st-place finishes across the three listed players.
Spreadsheet placements are based on the user's supplied win records; the linked
match pages have not been independently verified. The additional match screenshot
explicitly displays 1st place.

- `arena-win-matches.csv` contains the 18 spreadsheet rows and match links,
  plus the August 19 match shown in the additional screenshots (19 matches).
- `arena-win-dates.csv` contains the 58 champion IDs from the user's progress
  link, with the earliest date listed in the screenshot for each champion.
  A blank date means no calendar date was supplied for that champion. A blank
  match URL means no link was supplied. Neither removes an existing win.
- `arena-win-evidence.csv` records three champion appearances from a second
  screenshot (`image_04f24558-8ee1-4276-96f6-a4ad1ac53e49`) showing a 1st-place
  Bravery Arena finish lasting 24:18. The players are Tralhoto#Fish on Amumu,
  Cartografia#br1 on Ryze, and eyeless#aespa on Orianna. The screenshot only says
  "29 days ago" and contains no match URL. A follow-up screenshot
  (`image_22d9fdc7-f88f-4626-854c-dcf1b0ae27c4`) supplies the exact displayed
  timestamp, August 19, 2026 at 2:09:00 pm. The date is recorded as 2026-08-19
  and the displayed time as 14:09:00, with timezone unknown.

Champion names are normalized to the IDs used by the app and progress link
(for example, Bel'Veth becomes `Belveth` and Lee Sin becomes `LeeSin`).
Dates retain the screenshots' calendar dates; no timezone was supplied.
An earliest listed win is not necessarily the player's or group's first-ever win.

The spreadsheet covers 52 unique champions from 54 champion appearances, dated
2026-08-08 through 2026-09-12. Brand and Fizz each appear twice; their earliest
listed wins are both 2026-08-08.

There are supporting records and calendar dates for 55 of the 58 champions.
Ahri, DrMundo, and Xerath still have no supporting match record in the supplied
images. Those three remain undated in `arena-win-dates.csv`.
The app imports `arena-wins.json` through **Importar histórico do grupo**.
`arena-matches.json` feeds the statistics page with 19 full team match records.
Both are generated from the corresponding CSV files with
`python3 scripts/build_data.py`.

`champion-profiles.json` preserves champion names and tags from Riot Data Dragon
16.18.1, using the first tag as the initial class. AD/AP profiles are editable
conventions, not measurements of the actual match builds or damage. The hybrid
category includes mixed or flexible AD/AP profiles. Locke is deliberately left
undefined for review. All four profile categories, including undefined, stay in
the statistics denominators.
