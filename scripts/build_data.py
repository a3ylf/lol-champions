"""Regenerate the app's JSON imports from the reviewed CSV files. No network needed."""
import csv
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / 'data'


def write_json(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


with (DATA / 'arena-win-dates.csv').open() as source:
    wins = {
        row['champion_id']: {
            'date': row['earliest_listed_win_date'] or None,
            'player': row['player'] or None,
            'match': row['match_url'] or None,
        }
        for row in csv.DictReader(source)
    }

with (DATA / 'arena-win-matches.csv').open() as source:
    reader = csv.DictReader(source)
    players = reader.fieldnames[1:4]
    matches = [
        {'date': row['match_date'], 'champions': [row[p] for p in players], 'url': row['match_url'] or None}
        for row in reader
    ]

write_json('arena-wins.json', {'version': 2, 'wins': wins})
write_json('arena-matches.json', {'players': players, 'matches': matches})
print(f'Generated {len(wins)} champion records and {len(matches)} match records.')
