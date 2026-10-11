import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const fontDirectory = path.join(root, 'harmony/entry/src/main/resources/rawfile/fonts')
fs.mkdirSync(fontDirectory, { recursive: true })
fs.copyFileSync(path.join(root, 'src/resources/fonts/icomoon.ttf'), path.join(fontDirectory, 'icomoon.ttf'))
