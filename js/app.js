const state = { tools: [], categories: [], activeCategory: 'all', query: '' };

async function init() {
  const res = await fetch('data/tools.json');
  const data = await res.json();
  state.tools = data.tools;
  state.categories = data.categories;
  renderCategoryFilter();
  render();
  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value.toLowerCase();
    render();
  });
}

function renderCategoryFilter() {
  const wrap = document.getElementById('category-filter');
  wrap.appendChild(makeCategoryButton('all', 'All Tools'));
  state.categories.forEach(c => wrap.appendChild(makeCategoryButton(c.id, c.label)));
}

function makeCategoryButton(id, label) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.id = id;
  if (id === state.activeCategory) btn.classList.add('active');
  btn.addEventListener('click', () => {
    state.activeCategory = id;
    document.querySelectorAll('.category-filter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
  return btn;
}

function render() {
  const grid = document.getElementById('tool-grid');
  grid.innerHTML = '';
  const filtered = state.tools.filter(t => {
    const matchesCategory = state.activeCategory === 'all' || t.category === state.activeCategory;
    const matchesQuery = !state.query || t.name.toLowerCase().includes(state.query) || (t.description || '').toLowerCase().includes(state.query);
    return matchesCategory && matchesQuery;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state">No tools match your search.</div>';
    return;
  }

  filtered.forEach(t => {
    const a = document.createElement('a');
    a.className = 'tool-card';
    a.href = t.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const catLabel = (state.categories.find(c => c.id === t.category) || {}).label || t.category;
    a.innerHTML = `
      <div class="icon">${t.icon || '🔗'}</div>
      <h3>${t.name}</h3>
      <p>${t.description || ''}</p>
      <span class="category-tag">${catLabel}</span>
    `;
    grid.appendChild(a);
  });
}

init();
