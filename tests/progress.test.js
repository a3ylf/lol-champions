const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const P = require('../progress.js');
const win = (date = null, player = null, match = null) => ({ date, player, match });

test('legacy saved wins and old links keep their dates unknown', () => {
  assert.deepEqual(P.normalize({ Ahri: 'ganhou' }, true).Ahri, win());
  assert.deepEqual(P.parseHash('#p=Ahri.Amumu.Ahri').Amumu, win());
  assert.equal(Object.keys(P.parseHash('#p=')).length, 0);
});

test('links round-trip dates, unknown dates, players and source matches', () => {
  const input = { Ahri: win(), Amumu: win('2026-08-19', 'Tralhoto#Fish'),
    Brand: win('2026-08-08', 'Cartografia#br1', 'https://www.leagueofgraphs.com/match/br/3270489324') };
  const url = new URL('https://example.com/lol-champions/');
  url.hash = P.shareHash(input);
  assert.deepEqual(P.parseHash(url.hash), P.normalize(input));
});

test('merging fills unknown dates without replacing other wins or known dates', () => {
  const existing = { Ahri: win(), Brand: win('2026-08-01'), Lux: win('2026-09-01') };
  const incoming = { Ahri: win('2026-09-12'), Brand: win('2026-08-08', 'Player', 'https://www.leagueofgraphs.com/match/br/1') };
  const result = P.merge(existing, incoming);
  assert.equal(result.Ahri.date, '2026-09-12');
  assert.deepEqual(result.Brand, win('2026-08-01'));
  assert.equal(result.Lux.date, '2026-09-01');
  assert.equal(existing.Ahri.date, null);
  assert.deepEqual(P.merge(result, incoming), result);
});

test('merging old links never erases dates, and matching dates can gain sources', () => {
  const existing = { Ahri: win('2026-09-01') };
  assert.deepEqual(P.merge(existing, P.parseHash('#p=Ahri')).Ahri, existing.Ahri);
  assert.equal(P.merge(existing, { Ahri: win('2026-09-01', 'Cartografia#br1') }).Ahri.player, 'Cartografia#br1');
});

test('invalid or hostile imports are rejected', () => {
  for (const hash of ['#v=3&p={}', '#v=2&p=bad', '#v=2&p=null', '#p=__proto__', '#p=%ZZ']) {
    assert.throws(() => P.parseHash(hash));
  }
  for (const date of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-9-1', 'bad']) {
    assert.equal(P.validDate(date), false);
    assert.throws(() => P.normalize({ Ahri: win(date) }));
  }
  assert.equal(P.validDate('2024-02-29'), true);
  assert.throws(() => P.normalize({ Ahri: win(null, null, 'javascript:alert(1)') }));
  assert.throws(() => P.decodeDocument({ version: 9, wins: {} }));
});

test('today uses the local calendar date', () => {
  assert.equal(P.today(new Date(2026, 8, 17, 0, 5)), '2026-09-17');
});

test('bundled history matches all 58 CSV records, with 55 dates and 3 unknown', () => {
  const dataDir = path.join(__dirname, '..', 'data');
  const group = P.decodeDocument(JSON.parse(fs.readFileSync(path.join(dataDir, 'arena-wins.json'), 'utf8')));
  const lines = fs.readFileSync(path.join(dataDir, 'arena-win-dates.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
  for (const line of lines) {
    const [id, date, player, match] = line.split(',');
    assert.deepEqual(group[id], win(date || null, player || null, match || null));
  }
  assert.equal(Object.keys(group).length, 58);
  assert.equal(Object.values(group).filter(w => w.date).length, 55);
  assert.deepEqual(Object.keys(group).filter(id => !group[id].date).sort(), ['Ahri', 'DrMundo', 'Xerath']);
  for (const id of ['Amumu', 'Ryze', 'Orianna']) assert.equal(group[id].date, '2026-08-19');
});
