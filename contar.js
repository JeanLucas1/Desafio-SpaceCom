const fs = require('fs');
for (let n = 1; n <= 7; n++) {
    const f = `out/resultado${n}.json`;
    if (!fs.existsSync(f)) continue;
    const r = JSON.parse(fs.readFileSync(f));
    const c = { generico: 0, faccao: 0, protetiva: 0 };
    r.forEach(e => c[e.tipo]++);

    const vistos = new Set();
    let dup = 0;
    r.forEach(e => {
        const k = [...e.monitoradosEncontro].sort((a, b) => a - b) + '|' + e.timestamp;
        if (vistos.has(k)) dup++; else vistos.add(k);
    });

    console.log(`resultado${n}:`, r.length, 'encontros', c, '| duplicatas:', dup);
}