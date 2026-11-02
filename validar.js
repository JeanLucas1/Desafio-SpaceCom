const fs = require('fs');
const [meu, gabarito] = process.argv.slice(2);
const chave = e => `${e.tipo}|${[...e.monitoradosEncontro].sort((a,b)=>a-b)}|${e.timestamp}`;

const A = new Set(JSON.parse(fs.readFileSync(meu)).map(chave));
const B = new Set(JSON.parse(fs.readFileSync(gabarito)).map(chave));

const corretos = [...A].filter(k => B.has(k)).length;
const falsos = A.size - corretos;
const faltando = [...B].filter(k => !A.has(k));
console.log({ corretos, falsosPositivos: falsos, faltando: faltando.length });
console.log('Exemplos faltando:', faltando.slice(0, 5));