// IndexNow (Bing, Yandex, Seznam...): avisa os buscadores das páginas novas, alteradas ou removidas.
// Roda 1x por dia no GitHub Actions (.github/workflows/indexnow.yml). Lê o sitemap do site no ar, compara com
// a leitura do dia anterior (guardada no cache do Actions) e envia só a diferença. Sem cache, envia tudo.
// A chave é um código qualquer, publicado na raiz do site em /<chave>.txt; não precisa de conta no Bing.
// Uso: node indexnow.mjs <https://site.com.br> <chave> [arquivo-de-estado]
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [SITE, CHAVE, ESTADO = "indexnow-estado.json"] = process.argv.slice(2);
if (!SITE || !CHAVE) throw new Error("Uso: node indexnow.mjs <site> <chave> [estado]");
const host = new URL(SITE).host;

async function texto(url) {
  const r = await fetch(url, { headers: { "User-Agent": "IndexNow-Atrivo/1.0" } });
  if (!r.ok) throw new Error(`${url} respondeu ${r.status}`);
  return r.text();
}

// Lê o sitemap (e os sitemaps filhos de um sitemap index): { url: lastmod }
async function lerSitemap(url, achados = {}, visitados = new Set()) {
  if (visitados.has(url)) return achados;
  visitados.add(url);
  const xml = await texto(url);
  const blocos = (tag) => [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => m[1]);
  const campo = (b, t) => (b.match(new RegExp(`<${t}>\\s*([^<]*?)\\s*</${t}>`)) || [])[1] || "";
  for (const b of blocos("sitemap")) await lerSitemap(campo(b, "loc").replace(/&amp;/g, "&"), achados, visitados);
  for (const b of blocos("url")) {
    const loc = campo(b, "loc").replace(/&amp;/g, "&");
    if (loc && new URL(loc).host === host) achados[loc] = campo(b, "lastmod");
  }
  return achados;
}

const robots = await texto(`${SITE}/robots.txt`).catch(() => "");
const sitemaps = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
if (!sitemaps.length) sitemaps.push(`${SITE}/sitemap.xml`);
const atual = {};
for (const s of sitemaps) await lerSitemap(s, atual);
if (!Object.keys(atual).length) throw new Error("Sitemap vazio, nada enviado.");

const anterior = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")) : null;
const enviar = anterior
  ? [
      ...Object.keys(atual).filter((u) => !(u in anterior) || (atual[u] && atual[u] !== anterior[u])),
      ...Object.keys(anterior).filter((u) => !(u in atual)), // removidas: o buscador tira do índice
    ]
  : Object.keys(atual);

console.log(`Sitemap: ${Object.keys(atual).length} URLs. ${anterior ? "Diferença" : "Primeiro envio"}: ${enviar.length}.`);

if (enviar.length) {
  const chave = (await texto(`${SITE}/${CHAVE}.txt`).catch(() => "")).trim();
  if (chave !== CHAVE) throw new Error(`A chave não está no ar em ${SITE}/${CHAVE}.txt`);
  for (let i = 0; i < enviar.length; i += 10000) {
    const lote = enviar.slice(i, i + 10000);
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: CHAVE, keyLocation: `${SITE}/${CHAVE}.txt`, urlList: lote }),
    });
    console.log(`IndexNow respondeu ${r.status} para ${lote.length} URL(s).`);
    if (r.status >= 400) throw new Error(await r.text());
  }
  enviar.slice(0, 50).forEach((u) => console.log("  " + u));
  if (enviar.length > 50) console.log(`  ... e mais ${enviar.length - 50}`);
}

writeFileSync(ESTADO, JSON.stringify(atual));
