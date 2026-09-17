'use strict';
const API = 'https://ddragon.leagueoflegends.com';
const STORAGE_KEY = 'lolArenaProgress';
const P = ArenaProgress;
const $ = id => document.getElementById(id);
let campeoes = [];
let versao = '';
let filtro = 'todos';
let busca = '';
let pendente = null;
let editando = null;
let armazenamentoValido = true;
let marcas = lerProgresso();

function avisar(texto) { $('aviso').textContent = texto; }

function lerProgresso() {
  try {
    const atual = localStorage.getItem(STORAGE_KEY);
    if (atual !== null) return P.decodeDocument(JSON.parse(atual));
    const antigo = localStorage.getItem('lolMarcas');
    return antigo === null ? P.normalize({}) : P.normalize(JSON.parse(antigo), true);
  } catch {
    armazenamentoValido = false;
    avisar('Não foi possível ler o progresso salvo. Os dados originais foram preservados.');
    return P.normalize({});
  }
}

function salvar(proximo) {
  if (!armazenamentoValido) {
    avisar('O progresso salvo não pôde ser lido. Corrija o armazenamento do navegador antes de salvar alterações.');
    return false;
  }
  try {
    const limpo = P.normalize(proximo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, wins: limpo }));
    marcas = limpo;
    renderizar();
    return true;
  } catch {
    avisar('Não foi possível salvar. Seu progresso anterior foi mantido; verifique o armazenamento do navegador.');
    return false;
  }
}

async function buscarJSON(url) {
  const resposta = await fetch(url, { cache: 'no-cache' });
  if (!resposta.ok) throw new Error('Falha ao carregar dados.');
  return resposta.json();
}

async function carregar() {
  try {
    const versoes = await buscarJSON(API + '/api/versions.json');
    versao = versoes[0];
    const dados = await buscarJSON(`${API}/cdn/${versao}/data/pt_BR/champion.json`);
    campeoes = Object.values(dados.data)
      .map(c => ({ id: c.id, nome: c.name }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    renderizar();
  } catch {
    $('grade').innerHTML = '<p class="vazio">Não foi possível carregar os campeões. Verifique sua conexão e recarregue a página.</p>';
  }
}

function dataFormatada(data) { return data.split('-').reverse().join('/'); }

function renderizar() {
  if (!campeoes.length) return;
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const lista = campeoes.filter(c => {
    if (termo && !c.nome.toLocaleLowerCase('pt-BR').includes(termo)) return false;
    if (filtro === 'ganhou' && !marcas[c.id]) return false;
    if (filtro === 'sem-marca' && marcas[c.id]) return false;
    return true;
  });
  const fragmento = document.createDocumentFragment();
  for (const c of lista) {
    const vitoria = marcas[c.id];
    const card = document.createElement('div');
    card.className = 'card' + (vitoria ? ' ganhou' : '');
    card.dataset.id = c.id;
    const botao = document.createElement('button');
    botao.className = 'campeao';
    botao.setAttribute('aria-pressed', String(Boolean(vitoria)));
    botao.setAttribute('aria-label', `${c.nome}: ${vitoria ? 'remover' : 'marcar'} 1º lugar`);
    const img = document.createElement('img');
    img.src = `${API}/cdn/${versao}/img/champion/${c.id}.png`;
    img.alt = '';
    img.loading = 'lazy';
    const nome = document.createElement('span');
    nome.textContent = c.nome;
    botao.append(img, nome);
    if (vitoria) {
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = '✔';
      badge.setAttribute('aria-hidden', 'true');
      botao.append(badge);
    }
    card.append(botao);
    if (vitoria) {
      const data = document.createElement('button');
      data.className = 'data-vitoria';
      data.textContent = vitoria.date ? '1º · ' + dataFormatada(vitoria.date) : 'Data desconhecida · editar';
      data.setAttribute('aria-label', `Editar data de ${c.nome}: ${vitoria.date ? dataFormatada(vitoria.date) : 'desconhecida'}`);
      card.append(data);
    }
    fragmento.append(card);
  }
  if (!lista.length) {
    const vazio = document.createElement('p');
    vazio.className = 'vazio';
    vazio.textContent = 'Nenhum campeão encontrado.';
    fragmento.append(vazio);
  }
  $('grade').replaceChildren(fragmento);
  const ganhos = campeoes.filter(c => marcas[c.id]);
  const comData = ganhos.filter(c => marcas[c.id].date).length;
  const pct = (ganhos.length / campeoes.length * 100).toFixed(1);
  $('placar').textContent = `1º lugar: ${ganhos.length} de ${campeoes.length} (${pct}%) · ${comData} com data · ${ganhos.length - comData} sem data`;
  $('progresso').style.width = pct + '%';
}

function editarData(id) {
  editando = id;
  const vitoria = marcas[id];
  $('titulo-data').textContent = 'Vitória de ' + campeoes.find(c => c.id === id).nome;
  $('data-vitoria').value = vitoria.date || '';
  $('jogador-vitoria').textContent = vitoria.player ? 'Jogador: ' + vitoria.player : '';
  $('partida-vitoria').hidden = !vitoria.match;
  if (vitoria.match) $('partida-vitoria').href = vitoria.match;
  else $('partida-vitoria').removeAttribute('href');
  $('editar-data').showModal();
}

$('grade').addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  if (e.target.closest('.data-vitoria')) return editarData(card.dataset.id);
  if (!e.target.closest('.campeao')) return;
  const proximo = P.normalize(marcas);
  const id = card.dataset.id;
  if (proximo[id]) delete proximo[id];
  else proximo[id] = { date: P.today(), player: null, match: null };
  if (salvar(proximo)) avisar(proximo[id] ? '1º lugar registrado com a data de hoje. Clique na data para ajustá-la.' : 'Vitória removida.');
});

