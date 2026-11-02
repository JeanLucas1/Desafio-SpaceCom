const fs = require('fs');

const R = 6371000;
const rad = d => d * Math.PI / 180;

function haversine(lat1, lon1, lat2, lon2) {
    const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function lerDataset(caminho) {
    const linhas = fs.readFileSync(caminho, 'utf8').split('\n');
    const porTimestamp = new Map();
    for (let i = 1; i < linhas.length; i++) {
        const l = linhas[i].trim();
        if (!l) continue;
        const [id, faccao, tsBruto, lat, lon, medida, restr] = l.split(';');
        const ts = tsBruto.replace(/"/g, '');
        const p = {
            id: Number(id),
            faccao: faccao || null,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            vitima: medida === 'true' || medida === '1',
            restr: restr ? new Set(restr.replace(/"/g, '').split(',').map(Number)) : null,
        };
        if (!porTimestamp.has(ts)) porTimestamp.set(ts, []);
        porTimestamp.get(ts).push(p);
    }
    return porTimestamp;
}

function registrar(tipo, a, b, d, ts, out) {
    out.push({
        tipo,
        monitoradosEncontro: [a.id, b.id],
        timestamp: ts,
        posicoes: {
            [a.id]: { lat: a.lat, lon: a.lon },
            [b.id]: { lat: b.lat, lon: b.lon },
        },
        distanciaMetros: d,
    });
}

function classificar(a, b, d, ts, out) {
    if (a.vitima !== b.vitima) {
        const vitima = a.vitima ? a : b;
        const outro = a.vitima ? b : a;
        if (vitima.restr && vitima.restr.has(outro.id)) registrar('protetiva', a, b, d, ts, out);
    } else if (!a.vitima) {
        if (a.faccao && a.faccao === b.faccao) registrar('faccao', a, b, d, ts, out);
        else registrar('generico', a, b, d, ts, out);
    }
}

function detectar(porTimestamp) {
    const encontros = [];
    const CELULA_LAT = 25 / 111320;

    for (const [ts, pessoas] of porTimestamp) {
        const grade = new Map();
        const cosLat = Math.cos(rad(pessoas[0].lat));
        const celulaLon = CELULA_LAT / Math.max(cosLat, 0.01);
        pessoas.forEach((p, idx) => {
            p.cx = Math.floor(p.lon / celulaLon);
            p.cy = Math.floor(p.lat / CELULA_LAT);
            const k = p.cx + ',' + p.cy;
            if (!grade.has(k)) grade.set(k, []);
            grade.get(k).push(idx);
        });

        pessoas.forEach((a, i) => {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const vizinhos = grade.get((a.cx + dx) + ',' + (a.cy + dy));
                    if (!vizinhos) continue;
                    for (const j of vizinhos) {
                        if (j <= i) continue;
                        const b = pessoas[j];
                        if (a.id === b.id) continue;
                        const d = haversine(a.lat, a.lon, b.lat, b.lon);
                        if (d >= 20) continue;
                        classificar(a, b, d, ts, encontros);
                    }
                }
            }
        });
    }
    return encontros;
}

const [entrada, saida] = process.argv.slice(2);
console.time('tempo');
fs.writeFileSync(saida, JSON.stringify(detectar(lerDataset(entrada))));
console.timeEnd('tempo');