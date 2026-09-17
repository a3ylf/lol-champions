const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../statistics-model.js');
const data = require('../data/arena-matches.json');
const profiles = require('../data/champion-profiles.json').champions;

test('counts matches, repeated champions and per-player denominators separately', () => {
  const report = S.summarize(data, profiles);
  assert.equal(report.total, 19);
  assert.equal(report.unique, 55);
  for (const player of report.players) {
    assert.equal(Object.values(player.classes).reduce((a, b) => a + b, 0), 19);
    assert.equal(Object.values(player.damage).reduce((a, b) => a + b, 0), 19);
  }
  assert.equal(report.classes.reduce((n, c) => n + c.count, 0), 19);
  assert.equal(report.damage.reduce((n, c) => n + c.count, 0), 19);
  assert.equal(report.players[1].classes.Tank, 2); // Amumu and Cho'Gath.
  assert.equal(report.players[0].damage['Não definido'], 1);
});

test('date filters are inclusive and handle empty periods', () => {
  const report = S.summarize(data, profiles, { start: '2026-08-19', end: '2026-08-19' });
  assert.equal(report.total, 1);
  assert.deepEqual(report.matches[0].champions, ['Ryze', 'Amumu', 'Orianna']);
  const empty = S.summarize(data, profiles, { start: '2027-01-01' });
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.classes, []);
});

test('composition grouping can preserve or ignore player order', () => {
  const sample = { players: ['A', 'B', 'C'], matches: [
    { date: '2026-01-01', champions: ['Ashe', 'Amumu', 'Lux'] },
    { date: '2026-01-02', champions: ['Lux', 'Ashe', 'Amumu'] },
  ] };
  assert.equal(S.summarize(sample, profiles).classes.length, 2);
  const grouped = S.summarize(sample, profiles, { ordered: false });
  assert.equal(grouped.classes.length, 1);
  assert.equal(grouped.classes[0].count, 2);
});

test('reviewed champion classifications change counts without mutating source data', () => {
  const reviewed = structuredClone(profiles);
  reviewed.Amumu.class = 'Mage';
  reviewed.Locke.damage = 'AD';
  const report = S.summarize(data, reviewed);
  assert.equal(report.players[1].classes.Tank || 0, 1); // Cho'Gath remains.
  assert.equal(report.players[0].damage['Não definido'] || 0, 0);
  assert.equal(profiles.Amumu.class, 'Tank');
});

test('missing champion classifications remain visible instead of dropping matches', () => {
  const report = S.summarize(data, {});
  assert.equal(report.total, 19);
  assert.equal(report.players[0].classes.Unknown, 19);
  assert.equal(report.players[0].damage['Não definido'], 19);
});

test('CSV output handles accents, commas, quotes, and spreadsheet formulas', () => {
  assert.equal(S.csv([['Mago, suporte', 'Vitória "boa"', '=1+1']]), '\uFEFF"Mago, suporte","Vitória ""boa""","\'=1+1"\r\n');
});

test('match JSON agrees with all 19 source CSV rows and player order', () => {
  const rows = fs.readFileSync(path.join(__dirname, '../data/arena-win-matches.csv'), 'utf8').trim().split(/\r?\n/).map(row => row.split(','));
  assert.deepEqual(data.players, rows[0].slice(1, 4));
  assert.deepEqual(data.matches, rows.slice(1).map(row => ({ date: row[0], champions: row.slice(1, 4), url: row[4] || null })));
});