$('form-data').addEventListener('submit', e => {
  e.preventDefault();
  const data = $('data-vitoria').value || null;
  if (data !== null && !P.validDate(data)) return;
  const proximo = P.normalize(marcas);
  if (!proximo[editando]) return $('editar-data').close();
  // A manually changed date is no longer supported by the old match link.
  if (data !== proximo[editando].date) proximo[editando] = { date: data, player: null, match: null };
  if (salvar(proximo)) {
    $('editar-data').close();
    avisar('Data salva.');
  }
});
$('cancelar-data').addEventListener('click', () => $('editar-data').close());

$('pesquisa').addEventListener('input', e => { busca = e.target.value; renderizar(); });
document.querySelectorAll('.filtros button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.filtros button').forEach(x => x.classList.remove('ativo'));
    b.classList.add('ativo');
    filtro = b.dataset.filtro;
    renderizar();
  });
});

$('marcar-todos-ganhou').addEventListener('click', () => {
  if (!campeoes.length || !confirm('Marcar TODOS os campeões como ganho? As novas marcas ficarão sem data.')) return;
  const proximo = P.normalize(marcas);
  campeoes.forEach(c => { if (!proximo[c.id]) proximo[c.id] = { date: null, player: null, match: null }; });
  if (salvar(proximo)) avisar('Todos marcados. As datas existentes foram preservadas.');
});
$('limpar').addEventListener('click', () => {
  if (confirm('Limpar todas as vitórias e datas?') && salvar({})) avisar('Progresso limpo.');
});

function mostrarImportacao(wins, origem) {
  pendente = { wins, origem };
  const total = Object.keys(wins).length;
  const datas = Object.values(wins).filter(w => w.date).length;
  $('titulo-importacao').textContent = origem === 'grupo' ? 'Histórico do grupo' : 'Progresso do link';
  $('resumo-importacao').textContent = `${total} campeões com 1º lugar · ${datas} com data · ${total - datas} sem data.` +
    (origem === 'grupo' ? ' Cartografia, Tralhoto e eyeless. Registros fornecidos até 17/09/2026.' : ' Revise antes de importar.');
  $('substituir').hidden = origem === 'grupo';
  $('explica-substituir').hidden = origem === 'grupo';
  $('importacao').showModal();
}

function limparHash() { history.replaceState(null, '', location.pathname + location.search); }

function aplicarImportacao(substituir) {
  if (!pendente) return;
  const proximo = substituir ? pendente.wins : P.merge(marcas, pendente.wins);
  if (!salvar(proximo)) return;
  if (pendente.origem === 'link') limparHash();
  pendente = null;
  $('importacao').close();
  avisar('Progresso importado e salvo neste navegador. Compartilhe um novo link para levar as datas a outro dispositivo.');
}
$('mesclar').addEventListener('click', () => aplicarImportacao(false));
$('substituir').addEventListener('click', () => aplicarImportacao(true));
function cancelarImportacao() {
  if (pendente?.origem === 'link') limparHash();
  pendente = null;
  $('importacao').close();
}
$('cancelar-importacao').addEventListener('click', cancelarImportacao);
$('importacao').addEventListener('cancel', e => {
  e.preventDefault();
  cancelarImportacao();
});

$('importar-historico').addEventListener('click', async () => {
  const botao = $('importar-historico');
  botao.disabled = true;
  try {
    const wins = P.decodeDocument(await buscarJSON('data/arena-wins.json'));
    mostrarImportacao(wins, 'grupo');
  } catch {
    avisar('Não foi possível carregar o histórico do grupo. Verifique sua conexão e tente novamente.');
  } finally { botao.disabled = false; }
});

$('gerar-link').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.hash = P.shareHash(marcas);
  try {
    await navigator.clipboard.writeText(url.href);
    avisar('Link copiado com vitórias e datas. Quem abrir poderá revisar e mesclar o progresso.');
  } catch { prompt('Copie o link com vitórias e datas:', url.href); }
});

function importarDoLink() {
  if ($('importacao').open || $('editar-data').open) return;
  try {
    const wins = P.parseHash(location.hash);
    if (wins !== null) mostrarImportacao(wins, 'link');
  } catch { avisar('Este link de progresso é inválido. Seu progresso salvo não foi alterado.'); }
}
window.addEventListener('hashchange', importarDoLink);
window.addEventListener('storage', e => {
  if (e.key !== STORAGE_KEY && e.key !== null) return;
  armazenamentoValido = true;
  marcas = lerProgresso();
  if ($('editar-data').open) $('editar-data').close();
  renderizar();
  if (armazenamentoValido) avisar('Progresso atualizado por outra aba.');
});

importarDoLink();
carregar();
