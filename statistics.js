'use strict';
const S = ArenaStatistics;
const $ = id => document.getElementById(id);
const PROFILE_KEY = 'lolArenaProfiles';
const palette = ['#94a3b8', '#d58b5d', '#b184dd', '#589dc8', '#4bb58d', '#d6b65b', '#bdc4cf'];
const damagePalette = ['#df6c68', '#619bea', '#b18aff', '#94a3b8'];
let dataset, defaults, profiles, report;
let overrides = {};
const pct = (n, total) => (total ? n / total * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '%';
const formatDate = date => date.split('-').reverse().join('/');
function el(tag, text) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }

function table(target, headers, rows) {
  const node = el('table');
  const head = el('thead');
  const heading = el('tr');
  headers.forEach(value => { const cell = el('th', value); cell.scope = 'col'; heading.append(cell); });
  head.append(heading);
  const body = el('tbody');
  rows.forEach(row => {
    const tr = el('tr');
    row.forEach(value => { const cell = el('td'); cell.append(value instanceof Node ? value : document.createTextNode(String(value))); tr.append(cell); });
    body.append(tr);
  });
  node.append(head, body);
  $(target).replaceChildren(node);
}

function statCell(count) {
  const cell = el('div', pct(count, report.total));
  cell.append(el('small', `${count} de ${report.total}`));
  return cell;
}

function groupedChart(target, categories, kind, colors, label) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 660 290');
  svg.setAttribute('class', 'grafico');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label + '. Os valores exatos estão na tabela correspondente.');
  function shape(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    svg.append(node);
    return node;
  }
  for (let n = 0; n <= 100; n += 25) {
    const y = 240 - n * 2;
    shape('line', { x1: 44, x2: 650, y1: y, y2: y, stroke: '#43516a', 'stroke-dasharray': '3 4' });
    shape('text', { x: 35, y: y + 4, 'text-anchor': 'end' }, n + '%');
  }
  report.players.forEach((player, i) => {
    const x = 62 + i * 200;
    const width = Math.min(25, 165 / categories.length);
    categories.forEach((category, j) => {
      const count = player[kind][category] || 0;
      const height = report.total ? count / report.total * 200 : 0;
      const bar = shape('rect', { x: x + j * width, y: 240 - height, width: width - 3, height, fill: colors[j] });
      const title = document.createElementNS(NS, 'title');
      title.textContent = `${player.player} · ${kind === 'classes' ? S.classNames[category] : category}: ${count} de ${report.total} (${pct(count, report.total)})`;
      bar.append(title);
    });
    shape('text', { x: x + 75, y: 265, 'text-anchor': 'middle' }, player.player.split('#')[0]);
  });
  const legend = el('div');
  legend.className = 'legenda';
  categories.forEach((category, i) => {
    const item = el('span');
    const swatch = el('i');
    swatch.style.background = colors[i];
    item.append(swatch, document.createTextNode(kind === 'classes' ? S.classNames[category] : category));
    legend.append(item);
  });
  $(target).replaceChildren(svg, legend);
}

function topComposition(kind, labelId, countId) {
  const top = report[kind][0];
  $(labelId).textContent = top ? top.label : 'Sem partidas';
  const ties = top ? report[kind].filter(item => item.count === top.count).length : 0;
  $(countId).textContent = top ? `${top.count} vitórias · ${pct(top.count, report.total)}` + (ties > 1 ? ` · empate entre ${ties} composições` : '') : 'Ajuste o período.';
}

