// Lógica da lição, sem tocar na tela: é o que os testes conferem.

export function embaralhar(lista, sorteio = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function opcoesPara(sinal, candidatos, quantidade, sorteio) {
  const outros = embaralhar(candidatos.filter((s) => s.id !== sinal.id), sorteio);
  return embaralhar([sinal, ...outros.slice(0, quantidade - 1)], sorteio);
}

/**
 * Monta os exercícios de uma lição: conhecer cada sinal, reconhecê-lo logo em
 * seguida e, no fim, revisar tudo na ordem inversa de pergunta.
 */
export function montarSessao(licao, todosOsSinais, sorteio = Math.random) {
  const exercicios = [];
  for (const sinal of licao.sinais) {
    exercicios.push({ tipo: "conhecer", sinal });
    exercicios.push({
      tipo: "qual-palavra",
      sinal,
      opcoes: opcoesPara(sinal, todosOsSinais, 4, sorteio),
    });
  }
  for (const sinal of embaralhar(licao.sinais, sorteio)) {
    exercicios.push({
      tipo: "qual-video",
      sinal,
      opcoes: opcoesPara(sinal, licao.sinais, 2, sorteio),
    });
  }
  return exercicios;
}

/** Quem errou revê o exercício no fim da fila; ninguém perde a lição por errar. */
export function aplicarResposta(fila, acertou) {
  const [atual, ...resto] = fila;
  return acertou ? resto : [...resto, atual];
}

function dataLocal(data) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Atualiza os dias seguidos; pular um dia recomeça a contagem de 1. */
export function atualizarDias(progresso, hoje = new Date()) {
  const dataHoje = dataLocal(hoje);
  if (progresso.ultimoDia === dataHoje) return progresso;
  const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  const seguidos = progresso.ultimoDia === dataLocal(ontem) ? (progresso.diasSeguidos ?? 0) + 1 : 1;
  return { ...progresso, ultimoDia: dataHoje, diasSeguidos: seguidos };
}
