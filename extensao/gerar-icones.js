// Gera icones/icone-<tamanho>.png (fundo verde arredondado com triângulo de "tocar") e icone.svg.
// Uso: node gerar-icones.js
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const VERDE = [0x0B, 0x5D, 0x49], BRANCO = [255, 255, 255];
const dir = path.join(__dirname, "icones");
fs.mkdirSync(dir, { recursive: true });

function crc32(buf) {
  let c, crc = ~0;
  for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; }
  return ~crc >>> 0;
}
function chunk(tipo, dados) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([len, corpo, crc]);
}
function dentroTriangulo(x, y, a, b, c) {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const p = [x, y], d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function png(n) {
  const raio = n * 0.22, SS = 4; // supersampling para bordas suaves
  const linhas = [];
  const A = [n * 0.38, n * 0.28], B = [n * 0.38, n * 0.72], C = [n * 0.74, n * 0.5];
  for (let y = 0; y < n; y++) {
    const linha = Buffer.alloc(1 + n * 4);
    for (let x = 0; x < n; x++) {
      let cobertura = 0, tri = 0;
      for (let i = 0; i < SS; i++) for (let j = 0; j < SS; j++) {
        const px = x + (i + .5) / SS, py = y + (j + .5) / SS;
        const cx = Math.min(Math.max(px, raio), n - raio), cy = Math.min(Math.max(py, raio), n - raio);
        if ((px - cx) ** 2 + (py - cy) ** 2 <= raio ** 2) {
          cobertura++;
          if (dentroTriangulo(px, py, A, B, C)) tri++;
        }
      }
      const total = SS * SS, o = 1 + x * 4;
      const t = cobertura ? tri / cobertura : 0;
      for (let k = 0; k < 3; k++) linha[o + k] = Math.round(VERDE[k] * (1 - t) + BRANCO[k] * t);
      linha[o + 3] = Math.round((cobertura / total) * 255);
    }
    linhas.push(linha);
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(n, 0); ihdr.writeUInt32BE(n, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(linhas))), chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (const n of [16, 32, 48, 128]) fs.writeFileSync(path.join(dir, `icone-${n}.png`), png(n));
fs.writeFileSync(path.join(dir, "icone.svg"),
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="Sinal Aberto">
  <rect width="128" height="128" rx="28" fill="#0B5D49"/>
  <path d="M49 36v56l46-28z" fill="#fff"/>
</svg>
`);
console.log("ícones gerados");
