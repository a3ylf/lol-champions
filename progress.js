(function (root) {
  'use strict';

  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value + 'T00:00:00Z')) &&
      new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  }

  function normalize(input, legacy = false) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Progresso inválido.');
    const wins = Object.create(null);
    for (const [id, value] of Object.entries(input)) {
      if (!/^[A-Z][A-Za-z0-9]{0,49}$/.test(id)) throw new Error('Campeão inválido.');
      if (legacy && value === 'ganhou') {
        wins[id] = { date: null, player: null, match: null };
        continue;
      }
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Vitória inválida.');
      const { date = null, player = null, match = null } = value;
      if (date !== null && !validDate(date)) throw new Error('Data inválida.');
      if (player !== null && (typeof player !== 'string' || player.length > 100)) throw new Error('Jogador inválido.');
      if (match !== null && (typeof match !== 'string' || !/^https:\/\/www\.leagueofgraphs\.com\/match\/[a-z0-9]+\/\d+$/.test(match))) {
        throw new Error('Link de partida inválido.');
      }
      wins[id] = { date, player, match };
    }
    return wins;
  }

  function decodeDocument(value) {
    if (!value || value.version !== 2) throw new Error('Versão de progresso não reconhecida.');
    return normalize(value.wins);
  }

  function parseHash(hash) {
    if (!hash || hash === '#') return null;
    const params = new URLSearchParams(hash.slice(1));
    if (params.has('v')) {
      if (params.get('v') !== '2' || !params.has('p')) throw new Error('Link de progresso inválido.');
      return normalize(JSON.parse(params.get('p')));
    }
    if (!params.has('p')) return null;
    const wins = Object.create(null);
    for (const id of params.get('p').split('.').filter(Boolean)) wins[id] = 'ganhou';
    return normalize(wins, true);
  }

  function shareHash(wins) {
    return '#v=2&p=' + encodeURIComponent(JSON.stringify(normalize(wins)));
  }

  // Existing dates take priority. A source belongs to its date, so never attach
  // an incoming match to a different date already recorded by the user.
  function merge(existing, incoming) {
    const result = normalize(existing);
    for (const [id, win] of Object.entries(normalize(incoming))) {
      if (!result[id] || (!result[id].date && win.date)) result[id] = win;
      else if (result[id].date === win.date) {
        result[id] = {
          date: result[id].date,
          player: result[id].player || win.player,
          match: result[id].match || win.match,
        };
      }
    }
    return result;
  }

  function today(now = new Date()) {
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  const api = { validDate, normalize, decodeDocument, parseHash, shareHash, merge, today };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ArenaProgress = api;
})(globalThis);
