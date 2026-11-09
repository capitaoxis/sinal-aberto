import assert from "node:assert/strict";
import { test } from "node:test";
import { aplicarResposta, atualizarDias, montarSessao } from "./sessao.js";

const sinais = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, palavra: id.toUpperCase() }));
const licao = { id: "l", titulo: "L", sinais: sinais.slice(0, 5) };

test("cada sinal é apresentado antes de ser cobrado", () => {
  const exercicios = montarSessao(licao, sinais);
  assert.equal(exercicios.length, 15);
  for (const sinal of licao.sinais) {
    const posicoes = exercicios.flatMap((e, i) => (e.sinal.id === sinal.id ? [[e.tipo, i]] : []));
    assert.equal(posicoes[0][0], "conhecer");
    assert.equal(posicoes.length, 3);
  }
});

test("a resposta certa sempre está entre as opções, sem repetição", () => {
  for (const exercicio of montarSessao(licao, sinais)) {
    if (exercicio.tipo === "conhecer") continue;
    const ids = exercicio.opcoes.map((o) => o.id);
    assert.ok(ids.includes(exercicio.sinal.id));
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("exercício errado volta para o fim da fila", () => {
  assert.deepEqual(aplicarResposta([1, 2, 3], false), [2, 3, 1]);
  assert.deepEqual(aplicarResposta([1, 2, 3], true), [2, 3]);
});

test("dias seguidos sobem, repetem no mesmo dia e recomeçam após uma falta", () => {
  const dia1 = atualizarDias({}, new Date(2026, 10, 8));
  assert.equal(dia1.diasSeguidos, 1);
  assert.equal(atualizarDias(dia1, new Date(2026, 10, 8, 23)).diasSeguidos, 1);
  const dia2 = atualizarDias(dia1, new Date(2026, 10, 9));
  assert.equal(dia2.diasSeguidos, 2);
  assert.equal(atualizarDias(dia2, new Date(2026, 10, 12)).diasSeguidos, 1);
});

test("a virada de mês conta como dia seguido", () => {
  const fimDoMes = atualizarDias({}, new Date(2026, 10, 30));
  assert.equal(atualizarDias(fimDoMes, new Date(2026, 11, 1)).diasSeguidos, 2);
});
