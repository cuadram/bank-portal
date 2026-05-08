#!/usr/bin/env node
/**
 * validate-smoke-vs-openapi.js — DEBT-049 · candidato GR-CI-002
 *
 * Compara los endpoints expuestos por OpenAPI 3.1 (springdoc) con los
 * endpoints invocados por los smoke tests del sprint (infra/compose/
 * smoke-test-vX.Y.Z.sh). Reporta drift en ambos sentidos:
 *
 *   - paths en OpenAPI sin smoke test  (cobertura insuficiente)
 *   - paths en smoke sin entrada OpenAPI (regresion documentacion)
 *
 * Uso:
 *   node .sofia/scripts/validate-smoke-vs-openapi.js [--filter=savings]
 *                                                    [--smoke=path/to/smoke.sh]
 *                                                    [--openapi=http://host:port/v3/api-docs]
 *
 * Defaults:
 *   --filter   = savings
 *   --smoke    = ultimo infra/compose/smoke-test-v*.sh por mtime
 *   --openapi  = http://localhost:8081/v3/api-docs
 *
 * Exit codes:
 *   0 = sin drift
 *   1 = drift detectado
 *   2 = error de ejecucion (OpenAPI no accesible, smoke no encontrado, etc)
 *
 * Sprint 26 · FEAT-024 · Step 4 · Fase H.4
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ---------- args ----------
const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--'))
        .map(a => {
            const [k, ...v] = a.replace(/^--/, '').split('=');
            return [k, v.join('=') || true];
        })
);
const FILTER  = (typeof args.filter === 'string') ? args.filter : 'savings';
const OPENAPI = (typeof args.openapi === 'string') ? args.openapi : 'http://localhost:8081/v3/api-docs';
let   SMOKE   = (typeof args.smoke === 'string') ? args.smoke : null;

// ---------- locate smoke ----------
if (!SMOKE) {
    const dir = 'infra/compose';
    if (!fs.existsSync(dir)) {
        console.error(`[ERR] directorio ${dir} no existe`);
        process.exit(2);
    }
    const candidates = fs.readdirSync(dir)
        .filter(f => /^smoke-test-v[0-9.]+\.sh$/.test(f))
        .map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
    if (candidates.length === 0) {
        console.error(`[ERR] ningun smoke-test-v*.sh encontrado en ${dir}`);
        process.exit(2);
    }
    SMOKE = path.join(dir, candidates[0].f);
}
if (!fs.existsSync(SMOKE)) {
    console.error(`[ERR] smoke no encontrado: ${SMOKE}`);
    process.exit(2);
}

// ---------- fetch OpenAPI ----------
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, { timeout: 5000 }, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} desde ${url}`));
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error(`OpenAPI no es JSON valido: ${e.message}`)); }
            });
        });
        req.on('timeout', () => { req.destroy(new Error('timeout 5s')); });
        req.on('error', reject);
    });
}

// ---------- extract paths ----------
function normalizePath(p) {
    // querystring/fragmento fuera, trailing slash fuera
    return p.replace(/[?#].*$/, '').replace(/\/+$/, '');
}

function pathToTemplate(p) {
    // sustituye segmentos UUID, numericos o variables shell por {id} para comparar
    return p
        .split('/')
        .map(seg => {
            if (/^[0-9a-fA-F-]{36}$/.test(seg)) return '{id}';
            if (/^\$[A-Z_]+$/.test(seg))        return '{id}'; // $ACCOUNT_ID -> {id}
            if (/^[0-9]+$/.test(seg))           return '{id}';
            return seg;
        })
        .join('/');
}

function extractOpenapiPaths(spec) {
    const paths = spec.paths || {};
    return Object.keys(paths)
        .map(normalizePath)
        .filter(p => p.includes(FILTER));
}

function extractSmokePaths(smokeContent) {
    // Patrones soportados:
    //   1) check ... "$BASE_URL/api/v1/..."     (curl directo)
    //   2) urllib.request.Request('$BASE_URL/api/v1/...')
    //   3) curl ... $BASE_URL/api/v1/...
    const found = new Set();
    const re = /\$BASE_URL(\/api\/[A-Za-z0-9_{}\/\.\-\$]+)/g;
    let m;
    while ((m = re.exec(smokeContent)) !== null) {
        let p = normalizePath(m[1]);
        p = pathToTemplate(p);
        if (p.includes(FILTER)) found.add(p);
    }
    return Array.from(found);
}

// ---------- main ----------
(async () => {
    let spec;
    try {
        spec = await fetchJson(OPENAPI);
    } catch (e) {
        console.error(`[ERR] no se pudo leer OpenAPI: ${e.message}`);
        console.error(`     comprueba que el backend esta arriba: docker compose up -d`);
        process.exit(2);
    }

    const openapiPaths = extractOpenapiPaths(spec).sort();
    const smokeRaw = fs.readFileSync(SMOKE, 'utf8');
    const smokePaths = extractSmokePaths(smokeRaw).sort();

    const openapiSet = new Set(openapiPaths);
    const smokeSet   = new Set(smokePaths);

    const missingInSmoke   = openapiPaths.filter(p => !smokeSet.has(p));
    const missingInOpenapi = smokePaths.filter(p => !openapiSet.has(p));

    console.log('======================================================');
    console.log(' validate-smoke-vs-openapi · DEBT-049');
    console.log('======================================================');
    console.log(` filter   : ${FILTER}`);
    console.log(` openapi  : ${OPENAPI}`);
    console.log(` smoke    : ${SMOKE}`);
    console.log('------------------------------------------------------');
    console.log(` OpenAPI paths (${openapiPaths.length}):`);
    openapiPaths.forEach(p => console.log('   ' + p));
    console.log(` Smoke paths (${smokePaths.length}):`);
    smokePaths.forEach(p => console.log('   ' + p));
    console.log('------------------------------------------------------');

    let drift = 0;

    if (missingInSmoke.length) {
        console.log(` [DRIFT] paths en OpenAPI sin smoke (${missingInSmoke.length}):`);
        missingInSmoke.forEach(p => console.log('   - ' + p));
        drift += missingInSmoke.length;
    } else {
        console.log(' [OK] todos los paths OpenAPI tienen smoke');
    }

    if (missingInOpenapi.length) {
        console.log(` [DRIFT] paths en smoke sin OpenAPI (${missingInOpenapi.length}):`);
        missingInOpenapi.forEach(p => console.log('   - ' + p));
        drift += missingInOpenapi.length;
    } else {
        console.log(' [OK] todos los paths smoke estan en OpenAPI');
    }

    console.log('======================================================');
    if (drift === 0) {
        console.log(' RESULT: PASS · sin drift');
        process.exit(0);
    } else {
        console.log(` RESULT: FAIL · ${drift} discrepancias`);
        process.exit(1);
    }
})();
