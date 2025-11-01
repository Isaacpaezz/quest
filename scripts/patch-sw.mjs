import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const swPath = resolve(__dirname, '..', 'public', 'sw.js')
if (!existsSync(swPath)) {
  console.error('[patch-sw] No se encontró public/sw.js; ¿se ejecutó el build?')
  process.exit(0)
}

let content = readFileSync(swPath, 'utf8')

// Si ya existe importScripts('/sw-extra.js'), no hacemos nada
if (content.includes("importScripts('/sw-extra.js')") || content.includes("importScripts(\"/sw-extra.js\")")) {
  console.log('[patch-sw] public/sw.js ya importa /sw-extra.js')
  process.exit(0)
}

// Intentar reemplazar importScripts() vacío
const replaced = content.replace(/importScripts\(\)/, "importScripts('/sw-extra.js')")
if (replaced !== content) {
  writeFileSync(swPath, replaced)
  console.log('[patch-sw] Inyectado importScripts(\'/sw-extra.js\') en public/sw.js')
  process.exit(0)
}

// Si no hay importScripts(), insertar al inicio del archivo
const injected = "importScripts('/sw-extra.js');\n" + content
writeFileSync(swPath, injected)
console.log('[patch-sw] Añadido importScripts(\'/sw-extra.js\') al inicio de public/sw.js')
