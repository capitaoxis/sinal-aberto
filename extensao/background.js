// Fundo da extensão: cria o item do menu e abre o painel.
// O texto selecionado só vai para a página do painel, dentro do aparelho.
const api = typeof browser !== "undefined" ? browser : chrome;
const ID_MENU = "ver-sinal-libras";
let janelaId = null;

function criarMenu() {
  // Sem callback: em Chrome e Firefox MV3 as chamadas devolvem Promise.
  Promise.resolve(api.contextMenus.removeAll()).then(() => {
    api.contextMenus.create({
      id: ID_MENU,
      title: "Ver sinal em Libras",
      contexts: ["selection"],
    });
  });
}

api.runtime.onInstalled.addListener(criarMenu);

async function abrirPainel(texto) {
  const url = api.runtime.getURL("painel.html") + "?q=" + encodeURIComponent(texto.slice(0, 200));
  if (janelaId !== null) {
    try {
      const janela = await api.windows.get(janelaId, { populate: true });
      await api.tabs.update(janela.tabs[0].id, { url });
      await api.windows.update(janelaId, { focused: true });
      return;
    } catch (e) {
      janelaId = null; // a pessoa fechou o painel
    }
  }
  const janela = await api.windows.create({ url, type: "popup", width: 460, height: 660 });
  janelaId = janela.id;
}

api.windows.onRemoved.addListener((id) => {
  if (id === janelaId) janelaId = null;
});

api.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === ID_MENU) abrirPainel(info.selectionText || "");
});
