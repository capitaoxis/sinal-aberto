// Gera dicionario.json a partir de ../site/licoes.json.
// Uso: node gerar-dicionario.js
const fs = require("node:fs");
const path = require("node:path");
const { criarIndice } = require("./nucleo.js");

const origem = path.join(__dirname, "..", "site", "licoes.json");
const destino = path.join(__dirname, "dicionario.json");

const { licoes } = JSON.parse(fs.readFileSync(origem, "utf8"));
const sinais = [];
for (const licao of licoes) {
  for (const s of licao.sinais) {
    sinais.push({ id: s.id, palavra: s.palavra, licao: licao.titulo });
  }
}
criarIndice(sinais); // falha se houver palavra repetida ou vazia
fs.writeFileSync(destino, JSON.stringify({ sinais }, null, 2) + "\n");
console.log(`dicionario.json: ${sinais.length} sinais`);
