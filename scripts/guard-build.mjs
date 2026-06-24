import { readFileSync } from 'node:fs'

const path = 'src/implementationConfig.ts'
const src = readFileSync(path, 'utf8')

const match = src.match(/const\s+api_url\s*:\s*string\s*=\s*['"`]([^'"`]+)['"`]/)
if (!match) {
  console.error(`guard-build: couldn't find api_url in ${path}`)
  process.exit(1)
}

const url = match[1]
if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)) {
  console.error(`\n✖ Refusing to build — api_url is a local dev URL: ${url}`)
  console.error(`  Fix api_url in ${path} before building for distribution.\n`)
  process.exit(1)
}

if (!/^https:\/\//i.test(url)) {
  console.error(`\n✖ Refusing to build — api_url must use https:// — got: ${url}`)
  console.error(`  Check the protocol in api_url in ${path}.\n`)
  process.exit(1)
}

console.log(`guard-build: api_url OK (${url})`)