function render() {
  if (!dataset) return;
  const start = $('inicio').value, end = $('fim').value;
  if (start && end && start > end) {
    $('status').textContent = 'A data inicial precisa ser anterior ou igual à data final.';
    $('exportar-partidas').disabled = true;
    $('exportar-resumo').disabled = true;
    return;
  }
  $('exportar-partidas').disabled = false;
  $('exportar-resumo').disabled = false;
  $('status').textContent = '';
  report = S.summarize(dataset, profiles, { start, end, ordered: $('ordem').value === 'players' });
  $('total').textContent = report.total;
  $('unicos').textContent = `${report.unique} campeões distintos neste período`;
  const count = report.players[1]?.classes.Tank || 0;
  $('tanque').textContent = pct(count, report.total);
  $('tanque-contagem').textContent = `${count} de ${report.total} partidas`;
  topComposition('classes', 'classe-top', 'classe-top-porcentagem');
  topComposition('damage', 'dano-top', 'dano-top-porcentagem');
  const dates = report.matches.map(m => m.date).sort();
  $('periodo').textContent = dataset.players.join(' · ') + (dates.length ? ` | ${formatDate(dates[0])} a ${formatDate(dates.at(-1))}` : ' | Nenhuma partida no período');
  const classes = [...S.classes];
  if (report.players.some(p => p.classes.Unknown)) classes.push('Unknown');
  table('tabela-classes', ['Jogador', ...classes.map(c => S.classNames[c])], report.players.map(p => [p.player, ...classes.map(c => statCell(p.classes[c] || 0))]));
  table('tabela-dano', ['Jogador', ...S.damageTypes], report.players.map(p => [p.player, ...S.damageTypes.map(c => statCell(p.damage[c] || 0))]));
  groupedChart('grafico-classes', classes, 'classes', palette, 'Participação das classes por jogador');
  groupedChart('grafico-dano', S.damageTypes, 'damage', damagePalette, 'Perfis convencionais AD e AP por jogador');
  $('ordem-nota').textContent = $('ordem').value === 'players' ? 'Ordem: ' + dataset.players.map(p => p.split('#')[0]).join(' → ') : 'Os mesmos três perfis contam juntos, independentemente de quem os jogou.';
  table('tabela-composicoes', ['Composição de classes', 'Vitórias', '% das vitórias'], report.classes.map(c => [c.label, c.count, pct(c.count, report.total)]));
  const bars = report.classes.slice(0, 5).map(item => {
    const row = el('div'); row.className = 'barra-linha';
    const title = el('div'); title.append(el('span', item.label), el('strong', item.count));
    const track = el('div'); track.className = 'trilho';
    const bar = el('div'); bar.style.width = item.count / report.classes[0].count * 100 + '%';
    track.append(bar); row.append(title, track); return row;
  });
  $('grafico-composicoes').replaceChildren(...(bars.length ? bars : [el('p', 'Nenhuma partida no período.')]));
  table('tabela-partidas', ['Data', ...dataset.players, 'Partida'], report.matches.map(m => {
    const link = m.url ? el('a', 'Ver partida ↗') : el('span', 'Screenshot; sem link');
    if (m.url) { link.href = m.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    return [formatDate(m.date), ...m.champions.map(id => profiles[id]?.name || id), link];
  }));
}

function profileEditor() {
  const rows = Object.entries(profiles).sort((a, b) => a[1].name.localeCompare(b[1].name, 'pt-BR')).map(([id, profile]) => {
    function select(field, values, names) {
      const input = el('select');
      input.dataset.champion = id; input.dataset.field = field;
      input.setAttribute('aria-label', `${field === 'class' ? 'Classe' : 'Perfil AD/AP'} de ${profile.name}`);
      values.forEach(value => { const option = el('option', names ? names[value] : value); option.value = value; input.append(option); });
      input.value = profile[field];
      return input;
    }
    return [profile.name, select('class', S.classes, S.classNames), select('damage', S.damageTypes)];
  });
  table('tabela-perfis', ['Campeão', 'Classe', 'Perfil convencional'], rows);
}

function exportFile(filename, rows) {
  const url = URL.createObjectURL(new Blob([S.csv(rows)], { type: 'text/csv;charset=utf-8' }));
  const a = el('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('exportar-partidas').addEventListener('click', () => {
  if (!report) return;
  const headings = ['Data', 'Partida', ...dataset.players.flatMap(p => [p + ' campeão', p + ' classe', p + ' perfil convencional'])];
  exportFile('arena-partidas.csv', [headings, ...report.matches.map(m => [m.date, m.url || '', ...m.champions.flatMap(id => [profiles[id]?.name || id, S.classNames[profiles[id]?.class] || 'Não definido', profiles[id]?.damage || 'Não definido'])])]);
});
$('exportar-resumo').addEventListener('click', () => {
  if (!report) return;
  const mode = $('ordem').value === 'players' ? dataset.players.join(' | ') : 'Sem ordem dos jogadores';
  const rows = [['Métrica', 'Jogador ou ordem', 'Categoria', 'Vitórias', 'Total de partidas', 'Percentual']];
  for (const player of report.players) {
    for (const [category, count] of Object.entries(player.classes)) rows.push(['Classe', player.player, S.classNames[category], count, report.total, pct(count, report.total)]);
    for (const [category, count] of Object.entries(player.damage)) rows.push(['Perfil convencional', player.player, category, count, report.total, pct(count, report.total)]);
  }
  for (const kind of ['classes', 'damage']) for (const item of report[kind]) rows.push([kind === 'classes' ? 'Composição de classes' : 'Composição de perfis', mode, item.label, item.count, report.total, pct(item.count, report.total)]);
  exportFile('arena-resumo.csv', rows);
});
$('imprimir').addEventListener('click', () => window.print());
['inicio', 'fim', 'ordem'].forEach(id => $(id).addEventListener('change', render));
$('limpar-filtros').addEventListener('click', () => { $('inicio').value = ''; $('fim').value = ''; render(); });
$('tabela-perfis').addEventListener('change', e => {
  const { champion, field } = e.target.dataset;
  if (!profiles[champion] || !['class', 'damage'].includes(field)) return;
  const next = { ...overrides, [champion]: { ...overrides[champion], [field]: e.target.value } };
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); }
  catch { $('status').textContent = 'Não foi possível salvar a classificação neste navegador.'; profileEditor(); return; }
  overrides = next;
  profiles[champion][field] = e.target.value;
  render();
});
$('restaurar-perfis').addEventListener('click', () => {
  if (!confirm('Restaurar todas as classificações iniciais dos campeões?')) return;
  try { localStorage.removeItem(PROFILE_KEY); }
  catch { $('status').textContent = 'Não foi possível restaurar as classificações.'; return; }
  overrides = {};
  profiles = structuredClone(defaults.champions);
  profileEditor(); render();
});

