const { RGB_Linear_Shade, RGB_Alpha_Shade } = require('./colorUtils')

exports.createThemeColors = (rgbaColor, fontRgbaColor, isDark) => {
  const colors = {
    'c-primary': rgbaColor,
  }

  let preColor = rgbaColor
  for (let i = 1; i < 11; i += 1) {
    preColor = RGB_Linear_Shade(isDark ? 0.2 : -0.1, preColor)
    colors[`c-primary-dark-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`c-primary-dark-${i * 100}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
      colors[`c-primary-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, rgbaColor)
    }
  }
  preColor = rgbaColor
  for (let i = 1; i < 10; i += 1) {
    preColor = RGB_Linear_Shade(isDark ? -0.1 : 0.2, preColor)
    colors[`c-primary-light-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`c-primary-light-${i * 100}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
    }
  }
  preColor = RGB_Linear_Shade(isDark ? -0.2 : 1, preColor)
  colors[`c-primary-light-${1000}`] = preColor
  for (let j = 1; j < 10; j += 1) {
    colors[`c-primary-light-${1000}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
  }

  colors['c-theme'] = isDark ? colors['c-primary-light-900'] : rgbaColor

  return { ...colors, ...createFontColors(fontRgbaColor, isDark) }
}

const createFontColors = (rgbaColor, isDark) => {
  // rgb(238, 238, 238)
  // let prec = 'rgb(255, 255, 255)'
  if (rgbaColor == null) rgbaColor = isDark ? 'rgb(229, 229, 229)' : 'rgb(33, 33, 33)'
  if (isDark) return createFontDarkColors(rgbaColor)

  let colors = {
    'c-1000': rgbaColor,
  }
  let step = isDark ? -0.05 : 0.05
  for (let i = 1; i < 21; i += 1) {
    colors[`c-${String(1000 - 50 * i).padStart(3, '0')}`] = RGB_Linear_Shade(step * i, rgbaColor)
  }
  // console.log(colors)
  return colors
}

const createFontDarkColors = (rgbaColor) => {
  // rgb(238, 238, 238)
  // let prec = 'rgb(255, 255, 255)'

  let colors = {
    'c-1000': rgbaColor,
  }
  const step = -0.05
  let preColor = rgbaColor
  for (let i = 1; i < 21; i += 1) {
    preColor = RGB_Linear_Shade(step, preColor)
    colors[`c-${String(1000 - 50 * i).padStart(3, '0')}`] = preColor
  }

  // console.log(colors)
  return colors
}

// console.log(createFontColors('rgb(33, 33, 33)', false))
// console.log(createFontColors('rgb(255, 255, 255)', true))

// console.log(createFontDarkColors('rgb(255, 255, 255)'))

