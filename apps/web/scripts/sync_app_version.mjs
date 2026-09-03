#!/usr/bin/env node
/**
 * Sincroniza a versão visível do app a partir do canônico
 * `apps/web/package.json` (`version`).
 *
 * Uso:
 *   node scripts/sync_app_version.mjs            # espelha o package.json atual
 *   node scripts/sync_app_version.mjs 0.5.0      # troca a versão nos dois lugares
 *
 * Trocar de versão é um comando só: `bun run version:sync 0.5.0`
 * executado em `apps/web`.
 */
import { readFile, writeFile } from 'node:fs/promises';

const packageUrl = new URL('../package.json', import.meta.url);
const moduleUrl = new URL('../src/lib/app-version.ts', import.meta.url);

const packageText = await readFile(packageUrl, 'utf8');
const pkg = JSON.parse(packageText);
const [, , next] = process.argv;

const version = typeof next === 'string' && next.length > 0 ? next : pkg.version;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
	throw new Error(`Versão inválida: ${String(version)}. Use o formato X.Y.Z.`);
}

if (typeof next === 'string' && next.length > 0) {
	pkg.version = version;
	await writeFile(packageUrl, `${JSON.stringify(pkg, null, 2)}\n`);
}

await writeFile(
	moduleUrl,
	`// Fonte de versão visível do app. Não edite à mão.\n// Troque com: bun run version:sync <X.Y.Z> (em apps/web).\n// Canônico: apps/web/package.json ("version").\nexport const APP_VERSION = '${version}';\n`
);

console.log(`APP_VERSION = ${version}`);
