import { aplicarResposta, atualizarDias, montarSessao } from "./sessao.js";

const CHAVE = "sinal-aberto:progresso";
const REPOSITORIO = "https://github.com/capitaoxis/sinal-aberto";
const VLIBRAS = "https://vlibras.gov.br";
const principal = document.getElementById("conteudo");
const avisoLeitor = document.getElementById("aviso");
const movimentoReduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Economia de dados ligada no aparelho: os vídeos só tocam quando a pessoa pede.
const poupaDados = navigator.connection?.saveData === true;
const semAutoplay = movimentoReduzido || poupaDados;

let licoes = [];
let aoTeclar = null;
let primeiraTela = true;

document.addEventListener("keydown", (evento) => aoTeclar?.(evento));

function lerProgresso() {
  try {
    return { aprendidos: [], ...JSON.parse(localStorage.getItem(CHAVE) ?? "{}") };
  } catch {
    return { aprendidos: [] };
  }
}

function salvarProgresso(progresso) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(progresso));
  } catch {
    // Sem armazenamento (janela anônima, por exemplo) a lição segue normalmente.
  }
}

function el(tag, propriedades = {}, ...filhos) {
  const elemento = document.createElement(tag);
  for (const [nome, valor] of Object.entries(propriedades)) {
    if (nome === "classe") elemento.className = valor;
    else if (nome.startsWith("on")) elemento.addEventListener(nome.slice(2), valor);
    else if (nome in elemento) elemento[nome] = valor;
    else elemento.setAttribute(nome, valor);
  }
  elemento.append(...filhos.filter((f) => f != null));
  return elemento;
}

/** Troca a tela, leva o foco ao título novo (leitor de tela) e atualiza o título da aba. */
function trocarTela(...conteudo) {
  aoTeclar = null;
  principal.querySelectorAll("video").forEach((v) => v.pause());
  principal.replaceChildren(...conteudo);
  scrollTo(0, 0);
  const titulo = principal.querySelector("h1");
  if (titulo) {
    document.title = titulo.textContent === "Sinal Aberto" ? "Sinal Aberto" : `${titulo.textContent} - Sinal Aberto`;
    if (!primeiraTela) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }
  primeiraTela = false;
}

function luzes(total, acesas) {
  const lista = el("ol", { classe: "luzes", "aria-hidden": "true" });
  for (let i = 0; i < total; i++) {
    const luz = el("li", { classe: i < acesas ? "luz acesa" : "luz" });
    luz.style.setProperty("--ordem", i);
    lista.append(luz);
  }
  return lista;
}

function videoDoSinal(sinal, tomada, rotulo, videoPrincipal = true) {
  const video = el("video", {
    src: `videos/${sinal.id}-${tomada}.mp4`,
    muted: true,
    loop: true,
    playsInline: true,
    preload: videoPrincipal && !poupaDados ? "auto" : "metadata",
  });
  if (rotulo) video.setAttribute("aria-label", rotulo);
  video.autoplay = !semAutoplay;
  return video;
}

/** Vídeo grande com pausa e câmera lenta, porque um sinal se aprende vendo de novo. */
function palco(sinal, tomada, rotulo) {
  const video = videoDoSinal(sinal, tomada, rotulo);
  const devagar = el("button", {
    classe: "controle",
    type: "button",
    textContent: "Ver devagar",
    onclick: () => {
      const ligado = video.playbackRate === 1;
      video.playbackRate = ligado ? 0.5 : 1;
      devagar.setAttribute("aria-pressed", String(ligado));
      video.play().catch(() => {});
    },
  });
  devagar.setAttribute("aria-pressed", "false");

  const pausar = el("button", {
    classe: "controle",
    type: "button",
    textContent: semAutoplay ? "Tocar" : "Pausar",
    onclick: () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    },
  });
  // O texto do botão segue o estado real do vídeo (o navegador pode barrar o autoplay).
  video.addEventListener("play", () => { pausar.textContent = "Pausar"; });
  video.addEventListener("pause", () => { pausar.textContent = "Tocar"; });

  const falha = el("p", { classe: "dica", hidden: true, role: "status", textContent: "O vídeo não abriu. Veja se a internet está ligada ou siga para o próximo." });
  video.addEventListener("error", () => { falha.hidden = false; });

  return el("div", { classe: "palco" }, video, el("div", { classe: "controles" }, devagar, pausar), falha);
}

