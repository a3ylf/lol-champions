(function (root) {
  'use strict';
  const classes = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];
  const classNames = { Tank: 'Tanque', Fighter: 'Lutador', Assassin: 'Assassino', Mage: 'Mago', Marksman: 'Atirador', Support: 'Suporte', Unknown: 'Não definido' };
  const damageTypes = ['AD', 'AP', 'Híbrido', 'Não definido'];

  function summarize(data, profiles, { start = '', end = '', ordered = true } = {}) {
    const matches = data.matches.filter(m => (!start || m.date >= start) && (!end || m.date <= end));
    const players = data.players.map(player => ({ player, classes: {}, damage: {} }));
    const compositions = { classes: new Map(), damage: new Map() };
    const unique = new Set();
    for (const match of matches) {
      const values = { classes: [], damage: [] };
      match.champions.forEach((id, i) => {
        unique.add(id);
        const profile = profiles[id] || {};
        const role = classes.includes(profile.class) ? profile.class : 'Unknown';
        const damage = damageTypes.includes(profile.damage) ? profile.damage : 'Não definido';
        players[i].classes[role] = (players[i].classes[role] || 0) + 1;
        players[i].damage[damage] = (players[i].damage[damage] || 0) + 1;
        values.classes.push(classNames[role]);
        values.damage.push(damage);
      });
      for (const kind of ['classes', 'damage']) {
        const key = (ordered ? values[kind] : values[kind].sort((a, b) => a.localeCompare(b, 'pt-BR'))).join(' | ');
        compositions[kind].set(key, (compositions[kind].get(key) || 0) + 1);
      }
    }
    const sorted = map => [...map].map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
    return { matches, total: matches.length, unique: unique.size, players,
      classes: sorted(compositions.classes), damage: sorted(compositions.damage) };
  }

  function csv(rows) {
    return '\uFEFF' + rows.map(row => row.map(value => {
      let text = String(value ?? '');
      if (/^[=+@-]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    }).join(',')).join('\r\n') + '\r\n';
  }
  const api = { classes, classNames, damageTypes, summarize, csv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArenaStatistics = api;
})(globalThis);
