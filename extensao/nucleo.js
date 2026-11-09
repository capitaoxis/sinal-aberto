// Lógica pura do dicionário. Sem DOM, sem rede, sem APIs do navegador.
// Funciona como script comum (window.SinalNucleo) e como módulo do Node (require).
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.SinalNucleo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const LIMITE_CARACTERES = 60;
  const URL_VIDEOS = "https://libras.muraldasaude.com/videos/";
  const URL_SITE = "https://libras.muraldasaude.com";
  const URL_VLIBRAS = "https://vlibras.gov.br";

  // Tira pontuação e símbolos das pontas (aspas, vírgula, ponto, parênteses...).
  function limparPontas(texto) {
    return String(texto ?? "")
      .replace(/^[\p{P}\p{S}\s]+/u, "")
      .replace(/[\p{P}\p{S}\s]+$/u, "");
  }

  // Forma usada para comparar: sem acento, minúscula, espaços únicos.
  function normalizar(texto) {
    return limparPontas(texto)
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/\s+/gu, " ")
      .trim();
  }

  // Monta o índice chave normalizada -> entrada. Chave repetida é erro de dados.
  function criarIndice(entradas) {
    const indice = new Map();
    for (const entrada of entradas) {
      const chave = normalizar(entrada.palavra);
      if (!chave) throw new Error(`Palavra vazia no sinal "${entrada.id}"`);
      if (indice.has(chave)) throw new Error(`Palavra repetida no dicionário: "${entrada.palavra}"`);
      indice.set(chave, entrada);
    }
    return indice;
  }

  // Plural simples, só para tentar achar uma palavra que JÁ existe no dicionário.
  // Não inventa lema: se a forma sem "s" não está no dicionário, não achou.
  function candidatos(chave) {
    const lista = [chave];
    if (chave.endsWith("es") && chave.length > 3) lista.push(chave.slice(0, -2));
    if (chave.endsWith("s") && chave.length > 2) lista.push(chave.slice(0, -1));
    return lista;
  }

  // Resultado: { estado, entrada?, plural?, consulta }
  // estado: "vazio" | "longo" | "achou" | "nao-achou"
  function buscar(texto, indice) {
    const consulta = limparPontas(texto).replace(/\s+/gu, " ");
    if (!consulta) return { estado: "vazio", consulta };
    if (consulta.length > LIMITE_CARACTERES) return { estado: "longo", consulta };
    const chave = normalizar(consulta);
    const tentativas = candidatos(chave);
    for (let i = 0; i < tentativas.length; i++) {
      const entrada = indice.get(tentativas[i]);
      if (entrada) return { estado: "achou", entrada, plural: i > 0, consulta };
    }
    return { estado: "nao-achou", consulta };
  }

  function urlVideo(id, tomada = 1) {
    if (!/^[a-z0-9-]+$/.test(String(id))) throw new Error("Id de sinal inválido");
    return `${URL_VIDEOS}${id}-${tomada}.mp4`;
  }

  return { buscar, normalizar, limparPontas, criarIndice, urlVideo, LIMITE_CARACTERES, URL_SITE, URL_VLIBRAS };
});
