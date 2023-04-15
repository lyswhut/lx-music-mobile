import {
  rsaEncrypt,
  rsaDecrypt,
  RSA_PADDING,
  generateRsaKey,
  AES_MODE,
  aesEncrypt,
  aesDecrypt,
} from '@/utils/nativeModules/crypto'


const publicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4U2m4fBhTkQOOeAlEusFCDa28UI3xZqv
5EGiOZCJ2bH1LfBjwG5dL3Zk2vT6XLaAn7vyXwVYNmdDn4Fa3l8fZndCty1aUAkpxZehZVy/0I+z
Q7QwSvzQpv2yHPQ76Kcuc3E7VEMSPZkx71dQpsDBtE/F04TW6zOxomFcbqUA97QsjNwU8KKSKKJR
2FhjEX0WhJpvDrkAKQBEujwf3pQDa8iUuF4F0v+oCKiSEf6tuWYx5iBpOvXUmZDLPeBnVZuvJM0e
2yXaIYeZorDaosIvCEqVcDPT3gvePZp6eTyffRJmqk7OkyG2epWM1XPXynu85BYK91pZ03YRNBrp
OkdU7wIDAQAB
-----END PUBLIC KEY-----
`
const privateKey = `
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDhTabh8GFORA454CUS6wUINrbx
QjfFmq/kQaI5kInZsfUt8GPAbl0vdmTa9PpctoCfu/JfBVg2Z0OfgVreXx9md0K3LVpQCSnFl6Fl
XL/Qj7NDtDBK/NCm/bIc9Dvopy5zcTtUQxI9mTHvV1CmwMG0T8XThNbrM7GiYVxupQD3tCyM3BTw
opIoolHYWGMRfRaEmm8OuQApAES6PB/elANryJS4XgXS/6gIqJIR/q25ZjHmIGk69dSZkMs94GdV
m68kzR7bJdohh5misNqiwi8ISpVwM9PeC949mnp5PJ99EmaqTs6TIbZ6lYzVc9fKe7zkFgr3WlnT
dhE0Guk6R1TvAgMBAAECggEAOTnF94Fc1cpHar/Z6tIy9wEeumy9Sb2ei3V4RPLHcLnYspBqZcgi
dxm1SEAND1tzlB7i0uvCmh7keDEc6XpzuUz1bx1f4RBSwdNftSU3uzukpr+vvHw2axPpF52ZUeCU
1dGe5iobCfZNTqN44sH28VuJvc3x4M/CgKIGHjxe4IsyxFCIBpitjk829ymWqlUp/xdVxYfY+WFQ
7/SgA48MU2ASyQVzBA4Q3MQ1d8Fn7Ogd+nYdCGaMfRvO0MI9DcB6uj6KoNZ2VxZkT6eXNEkbzCJR
mbsHfWUx39HVGmlKvZefvryYKJoui1jAZw24F2h8WtBkeGIZ3DgyR9QLQaVT4QKBgQD/HkZUcYXw
I8To/YDtO7i0UZ+vj95PHkfYsWizW1pUiFMHc2jxsyXcjYoKebf8gogKAYnwMxs9iZNkQ4V6zAHi
zeE9C3SwMvh4l6MGJo10+/VmD3SaGZpHEs38HPyXqqqIsQEQq/WDiOMeacTY06AzeIAbW1lVHcTA
Xa8N3TOVuQKBgQDiFP9PAy0trTE8lozQHINytluXlsJap3WcRkGxOTR0v8YLHWYVXMQYo+s4s2Qx
t48nwtBeDEI7OVMA2ip7mAC1IwNObYarLztyB1Vz2FJgVpyj63TdTUaxsiOeAbkLzo4r0TCZnuqi
wdkhAWGu4i3hRrnXe6sbb2Dv4zYysNKT5wKBgQCTjN8AV+gvS4DHgFbg3nmlUNAaqgrZl5nWKkVz
9pH38iCTXpyDrilntjTwehV/Zb9oihtNYUGQBdHJW4QH0ZYFpy1uMQH8Jn6uwIT5ObL2xgLYVHgL
6GLiWG3qMpmk3oBjLnx/N/V3beRt4p6HCV7OZhMxv1Obduwklgp46ka7gQKBgQDDGbOpj+gw/sD6
tEEYZ0LYf55TFvrqGJFaJxcRxXgLOGPDu78YuFFRokOfTtAsR2f2vBvszU9qpHGIzrzSo74YkvqL
d+E7YSs/oCySKCAOmy/aFZtoTwOu3Tf3Zy01jy8JiSETsRxzEC48WWDe9rj5K3u9BTAIIPnaio1+
+TEACQKBgQCfdfmP/05Q4Yc2wEtLfiuHatiobIBzdrem0lXS3ZsRsabnddkeGoQ2QvoMo1+D1/CA
BL/KT6V2h9E8eNQVIOpwjxjR9wPBeHVSLhRV0Rh0Lkog4tGwvWVOh+W+ICr+s6Xn9xxvMUiL3Uw6
9qebfBzruW5Gzke5E5/k3K6aCvFm0Q==
-----END PRIVATE KEY-----
`

// void rsaEncrypt(Buffer.from('hello').toString('base64'), publicKey, RSA_PADDING.OAEPWithSHA1AndMGF1Padding).then((text) => {
//   console.log(text)
//   void rsaDecrypt(text, privateKey, RSA_PADDING.OAEPWithSHA1AndMGF1Padding).then((text) => {
//     console.log(text)
//   })
// })
// void generateRsaKey().then((key) => {
//   console.log(key.publicKey)
//   console.log(key.privateKey)
// })

const aesKey = Buffer.from('123456789abcdefg').toString('base64')
const vi = Buffer.from('012345678901234a').toString('base64')

// void aesEncrypt(Buffer.from('hello').toString('base64'), aesKey, vi, AES_MODE.CBC_PKCS7Padding).then((text) => {
//   console.log('hello', text)
//   void aesDecrypt(text, aesKey, vi, AES_MODE.CBC_PKCS7Padding).then((text) => {
//     console.log(text)
//   })
// })

// void aesEncrypt(Buffer.from('hello2').toString('base64'), aesKey, '', AES_MODE.ECB_NoPadding).then((text) => {
//   console.log('hello2', text)
//   void aesDecrypt(text, aesKey, '', AES_MODE.ECB_NoPadding).then((text) => {
//     console.log(text)
//   })
// })