let vlibrasCarregado = null;

/** Carrega o widget oficial só quando pedido: nada externo roda antes disso. */
function carregarVLibras() {
  vlibrasCarregado ??= new Promise((resolver, rejeitar) => {
    const script = el("script", {
      src: `${VLIBRAS}/app/vlibras-plugin.js`,
      onload: () => {
        new window.VLibras.Widget(`${VLIBRAS}/app`, `${VLIBRAS}/config/default_logo.json`);
        resolver();
      },
      onerror: () => {
        vlibrasCarregado = null;
        rejeitar(new Error("VLibras indisponível"));
      },
    });
    document.body.append(script);
  });
  return vlibrasCarregado;
}

function secaoAvatar() {
  const estado = el("p", { classe: "dica", role: "status" });
  const ligar = el("button", {
    classe: "controle",
    type: "button",
    textContent: "Ligar avatar do VLibras",
    onclick: async () => {
      ligar.disabled = true;
      estado.textContent = "Carregando o VLibras.";
      try {
        await carregarVLibras();
        window.VLibrasWidget?.open?.();
        estado.textContent = "VLibras ligado. Espere o avatar aparecer. Depois, toque em um texto desta página.";
      } catch {
        ligar.disabled = false;
        estado.textContent = "O VLibras não abriu. Confira a conexão e tente de novo.";
      }
    },
  });
  return el("section", { classe: "avatar", "aria-labelledby": "titulo-avatar" },
    el("h2", { id: "titulo-avatar", textContent: "Ver textos em Libras com avatar 3D" }),
    el("p", { textContent: "O VLibras é um avatar 3D do governo federal. Ele mostra em Libras os textos de um site. A tradução é automática e pode ter erros." }),
    el("p", { classe: "dica", textContent: "O VLibras é um serviço externo, com regras próprias. Ele pode registrar dados de uso. O Sinal Aberto não recebe esses dados." }),
    ligar,
    estado,
  );
}

function telaInicio() {
  const progresso = lerProgresso();
  const aprendidos = new Set(progresso.aprendidos);
  const total = licoes.flatMap((l) => l.sinais).length;

  const itens = licoes.map((licao) => {
    const acesas = licao.sinais.filter((s) => aprendidos.has(s.id)).length;
    const concluida = acesas === licao.sinais.length;
    return el("li", {},
      el("button", { classe: "licao", type: "button", onclick: () => iniciarLicao(licao) },
        el("span", { classe: "licao-titulo", textContent: licao.titulo }),
        el("span", { classe: "licao-acao", textContent: concluida ? "Praticar de novo" : "Começar" }),
        luzes(licao.sinais.length, acesas),
        el("span", { classe: "so-leitor", textContent: `${acesas} de ${licao.sinais.length} sinais aprendidos` }),
      ),
    );
  });

  const dias = progresso.diasSeguidos > 1 ? ` Você praticou ${progresso.diasSeguidos} dias seguidos.` : "";

  trocarTela(
    el("header", { classe: "topo" },
      el("div", {},
        el("h1", { textContent: "Sinal Aberto" }),
        el("p", { textContent: "Aprenda sinais de Libras em lições curtas. Cada lição ensina 5 sinais. É de graça, sem conta e sem som." }),
      ),
      el("figure", { classe: "sinal-do-topo" },
        palco({ id: "banheiro" }, 1, "Pessoa fazendo o sinal de Banheiro"),
        el("figcaption", { textContent: "Este é o sinal de Banheiro." }),
      ),
    ),
    el("p", { classe: "resumo", textContent: `${aprendidos.size} de ${total} sinais aprendidos.${dias}` }),
    el("ul", { classe: "trilha", "aria-label": "Lições" }, ...itens),
    secaoAvatar(),
    el("footer", { classe: "rodape" },
      el("p", { classe: "aviso-previa", textContent: "Versão de teste. Professores surdos ainda não revisaram as lições. O site não substitui um curso nem um intérprete." }),
      el("p", {},
        "Vídeos: ",
        el("a", { href: "https://zenodo.org/records/4322984", textContent: "MINDS-Libras" }),
        ", licença CC BY 4.0. Seu progresso fica só neste aparelho.",
      ),
      el("p", {},
        el("a", { href: `${REPOSITORIO}/issues/new?template=sinal-errado.yml`, textContent: "Avisar sobre um sinal errado" }),
        " ou ",
        el("a", { href: REPOSITORIO, textContent: "ver o código aberto no GitHub" }),
        ".",
      ),
      el("p", {},
        el("a", { href: "sinal-aberto-extensao.zip", textContent: "Baixar a extensão para o navegador" }),
        " (",
        el("a", { href: `${REPOSITORIO}/blob/main/extensao/README.md`, textContent: "como instalar" }),
        ").",
      ),
    ),
  );
}

