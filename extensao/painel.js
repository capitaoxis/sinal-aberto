(function () {
  "use strict";
  const N = window.SinalNucleo;
  const api = typeof browser !== "undefined" ? browser : chrome;
  const titulo = document.getElementById("titulo");
  const area = document.getElementById("area");
  const principal = document.getElementById("conteudo");
  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, props = {}, ...filhos) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "className") e.className = v;
      else if (k === "texto") e.textContent = v;
      else e.setAttribute(k, v);
    }
    e.append(...filhos);
    return e;
  }

  function linkExterno(texto, href, classe) {
    return el("a", { href, target: "_blank", rel: "noopener noreferrer", className: classe, texto });
  }

  function mostrarNaoAchou(consulta, longo) {
    titulo.textContent = longo ? "Selecione uma palavra só" : "Ainda não temos esse sinal";
    const msg = longo
      ? "O texto selecionado é longo demais. Este painel mostra o sinal de uma palavra por vez."
      : `Não encontramos "${consulta}" no dicionário do Sinal Aberto. Ainda não temos esse sinal, e não vamos inventar uma tradução.`;
    area.replaceChildren(
      el("div", { className: "cartao" },
        el("p", { className: "mensagem-aviso", texto: msg }),
        el("p", { texto: "Para traduzir textos inteiros para Libras, use o VLibras, serviço do governo federal." }),
        el("div", { className: "linha" },
          linkExterno("Abrir o VLibras", N.URL_VLIBRAS, "botao"),
          linkExterno("Ver os sinais que temos", N.URL_SITE, "botao secundario"))));
  }

  function mostrarSinal(resultado) {
    const { entrada, plural, consulta } = resultado;
    titulo.textContent = entrada.palavra;

    const video = el("video", {
      src: N.urlVideo(entrada.id, 1),
      playsinline: "",
      preload: "auto",
      "aria-label": `Vídeo do sinal de ${entrada.palavra} em Libras, em repetição, sem som`,
    });
    video.muted = true;
    video.loop = true;
    video.autoplay = !reduzMovimento;

    const erro = el("p", { className: "mensagem-erro", role: "alert" });
    erro.hidden = true;
    const btnPausa = el("button", { type: "button", className: "botao" });
    const btnLento = el("button", { type: "button", className: "botao secundario" });

    function atualizarBotoes() {
      btnPausa.textContent = video.paused ? "Tocar" : "Pausar";
      btnLento.textContent = video.playbackRate < 1 ? "Ver na velocidade normal" : "Ver devagar";
      btnLento.setAttribute("aria-pressed", String(video.playbackRate < 1));
    }
    btnPausa.addEventListener("click", () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    btnLento.addEventListener("click", () => {
      video.playbackRate = video.playbackRate < 1 ? 1 : 0.5;
      atualizarBotoes();
    });
    video.addEventListener("play", atualizarBotoes);
    video.addEventListener("pause", atualizarBotoes);
    video.addEventListener("ratechange", atualizarBotoes);
    video.addEventListener("error", () => {
      video.hidden = true;
      btnPausa.disabled = true;
      btnLento.disabled = true;
      erro.hidden = false;
      erro.textContent =
        "Não foi possível carregar o vídeo deste sinal. Os vídeos podem ainda não estar no ar, ou você está sem internet. Tente de novo mais tarde.";
    });
    atualizarBotoes();

    const partes = [];
    if (plural) {
      partes.push(el("p", { className: "dica", texto: `Você selecionou "${consulta}". Mostrando o sinal de "${entrada.palavra}".` }));
    }
    partes.push(video, erro, el("div", { className: "linha" }, btnPausa, btnLento));
    if (reduzMovimento) {
      partes.push(el("p", { className: "dica", texto: "Seu aparelho pede menos movimento. O vídeo começa parado: use o botão Tocar." }));
    }
    partes.push(
      el("p", { className: "licao", texto: `Lição: ${entrada.licao}` }),
      linkExterno("Praticar este sinal no site", N.URL_SITE, "botao secundario"));
    area.replaceChildren(el("div", { className: "cartao" }, ...partes));
  }

  async function iniciar() {
    const texto = new URLSearchParams(location.search).get("q") || "";
    let sinais;
    try {
      const resp = await fetch(api.runtime.getURL("dicionario.json"));
      sinais = (await resp.json()).sinais;
    } catch (e) {
      titulo.textContent = "Algo deu errado";
      area.replaceChildren(el("p", { className: "mensagem-erro", role: "alert", texto: "Não foi possível abrir o dicionário da extensão. Tente reinstalar." }));
      return;
    }
    const r = N.buscar(texto, N.criarIndice(sinais));
    if (r.estado === "achou") mostrarSinal(r);
    else if (r.estado === "longo") mostrarNaoAchou(r.consulta, true);
    else if (r.estado === "vazio") {
      titulo.textContent = "Nenhuma palavra selecionada";
      area.replaceChildren(el("p", { className: "dica", texto: "Selecione uma palavra na página, clique com o botão direito e escolha \"Ver sinal em Libras\"." }));
    } else mostrarNaoAchou(r.consulta, false);
    principal.focus();
  }

  document.getElementById("fechar").addEventListener("click", () => window.close());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.close(); });
  iniciar();
})();
