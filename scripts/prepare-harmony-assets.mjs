import fs from 'node:fs'
import path from 'node:path'
import { adaptUserApiPreload } from './harmony-userapi-preload.mjs'

const root = path.resolve(import.meta.dirname, '..')
const fontDirectory = path.join(root, 'harmony/entry/src/main/resources/rawfile/fonts')
fs.mkdirSync(fontDirectory, { recursive: true })
fs.copyFileSync(path.join(root, 'src/resources/fonts/icomoon.ttf'), path.join(fontDirectory, 'icomoon.ttf'))
const preload = fs.readFileSync(path.join(root, 'android/app/src/main/assets/script/user-api-preload.js'), 'utf8')
fs.writeFileSync(path.join(fontDirectory, '../user-api-preload.js'), adaptUserApiPreload(preload))