function iniciarLicao(licao) {
  const todos = licoes.flatMap((l) => l.sinais);
  const fila = montarSessao(licao, todos);
  mostrarExercicio({ licao, fila, feitos: new Set() });
}

function barra(estado) {
  const concluidos = estado.licao.sinais.filter((s) => estado.feitos.has(s.id)).length;
  return el("div", { classe: "barra" },
    el("button", { classe: "sair", type: "button", textContent: "Sair da lição", onclick: telaInicio }),
    luzes(estado.licao.sinais.length, concluidos),
    el("span", { classe: "so-leitor", textContent: `${concluidos} de ${estado.licao.sinais.length} sinais` }),
  );
}

function avancar(estado, acertou) {
  const fila = aplicarResposta(estado.fila, acertou);
  const proximo = { ...estado, fila };
  if (fila.length === 0) telaFim(estado.licao);
  else mostrarExercicio(proximo);
}

function mostrarExercicio(estado) {
  const exercicio = estado.fila[0];
  if (exercicio.tipo === "conhecer") telaConhecer(estado, exercicio);
  else if (exercicio.tipo === "qual-palavra") telaQualPalavra(estado, exercicio);
  else telaQualVideo(estado, exercicio);
}

function botaoSeguir(aoClicar) {
  return el("button", { classe: "seguir", type: "button", textContent: "Continuar", onclick: aoClicar });
}

function telaConhecer(estado, { sinal }) {
  const seguir = botaoSeguir(() => avancar(estado, true));
  trocarTela(
    barra(estado),
    el("section", { classe: "exercicio" },
      palco(sinal, 1, `Pessoa fazendo o sinal de ${sinal.palavra}`),
      el("div", { classe: "lado" },
        el("h1", { textContent: "Novo sinal" }),
        el("p", { classe: "palavra-grande", textContent: sinal.palavra }),
        el("p", { classe: "dica", textContent: "Faça o sinal com as suas mãos. Depois, continue." }),
        seguir,
      ),
    ),
  );
}

/** Marca as respostas, mostra o retorno e libera o botão de continuar. */
function responder(estado, sinal, escolhido, botoes, lado) {
  const acertou = escolhido.id === sinal.id;
  aoTeclar = null;
  for (const [opcao, botao] of botoes) {
    botao.disabled = true;
    if (opcao.id === sinal.id) botao.classList.add("certa");
    else if (opcao.id === escolhido.id) botao.classList.add("errada");
  }
  if (acertou && estado.fila[0].tipo === "qual-palavra") estado.feitos.add(sinal.id);

  const mensagem = acertou
    ? `Isso! Este é o sinal de ${sinal.palavra}.`
    : `A resposta certa é ${sinal.palavra}. Este sinal volta no fim da lição.`;
  avisoLeitor.textContent = mensagem;
  const seguir = botaoSeguir(() => avancar(estado, acertou));
  lado.append(
    el("p", { classe: acertou ? "retorno certo" : "retorno errado", textContent: mensagem }),
    seguir,
  );
  seguir.focus({ preventScroll: true });
}

