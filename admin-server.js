const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const WEB_ROOT = __dirname;

const CATEGORY_LABEL = {
  dev: 'Dev',
  tech: 'Tech',
  soluciones: 'Soluciones',
  media: 'Media',
  arte: 'Arte'
};

function formatDate(dateStr) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = parts[2];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${months[monthIdx] || ''} ${year}`;
}

function cleanSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD') // Quitar acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Servir admin.html
  if (req.method === 'GET' && (pathname === '/' || pathname === '/admin.html')) {
    fs.readFile(path.join(WEB_ROOT, 'admin.html'), 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error cargando admin.html: ' + err.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  // API para crear posts
  if (req.method === 'POST' && pathname === '/api/posts') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const postData = JSON.parse(body);
        const { title, category, excerpt, readMinutes, content, date } = postData;

        if (!title || !category || !excerpt || !readMinutes || !content || !date) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Faltan campos obligatorios.' }));
          return;
        }

        const slug = cleanSlug(title);
        const postFileName = `${slug}.html`;
        const postFilePath = path.join(WEB_ROOT, 'blog', 'posts', postFileName);

        // Verificar si ya existe
        if (fs.existsSync(postFilePath)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Ya existe un post con el slug "${slug}".` }));
          return;
        }

        // 1. Cargar plantilla desde uno de los posts existentes
        const templatePath = path.join(WEB_ROOT, 'blog', 'posts', 'la-estetica-arcade-noir-de-nmft.html');
        fs.readFile(templatePath, 'utf8', (err, htmlTemplate) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No se pudo leer la plantilla del blog: ' + err.message }));
            return;
          }

          // 2. Reemplazar los marcadores utilizando expresiones regulares sobre los bloques específicos
          let outputHtml = htmlTemplate;

          // Reemplazar título
          outputHtml = outputHtml.replace(
            /<title>[^<]*<\/title>/i,
            `<title>${title} — NMFT STUDIO</title>`
          );

          // Reemplazar meta descripción
          outputHtml = outputHtml.replace(
            /<meta\s+name="description"\s+content="[^"]*">/i,
            `<meta name="description" content="${excerpt.replace(/"/g, '&quot;')}">`
          );

          // Reemplazar bloque <section class="post-hero">...</section>
          const heroRegex = /<section class="post-hero">[\s\S]*?<\/section>/i;
          const newHeroHtml = `<section class="post-hero">
      <a href="/blog/" class="back-link mono">← Volver al blog</a>
      <div class="meta-row">
        <span class="cat-chip cat-${category}">${CATEGORY_LABEL[category] || category}</span>
        <span class="post-date mono">${formatDate(date)} · ${readMinutes} min de lectura</span>
      </div>
      <h1>${title}</h1>
      <p class="lead">${excerpt}</p>
    </section>`;
          outputHtml = outputHtml.replace(heroRegex, newHeroHtml);

          // Reemplazar bloque <article class="post-body">...</article>
          const bodyRegex = /<article class="post-body">[\s\S]*?<\/article>/i;
          const newBodyHtml = `<article class="post-body">
        ${content}
      </article>`;
          outputHtml = outputHtml.replace(bodyRegex, newBodyHtml);

          // 3. Escribir el nuevo archivo HTML del post
          fs.writeFile(postFilePath, outputHtml, 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Error al escribir el archivo del post: ' + err.message }));
              return;
            }

            // 4. Actualizar assets/data/posts.json
            const postsJsonPath = path.join(WEB_ROOT, 'assets', 'data', 'posts.json');
            fs.readFile(postsJsonPath, 'utf8', (err, jsonContent) => {
              let postsList = [];
              if (!err) {
                try {
                  postsList = JSON.parse(jsonContent);
                } catch (e) {
                  postsList = [];
                }
              }

              const newPostMeta = {
                slug,
                title,
                excerpt,
                date,
                category,
                readMinutes: parseInt(readMinutes, 10)
              };

              // Insertar al inicio de la lista
              postsList.unshift(newPostMeta);

              fs.writeFile(postsJsonPath, JSON.stringify(postsList, null, 2), 'utf8', (err) => {
                if (err) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Post creado, pero no se pudo actualizar posts.json: ' + err.message }));
                  return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, slug }));
              });
            });
          });
        });

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload JSON inválido: ' + err.message }));
      }
    });
    return;
  }

  // Responder 404 para cualquier otra ruta
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('No encontrado');
});

server.listen(PORT, () => {
  console.log(`[NMFT SERVER] Corriendo en http://localhost:${PORT}`);
});
