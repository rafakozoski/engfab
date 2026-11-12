// Publica os posts agendados do blog cuja data já chegou (horário de Brasília).
//
// Estrutura de um post agendado:
//   .agendados/AAAA-MM-DD/<slug>/index.html   o post, igual a blog/<slug>/index.html
//   .agendados/AAAA-MM-DD/<slug>/card.html    o <a class="post-card"> da listagem
//
// Para cada data <= hoje: move a pasta pra blog/<slug>/, coloca o card no topo do
// data-post-grid de blog/index.html e apaga a pasta da data. Quem comita é o workflow.
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const AGENDADOS = path.join(RAIZ, ".agendados");
const LISTAGEM = path.join(RAIZ, "blog", "index.html");
const MARCADOR = '<div class="post-grid" data-post-grid>';

const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

if (!fs.existsSync(AGENDADOS)) process.exit(0);

const datas = fs
  .readdirSync(AGENDADOS)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= hoje)
  .sort();

let listagem = fs.readFileSync(LISTAGEM, "utf8");
if (!listagem.includes(MARCADOR)) {
  console.error("Não achei o data-post-grid em blog/index.html. Nada publicado.");
  process.exit(1);
}

const publicados = [];
for (const data of datas) {
  const pastaData = path.join(AGENDADOS, data);
  for (const slug of fs.readdirSync(pastaData)) {
    const origem = path.join(pastaData, slug);
    const destino = path.join(RAIZ, "blog", slug);
    if (!fs.statSync(origem).isDirectory()) continue;
    if (fs.existsSync(destino)) {
      console.error(`blog/${slug} já existe, pulei (o agendado continua em .agendados/${data}).`);
      continue;
    }
    const cardPath = path.join(origem, "card.html");
    const card = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, "utf8").trim() : "";
    if (fs.existsSync(cardPath)) fs.rmSync(cardPath);
    fs.renameSync(origem, destino);
    if (card) {
      listagem = listagem.replace(MARCADOR, `${MARCADOR}\n\n        ${card}\n`);
    } else {
      console.error(`blog/${slug} publicado sem card.html: entra no ar, mas fica fora da listagem.`);
    }
    publicados.push(slug);
  }
  if (fs.readdirSync(pastaData).length === 0) fs.rmdirSync(pastaData);
}

fs.writeFileSync(LISTAGEM, listagem);
console.log(publicados.length ? `Publicados: ${publicados.join(", ")}` : "Nenhum post agendado pra hoje.");
