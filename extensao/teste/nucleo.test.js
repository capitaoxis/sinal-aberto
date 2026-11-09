const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const N = require("../nucleo.js");

const dic = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "dicionario.json"), "utf8")).sinais;
const indice = N.criarIndice(dic);
const id = (t) => { const r = N.buscar(t, indice); return r.estado === "achou" ? r.entrada.id : r.estado; };

test("acha ignorando maiúsculas e acentos", () => {
  assert.equal(id("maca"), "maca");
  assert.equal(id("MAÇÃ"), "maca");
  assert.equal(id("america"), "america");
  assert.equal(id("América"), "america");
});

test("ignora espaços e pontuação nas pontas", () => {
  assert.equal(id("  sapo  "), "sapo");
  assert.equal(id("“Sapo,”"), "sapo");
  assert.equal(id("(banco)."), "banco");
  assert.equal(id("...medo!?"), "medo");
});

test("NFC e NFD dão o mesmo resultado", () => {
  assert.equal(id("Maçã"), "maca");
  assert.equal(id("Maçã"), "maca");
});

test("plural simples só acha palavra que existe", () => {
  const r = N.buscar("sapos", indice);
  assert.equal(r.estado, "achou");
  assert.equal(r.plural, true);
  assert.equal(r.entrada.id, "sapo");
  assert.equal(N.buscar("sapo", indice).plural, false);
});

test("não inventa lema nem corta palavra inexistente", () => {
  assert.equal(id("cachorro"), "nao-achou");
  assert.equal(id("cachorros"), "nao-achou");
  assert.equal(id("comendo"), "nao-achou");
  assert.equal(id("bancário"), "nao-achou");
  assert.equal(id("ba"), "nao-achou");
});

test("frases e vazios", () => {
  assert.equal(id("bom dia"), "nao-achou");
  assert.equal(id(""), "vazio");
  assert.equal(id("  .,;  "), "vazio");
  assert.equal(id(null), "vazio");
  assert.equal(id("a".repeat(N.LIMITE_CARACTERES + 1)), "longo");
});

test("urlVideo monta o endereço e recusa id estranho", () => {
  assert.equal(N.urlVideo("maca"), "https://libras.muraldasaude.com/videos/maca-1.mp4");
  assert.throws(() => N.urlVideo("../x"));
  assert.throws(() => N.urlVideo("a b"));
});

test("índice recusa palavra repetida (mesmo com acento diferente)", () => {
  assert.throws(() => N.criarIndice([{ id: "a", palavra: "Maçã" }, { id: "b", palavra: "maca" }]));
});

test("dicionario.json bate com site/licoes.json", () => {
  const { licoes } = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "site", "licoes.json"), "utf8"));
  const esperado = licoes.flatMap((l) => l.sinais.map((s) => s.id));
  assert.deepEqual(dic.map((s) => s.id), esperado);
});

test("manifest: MV3, permissões mínimas, sem hosts amplos nem content scripts", () => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
  assert.equal(m.manifest_version, 3);
  assert.deepEqual(m.permissions, ["contextMenus"]);
  assert.equal(m.host_permissions, undefined);
  assert.equal(m.content_scripts, undefined);
  assert.equal(m.optional_host_permissions, undefined);
  for (const f of Object.values(m.icons)) assert.ok(fs.existsSync(path.join(__dirname, "..", f)), f);
  assert.ok(fs.existsSync(path.join(__dirname, "..", m.background.service_worker)));
});