async function load() {
  try {
    async function json(url) { const response = await fetch(url, { cache: 'no-cache' }); if (!response.ok) throw new Error(); return response.json(); }
    [dataset, defaults] = window.ArenaSnapshot || await Promise.all([json('data/arena-matches.json'), json('data/champion-profiles.json')]);
    profiles = structuredClone(defaults.champions);
    let storageWarning = false;
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      for (const [id, values] of Object.entries(saved || {})) {
        if (!Object.hasOwn(profiles, id) || !values || typeof values !== 'object') continue;
        overrides[id] = {};
        if (S.classes.includes(values.class)) overrides[id].class = values.class;
        if (S.damageTypes.includes(values.damage)) overrides[id].damage = values.damage;
        Object.assign(profiles[id], overrides[id]);
      }
    } catch { storageWarning = true; }
    $('metodo-classes').textContent = `Classe inicial: primeira tag do Riot Data Dragon ${defaults.version}. Você pode ajustar a classe para representar o papel que o campeão teve na Arena.`;
    $('metodo-dano').textContent = defaults.damageNote + ' Locke está sem perfil definido para revisão.';
    $('fonte-classes').href = defaults.source;
    profileEditor(); render();
    if (storageWarning) $('status').textContent = 'As classificações salvas não puderam ser lidas. Exibindo as classificações iniciais.';
  } catch { $('status').textContent = 'Não foi possível carregar as estatísticas. Verifique a conexão e recarregue a página.'; $('periodo').textContent = 'Histórico indisponível.'; }
}
load();
