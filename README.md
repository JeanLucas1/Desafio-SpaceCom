# Detecção de Encontros - Desafio Spacecom

## Executar
Requer Node.js 18+. Sem dependências externas.

    node index.js data/dataset1.txt out/resultado1.json
    node validar.js out/resultado1.json data/respostas1.json

- `index.js`: lê o dataset, detecta os encontros e grava o JSON.
- `validar.js`: compara o resultado com o gabarito (tipo, ids e timestamp).
- `contar.js`: mostra a contagem por tipo e verifica duplicatas nos resultados.

## Lógica
1. Leitura do CSV (separador `;`), removendo as aspas do timestamp.
2. Agrupamento das posições por timestamp exato (Map), pois só posições
   simultâneas são comparadas.
3. Em cada timestamp, grade espacial com células de ~25 m. Cada pessoa só é
   comparada com quem está na mesma célula ou nas 8 vizinhas. Como o raio é
   20 m (menor que 25 m), nenhum par válido fica fora dessa vizinhança.
4. Distância pela fórmula de Haversine (R = 6.371.000 m); há encontro se d < 20.
5. Classificação, um registro por par:
    - vítima + agressor listado em idsRestricaoMedida: `protetiva`
    - dois monitorados da mesma facção: `faccao`
    - demais pares de monitorados: `generico`
6. Unicidade: cada par é avaliado uma única vez (índice j > i) e ids iguais
   são ignorados.

## Explicação da Abordagem
Comparar todos com todos em cada timestamp é O(n²). A grade reduz o custo
para aproximadamente O(n), sem dependências externas, o que favorece o
tempo de execução (critério de desempate).

## Validação
- Datasets 1 e 2: 100% de acerto contra os gabaritos (0 falsos positivos,
  0 faltando).
- Datasets 3 a 7: sem gabarito; conferidas as contagens por tipo e a
  ausência de duplicatas (0 em todos).
- Caso sintético com vítima de dois agressores ("1,2"): o código marca apenas
  o agressor listado.

## Tempos de execução (neste computador)
| Dataset | Tempo |
|---|---|
| 3 | ~290 ms |
| 4 | ~1214 ms |
| 5 | ~931 ms |
| 6 | ~622 ms |
| 7 | ~354 ms |

## Limitações
- A latitude de referência da grade é a da primeira pessoa de cada
  timestamp (adequado para região geográfica pequena).
- A regra "um tipo por par, com facção prioritária sobre genérico" foi
  inferida dos gabaritos dos datasets 1 e 2.
- O arquivo é lido inteiro em memória (ok para os 21 MB do maior dataset).