function ligarTeclas(botoes) {
  // Atalho de uma tecla só vale com o foco nas opções (WCAG 2.1.4) e nunca com Ctrl, Alt ou Meta.
  aoTeclar = (evento) => {
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
    if (!document.activeElement?.closest(".opcoes")) return;
    if (!/^[1-9]$/.test(evento.key)) return;
    const alvo = botoes[Number(evento.key) - 1];
    if (alvo && !alvo[1].disabled) alvo[1].click();
  };
}

function telaQualPalavra(estado, { sinal, opcoes }) {
  const lado = el("div", { classe: "lado" }, el("h1", { textContent: "Qual é este sinal?" }));
  const botoes = opcoes.map((opcao) => {
    const botao = el("button", {
      classe: "opcao",
      type: "button",
      textContent: opcao.palavra,
      onclick: () => responder(estado, sinal, opcao, botoes, lado),
    });
    return [opcao, botao];
  });
  lado.append(el("div", { classe: "opcoes" }, ...botoes.map(([, botao]) => botao)));
  trocarTela(
    barra(estado),
    el("section", { classe: "exercicio" }, palco(sinal, 2, "Pessoa fazendo o sinal que você vai identificar"), lado),
  );
  ligarTeclas(botoes);
}

function telaQualVideo(estado, { sinal, opcoes }) {
  const lado = el("div", { classe: "lado" },
    el("h1", { textContent: "Qual vídeo mostra este sinal?" }),
    el("p", { classe: "palavra-grande", textContent: sinal.palavra }),
  );
  const botoes = opcoes.map((opcao, i) => {
    const rotulo = el("span", { textContent: `Opção ${i + 1}` });
    const video = videoDoSinal(opcao, 3, null, false);
    video.setAttribute("aria-hidden", "true");
    video.addEventListener("error", () => {
      botao.classList.add("sem-video");
      rotulo.textContent = `Opção ${i + 1} (o vídeo não abriu)`;
    });
    const botao = el("button", {
      classe: "opcao opcao-video",
      type: "button",
      onclick: () => responder(estado, sinal, opcao, botoes, lado),
    }, video, rotulo);
    return [opcao, botao];
  });
  const videos = botoes.map(([, botao]) => botao.querySelector("video"));
  const alternar = el("button", {
    classe: "controle",
    type: "button",
    textContent: semAutoplay ? "Tocar vídeos" : "Pausar vídeos",
    onclick: () => {
      const parar = videos.some((v) => !v.paused);
      videos.forEach((v) => (parar ? v.pause() : v.play().catch(() => {})));
      alternar.textContent = parar ? "Tocar vídeos" : "Pausar vídeos";
    },
  });
  trocarTela(
    barra(estado),
    el("section", { classe: "exercicio" },
      el("div", {},
        el("div", { classe: "opcoes opcoes-video" }, ...botoes.map(([, botao]) => botao)),
        el("div", { classe: "controles" }, alternar),
      ),
      lado,
    ),
  );
  ligarTeclas(botoes);
}

function telaFim(licao) {
  const progresso = atualizarDias(lerProgresso());
  const ids = licao.sinais.map((s) => s.id);
  const aprendidos = [...new Set([...progresso.aprendidos, ...ids])];
  salvarProgresso({ ...progresso, aprendidos });

  const voltar = el("button", { classe: "seguir", type: "button", textContent: "Ver as lições", onclick: telaInicio });
  trocarTela(
    el("section", { classe: "fim" },
      el("h1", { textContent: "Lição concluída" }),
      el("p", { textContent: `Você praticou: ${licao.sinais.map((s) => s.palavra).join(", ")}.` }),
      luzes(licao.sinais.length, licao.sinais.length),
      voltar,
    ),
  );
}

async function iniciar() {
  try {
    const resposta = await fetch("licoes.json");
    if (!resposta.ok) throw new Error(String(resposta.status));
    ({ licoes } = await resposta.json());
    telaInicio();
  } catch {
    trocarTela(el("h1", { textContent: "Sinal Aberto" }), el("p", { textContent: "As lições não abriram. Confira a internet e recarregue a página." }));
  }
}

iniciar();

// Instalação e uso sem internet. Falhar aqui nunca atrapalha a lição.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
