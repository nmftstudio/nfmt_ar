const CATEGORY_LABEL = {
  dev: 'Dev', tech: 'Tech', soluciones: 'Soluciones', media: 'Media', arte: 'Arte'
};

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

function renderPosts(posts) {
  const grid = document.getElementById('postGrid');
  if (!posts.length) {
    grid.innerHTML = '<p class="empty-state">Todavía no hay posts en esta categoría.</p>';
    return;
  }
  grid.innerHTML = posts.map(p => `
    <a class="post-card" href="/blog/posts/${p.slug}.html">
      <div class="post-card-top">
        <span class="cat-chip cat-${p.category}">${CATEGORY_LABEL[p.category] || p.category}</span>
        <span class="post-date mono">${formatDate(p.date)}</span>
      </div>
      <h3>${p.title}</h3>
      <p class="excerpt">${p.excerpt}</p>
      <span class="read-more">Leer nota →</span>
    </a>
  `).join('');
}

let allPosts = [];

fetch('/assets/data/posts.json')
  .then(r => r.json())
  .then(posts => {
    allPosts = posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    renderPosts(allPosts);
  })
  .catch(() => {
    document.getElementById('postGrid').innerHTML = '<p class="empty-state">No se pudieron cargar los posts.</p>';
  });

document.getElementById('filterBar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const cat = btn.dataset.cat;
  renderPosts(cat === 'todos' ? allPosts : allPosts.filter(p => p.category === cat));
});
