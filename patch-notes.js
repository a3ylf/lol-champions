'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let patch;
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]/g, '');
  const date = value => value.split('-').reverse().join('/');

  function render() {
    const query = normalize($('pesquisa-patch').value);
    let found = 0;
    for (const group of ['buffs', 'nerfs']) {
      const champions = patch[group].filter(champion => normalize(champion.name).includes(query) || normalize(champion.id).includes(query));
      found += champions.length;
      $('total-' + group).textContent = champions.length;
      const fragment = document.createDocumentFragment();
      for (const champion of champions) {
        const card = document.createElement('article');
        card.className = 'mudanca';
        const title = document.createElement('h3');
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
        empty.textContent = query ? 'Nenhum campeão corresponde à busca neste grupo.' : 'Nenhuma mudança neste grupo neste patch.';
        fragment.append(empty);
      }
      $(group).replaceChildren(fragment);
    }
    $('resultado').textContent = `${found} de ${patch.buffs.length + patch.nerfs.length} campeões com mudanças neste patch.`;
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
      render();
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
  load();
})();
