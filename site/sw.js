// Service worker do Sinal Aberto: páginas ficam guardadas na instalação e os
// vídeos ficam guardados depois de assistidos. Todos os caminhos são relativos
// ao escopo, então funciona na raiz de um domínio e em localhost.

const VERSAO = "2";
const CACHE_PAGINAS = `sinal-aberto-paginas-v${VERSAO}`;
const CACHE_VIDEOS = "sinal-aberto-videos-v1";
const MAX_VIDEOS = 150;
const MAX_BYTES_VIDEO = 25 * 1024 * 1024;

const ARQUIVOS = [
  "./",
  "index.html",
  "estilo.css",
  "app.js",
  "sessao.js",
  "licoes.json",
  "manifest.webmanifest",
  "fontes/atkinson-400.woff2",
  "fontes/atkinson-700.woff2",
  "icones/icone.svg",
  "icones/icone-maskable.svg",
];

const baixando = new Set();

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_PAGINAS)
      .then((cache) => cache.addAll(ARQUIVOS.map((a) => new Request(a, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    const atuais = new Set([CACHE_PAGINAS, CACHE_VIDEOS]);
    for (const nome of await caches.keys()) {
      if (nome.startsWith("sinal-aberto-") && !atuais.has(nome)) await caches.delete(nome);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(".mp4") || pedido.headers.has("range")) {
    evento.respondWith(responderVideo(evento, pedido, url));
  } else {
    evento.respondWith(responderPagina(evento, pedido));
  }
});

/** Mostra o que está guardado na hora e atualiza o guardado por trás. */
async function responderPagina(evento, pedido) {
  const cache = await caches.open(CACHE_PAGINAS);
  const chave = pedido.mode === "navigate" ? "index.html" : pedido;
  const guardado = await cache.match(chave, { ignoreSearch: true });

  const atualizar = fetch(pedido).then((resposta) => {
    if (resposta.ok && resposta.type === "basic") {
      cache.put(pedido.mode === "navigate" ? "index.html" : pedido, resposta.clone());
    }
    return resposta;
  });

  if (guardado) {
    evento.waitUntil(atualizar.catch(() => {}));
    return guardado;
  }
  try {
    return await atualizar;
  } catch {
    return new Response("Sem conexão e esta página ainda não foi guardada.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/** Lê "bytes=a-b" e devolve [início, fim] ou null se o pedido não faz sentido. */
function lerFaixa(cabecalho, tamanho) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((cabecalho ?? "").trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let inicio;
  let fim;
  if (m[1] === "") {
    const ultimos = Number(m[2]);
    inicio = Math.max(tamanho - ultimos, 0);
    fim = tamanho - 1;
  } else {
    inicio = Number(m[1]);
    fim = m[2] === "" ? tamanho - 1 : Math.min(Number(m[2]), tamanho - 1);
  }
  if (inicio > fim || inicio >= tamanho) return null;
  return [inicio, fim];
}

/** Monta a resposta 206 que o Safari e o Chrome exigem para tocar vídeo. */
async function fatiar(guardado, pedido) {
  const cabecalho = pedido.headers.get("range");
  const blob = await guardado.blob();
  const tipo = guardado.headers.get("Content-Type") || "video/mp4";
  if (!cabecalho) {
    return new Response(blob, {
      status: 200,
      headers: { "Content-Type": tipo, "Content-Length": String(blob.size), "Accept-Ranges": "bytes" },
    });
  }
  const faixa = lerFaixa(cabecalho, blob.size);
  if (!faixa) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${blob.size}` } });
  }
  const [inicio, fim] = faixa;
  return new Response(blob.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(fim - inicio + 1),
      "Content-Range": `bytes ${inicio}-${fim}/${blob.size}`,
      "Accept-Ranges": "bytes",
    },
  });
}

async function guardarVideoInteiro(url) {
  const chave = url.origin + url.pathname;
  if (baixando.has(chave)) return;
  baixando.add(chave);
  try {
    const resposta = await fetch(chave); // sem Range: resposta 200 inteira
    const tamanho = Number(resposta.headers.get("Content-Length") ?? 0);
    if (resposta.status !== 200 || tamanho > MAX_BYTES_VIDEO) return;
    const cache = await caches.open(CACHE_VIDEOS);
    await cache.put(chave, resposta);
    const chaves = await cache.keys();
    for (const velha of chaves.slice(0, Math.max(chaves.length - MAX_VIDEOS, 0))) await cache.delete(velha);
  } catch {
    // Sem rede ou sem espaço: o vídeo continua tocando pela internet.
  } finally {
    baixando.delete(chave);
  }
}

async function responderVideo(evento, pedido, url) {
  const cache = await caches.open(CACHE_VIDEOS);
  const guardado = await cache.match(url.origin + url.pathname);
  if (guardado) return fatiar(guardado, pedido);

  evento.waitUntil(guardarVideoInteiro(url));
  try {
    return await fetch(pedido);
  } catch {
    return Response.error();
  }
}
