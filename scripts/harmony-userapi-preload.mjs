export function adaptUserApiPreload(source) {
  const replacements = [
    ['return new Uint8Array(stringToBytes(input))', "return new Uint8Array(JSON.parse(nativeFuncs.utils_b642buf(nativeFuncs.utils_str2b64(input))))"],
    ["return nativeFuncs.utils_str2b64(bytesToString(Array.from(buf)))", "return nativeFuncs.utils_str2b64(JSON.stringify(Array.from(buf)), 'bytes')"],
    ['return bytesToString(Array.from(buf))', "return nativeFuncs.utils_str2b64(JSON.stringify(Array.from(buf)), 'utf8')"],
  ]
  for (const [original, replacement] of replacements) {
    if (source.split(original).length !== 2) throw new Error(`Unexpected source preload implementation: ${original}`)
    source = source.replace(original, replacement)
  }
  return source
}
