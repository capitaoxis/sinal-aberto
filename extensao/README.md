# Sinal Aberto: extensão de navegador

Selecione uma palavra em qualquer página, clique com o botão direito e escolha **Ver sinal em Libras**. Abre um painel pequeno com o vídeo do sinal (em repetição, sem som), os botões **Ver devagar** e **Pausar**, e um link para praticar no site.

Se a palavra não estiver no dicionário, o painel diz com clareza que **ainda não temos esse sinal** e indica o [VLibras](https://vlibras.gov.br), que traduz textos inteiros. Esta extensão é um dicionário de sinais, **não é um tradutor**, e nunca finge uma tradução.

> Versão de teste. Os sinais ainda não foram revisados por professores surdos. Veja o [README do projeto](../README.md).

## Privacidade

- O texto que você seleciona **não sai do aparelho**. A busca é feita localmente, no dicionário embutido (`dicionario.json`).
- Não há analytics, cadastro, cookies nem servidor da extensão.
- A única conexão de rede é o vídeo do sinal, baixado de `https://libras.muraldasaude.com/videos/<id>-1.mp4`. O endereço contém o identificador do sinal que você pediu (por exemplo `maca`), nunca o texto que você selecionou nas páginas.
- O painel é uma página da própria extensão, separada do site que você está lendo: o site não vê a palavra e o CSS dele não interfere no painel.

## Permissões

| Permissão | Por que precisa |
|---|---|
| `contextMenus` | Criar o item "Ver sinal em Libras" no menu do botão direito, que aparece só quando há texto selecionado. |

Só isso. Não pedimos `activeTab`, `scripting`, `host_permissions` nem content scripts, porque o texto selecionado chega ao fundo da extensão pelo próprio clique do menu (`info.selectionText`) e o painel abre em janela própria da extensão. Assim a extensão **não lê nem altera nenhuma página**. A política de conteúdo (CSP) das páginas da extensão só permite vídeo de `libras.muraldasaude.com` e scripts da própria extensão.

## Instalar sem loja

Ainda não está em nenhuma loja. Baixe ou clone o projeto e use a pasta `extensao/`.

**Chrome, Edge, Brave (qualquer navegador Chromium)**

1. Abra `chrome://extensions`.
2. Ligue o **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** e escolha a pasta `extensao`.
4. Opcional: fixe a extensão na barra para achá-la mais fácil.

**Firefox** (versão 121 ou mais nova)

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária...**.
3. Escolha o arquivo `manifest.json` dentro da pasta `extensao`.
4. No Firefox essa instalação é temporária: some quando o navegador fecha, e é preciso carregar de novo.

Para usar: selecione uma palavra, clique com o botão direito, **Ver sinal em Libras**. Com o teclado, selecione a palavra e use a tecla de menu (ou Shift+F10). **Esc** fecha o painel.

## Dicionário

O dicionário vem das lições do site. Depois de mudar `../site/licoes.json`, gere de novo:

```bash
node gerar-dicionario.js
```

A busca ignora maiúsculas, acentos, espaços e pontuação nas pontas ("maca" acha "Maçã"). Plural simples é aceito só quando a forma sem "s" já existe no dicionário ("sapos" mostra "Sapo", e o painel avisa). Não há lematização: "comendo" não acha "comer". Frases não são buscadas.

## Testes

```bash
node --test teste/nucleo.test.js
```

Cobrem a lógica pura (`nucleo.js`), a coerência entre `dicionario.json` e `site/licoes.json` e as regras do manifest (Manifest V3, só `contextMenus`, sem hosts amplos, sem content scripts).

## Arquivos

- `manifest.json`: Manifest V3, Chrome e Firefox.
- `background.js`: cria o menu e abre o painel.
- `nucleo.js`: lógica pura de busca (sem DOM, sem rede).
- `painel.html`, `painel.css`, `painel.js`: o painel. Cores e fonte (Atkinson Hyperlegible) vêm de `site/estilo.css`; modo escuro e movimento reduzido seguem o sistema.
- `dicionario.json`: gerado por `gerar-dicionario.js`.
- `gerar-icones.js` e `icones/`: ícones PNG e SVG simples.
- `fontes/`: cópia das fontes do site (licença original da Atkinson Hyperlegible).

## Acessibilidade

Painel todo operável por teclado, com foco visível; Esc fecha; vídeo com rótulo para leitor de tela; mensagens de erro anunciadas (`role="alert"`); com "reduzir movimento" ligado no sistema, o vídeo começa parado.

## Licença

Código sob [MIT](../LICENSE). Os vídeos são da base MINDS-Libras, CC BY 4.0 (veja `../site/videos/CREDITOS.md`).
