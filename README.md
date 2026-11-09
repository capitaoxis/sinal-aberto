# Sinal Aberto

Aprenda sinais de Libras em lições curtas. É de graça, não precisa de conta, funciona sem som e guarda o progresso só no seu aparelho.

**Acesse:** https://libras.muraldasaude.com

> **Versão de teste.** As lições ainda não foram revisadas por professores surdos. O site não substitui um curso nem um intérprete, principalmente em consultas de saúde ou situações jurídicas.

## O que já funciona

- 4 lições com os 20 sinais da base MINDS-Libras
- Vídeos com câmera lenta e pausa
- Exercícios de reconhecer o sinal, com revisão de quem errou no fim da lição
- Uso por teclado, modo escuro e instalação no celular
- [Extensão de navegador](extensao/README.md): selecionar uma palavra e ver o sinal. [Baixar](https://libras.muraldasaude.com/sinal-aberto-extensao.zip). Testada no Chrome; ainda não está nas lojas nem foi testada no Firefox

## O que ainda vem

- Correção pela câmera, processada no próprio aparelho
- Lições feitas com professores surdos
- Doação de sinais, com consentimento

Para palavras e textos fora das lições, o site pode ligar o avatar 3D do [VLibras](https://vlibras.gov.br), do governo federal. Ele só carrega quando a pessoa pede. Não refazemos o que já existe.

## Como ajudar

Achou um sinal errado? [Avise aqui](../../issues/new?template=sinal-errado.yml). Pessoas surdas e professores de Libras têm a palavra final sobre o conteúdo. Veja o [guia de contribuição](CONTRIBUTING.md).

## Rodar no seu computador

```bash
cd site
python -m http.server 8000   # abra http://localhost:8000
node --test sessao.test.js   # testes da lógica das lições
```

Não há etapa de compilação nem dependências para instalar.

## Licenças

- **Código:** [MIT](LICENSE)
- **Vídeos:** recortes da base MINDS-Libras, [CC BY 4.0](site/videos/CREDITOS.md)
- **De onde veio cada ideia e recurso:** [DE-ONDE-ROUBAMOS.md](DE-ONDE-ROUBAMOS.md)
