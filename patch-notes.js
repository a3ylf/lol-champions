'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let patch;
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '');
  const date = value => value.split('-').reverse().join('/');

  function renderGroups(data, groups, prefix, search, noun, result) {
    const query = normalize($(search).value);
    let found = 0;
    for (const group of groups) {
      const champions = data[group].filter(champion => normalize(champion.name).includes(query) || normalize(champion.id).includes(query));
      found += champions.length;
      $('total-' + prefix + group).textContent = champions.length;
      const fragment = document.createDocumentFragment();
      for (const champion of champions) {
        const card = document.createElement('article');
        card.className = 'mudanca';
        const title = document.createElement(prefix ? 'h4' : 'h3');
        title.textContent = champion.name;
        const list = document.createElement('ul');
        for (const change of champion.changes) {
          const item = document.createElement('li');
          item.textContent = change;
          list.append(item);
        }
        card.append(title, list);
        fragment.append(card);
      }
      if (!champions.length) {
        const empty = document.createElement('p');
        empty.className = 'vazio';
        empty.textContent = query ? `Nenhum ${noun} corresponde à busca neste grupo.` : 'Nenhuma mudança neste grupo neste patch.';
        fragment.append(empty);
      }
      $(prefix + group).replaceChildren(fragment);
    }
    const total = groups.reduce((sum, group) => sum + data[group].length, 0);
    $(result).textContent = `${found} de ${total} ${noun === 'item' ? 'itens' : 'campeões'} com mudanças no patch ${data.patch}.`;
  }

  function render() {
    renderGroups(patch, ['buffs', 'nerfs'], '', 'pesquisa-patch', 'campeão', 'resultado');
  }

  function renderItems() {
    renderGroups(patch.items, ['buffs', 'nerfs', 'fixes'], 'itens-', 'pesquisa-itens', 'item', 'resultado-itens');
  }

  async function load() {
    $('status').textContent = 'Carregando patch notes…';
    $('tentar-novamente').hidden = true;
    try {
      const response = await fetch('data/arena-patch-notes.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Falha ao carregar patch notes');
      patch = await response.json();
      $('patch-titulo').textContent = `Patch ${patch.patch}`;
      $('patch-data').textContent = `Notas publicadas em ${date(patch.publishedAt)}`;
      $('revisao').textContent = date(patch.reviewedAt);
      $('fonte').href = patch.source;
      $('patch-itens').textContent = `Últimas mudanças · Patch ${patch.items.patch} · ${date(patch.items.publishedAt)}`;
      $('fonte-itens').href = patch.items.source;
      $('nota-itens').textContent = patch.items.note;
      render();
      renderItems();
      $('conteudo').hidden = false;
      $('status').textContent = '';
    } catch {
      $('conteudo').hidden = true;
      $('status').textContent = 'Não foi possível carregar as notas. Tente novamente.';
      $('tentar-novamente').hidden = false;
    }
  }

  $('pesquisa-patch').addEventListener('input', render);
  $('limpar-pesquisa').addEventListener('click', () => {
    $('pesquisa-patch').value = '';
    render();
    $('pesquisa-patch').focus();
  });
  $('tentar-novamente').addEventListener('click', load);
  $('pesquisa-itens').addEventListener('input', renderItems);
  $('limpar-itens').addEventListener('click', () => {
    $('pesquisa-itens').value = '';
    renderItems();
    $('pesquisa-itens').focus();
  });
  load();
})();
