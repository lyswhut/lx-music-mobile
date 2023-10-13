const { publicEncrypt, privateDecrypt, generateKeyPair, createCipheriv, createDecipheriv, constants } = require('crypto')


const generateRsaKey = () => new Promise((resolve, reject) => {
  generateKeyPair(
    'rsa',
    {
      modulusLength: 2048, // It holds a number. It is the key size in bits and is applicable for RSA, and DSA algorithm only.
      publicKeyEncoding: {
        type: 'spki', // Note the type is pkcs1 not spki
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8', // Note again the type is set to pkcs1
        format: 'pem',
        // cipher: "aes-256-cbc", //Optional
        // passphrase: "", //Optional
      },
    },
    (err, publicKey, privateKey) => {
      if (err) {
        reject(err)
        return
      }
      resolve({
        publicKey,
        privateKey,
      })
    },
  )
})

// generateRsaKey().then(({ publicKey, privateKey }) => {
//   console.log(publicKey)
//   console.log(privateKey)
// })

const rsaEncrypt = (buffer, key) => {
  return publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer).toString('base64')
}
const rsaDecrypt = (buffer, key) => {
  return privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING }, buffer)
}

const publicKey = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0rggENU2JbXgYGoQBIyqlBJP76mgMKh8
5gRIUsAwoq/Oj7qEoKYX9jqtnRgAwEPIV7aLMQxGryfm9fGlohDcUPtcF6za5l6L9Szd+0McOCxZ
SY98/pPFdTYnBHRHPrHHYqzqs4y5wPqpFFNrt2z312YS4xy3SYHkooNPxL0OscxejeG9KtmXQmMd
ejm2MxOIuItlqGHpdwInlvY8Wm/gOMvBmPVffsMaNB412xSZA25D3gRNZRO6O28+S2pXRdSbmFX6
DLWQ/xRDJW1QnfbtjbAJ7Xo1X1anS/NEKRpZqHidjjWI43rL/LhcIAt45a1MkxpBEO+1yCivaNCF
E5jyQwIDAQAB
-----END PUBLIC KEY-----
`
const privateKey = `
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDSuCAQ1TYlteBgahAEjKqUEk/v
qaAwqHzmBEhSwDCir86PuoSgphf2Oq2dGADAQ8hXtosxDEavJ+b18aWiENxQ+1wXrNrmXov1LN37
Qxw4LFlJj3z+k8V1NicEdEc+scdirOqzjLnA+qkUU2u3bPfXZhLjHLdJgeSig0/EvQ6xzF6N4b0q
2ZdCYx16ObYzE4i4i2WoYel3AieW9jxab+A4y8GY9V9+wxo0HjXbFJkDbkPeBE1lE7o7bz5LaldF
1JuYVfoMtZD/FEMlbVCd9u2NsAntejVfVqdL80QpGlmoeJ2ONYjjesv8uFwgC3jlrUyTGkEQ77XI
KK9o0IUTmPJDAgMBAAECggEAUCLE0xH6pym9XH1JfSlvv6MdMkQ8jvSslx8+z/WWKXCZqjBhOuUf
jL0xBGK5+mRsvurFkZAdG4SdwZ+2AWXPG58UHU7X6q8/I6z9+I3DoBtBk4eVng1dlR9UhE2iQJYE
gSLImSLmC51oCrpU5ytyL8D6YtOrYrGa3TD595R8j6G8ElDuvgeqIeFdb5CQUm/4/v+kZ8i8QzGY
lZ65N/mIyl6xB+DnZmWtPRk9HXDdtAnNQlj7uUrKdChq4JNIbwOmrjdmfVkpk5f5JBrCLt8YjGDM
Tf0bSfQcX/PGtm5RHb95XsAp4nGMhVnV44Dnw7kHLIElHRYtt3oXu/SHo3/BDQKBgQDrEpmFaYNS
iVJczAcqmOR+rLHCZnx3GUrKq2udIE6Zb/s2FTzmYHqcSQ66xsn4XzueaCrj9tqUuYIjYnnVM4lL
ux7CgGAwB6moBlUVcDbPZEMJEXXvDE6+oWg3eLGp1S5U7Q8ab0/9laC+c1ncMrgYhBNJ9RhvzimC
/+LPNbdmDQKBgQDleoBdsCDPIpbJVGjkgwN1T6aDPfs+A2lKx0z8Grzmv17HlhYqjy5Jvdx8bulR
0xY81YJ+h8dFD9e9fHdlxpfGj+gtHB8oGzjdN6JWfob6im+XAmg2ftWd1pHx9KBXkpL34NpqleJF
EH7LjGcMjbnceVAM6FEAiPI8BE6RrM91jwKBgQCMzIkzxa0oxKOWfYZVV1qVHS8jt2sZkwafOemt
JWqusMoQ7MubWXJXJdMywFq8752wFciK3pKxviNaumMq9kFoIN4dtfLnEc/mmlRgEORjeDRGvDSd
SAvqVpcrkpknlk64A32mYcHRq8uqB0FtiNuHo6RCChHm9d8bXdUmM5B0CQKBgQCM6xYq8j6jlHUO
O2SSdxXHk1sImyZO5Z9iCVNwOScpd/lHDRadmgFtzUa5rw5ebgbo4qBY/R5Ufa8ZMHbNrA+GItcL
5IoJgfYAeuqYvOg8sIhoLlU6qdaaL6q972ALhvnzeEQIUfR6Pu/uJVEet2WcS27qDju33WELlAV/
laRsZwKBgBzjfllho66+JLamWnthlDHqgEKZDiZF+1fZipOITd7jaA3W8teGc8v9YmSABG4b9IGd
M8XtAFeDYN/MHMKRq+nmLF6hvEQYHUgqYGZGkxX2HcKnRHUssbUOTWJynvRVNPL/k9g9q0d6PeSS
DaE3OO3AUN8voDBaHDII1YscbEBg
-----END PRIVATE KEY-----
`

// const encrypted = rsaEncrypt('123', publicKey)
// console.log(encrypted)
// // const encrypted = 'lJVUCFSV2K90ZdCeosUbtek/wZPmqmKR7ShsP2vfheldde6o9e2Qrmj1QojEwsZtjvq61FCmwpX46LkbsLY/jpM17PUZeqQHhqCy4Rz/hIyMCyIQTPwH5907pIwcpQH2XpJ45/hrjkhLhGU9pkZXtr3qkJiRTi0nllu7z6p6Qf0Hx/zYGxe41VVVnq/9t5xkoUyAfknEn1LMAJyJVft4pD43vTn4tz34+cf7GuzlC4xPiUyKC/trDGBW0kEQBPIaRpd7q1ab9x5fg8mffhBSDR3o+PvVuq3UP02MwpoMDs2bnnwzYawuGv87VNsvEHcvTkZDnh8ME9vtbQboLWVD5w=='


// console.log(rsaDecrypt(Buffer.from(encrypted, 'base64'), privateKey).toString())


const aesEncrypt = (buffer, mode, key, iv) => {
  const cipher = createCipheriv(mode, key, iv)
  return Buffer.concat([cipher.update(buffer), cipher.final()])
}

const aesDecrypt = function(cipherBuffer, mode, key, iv) {
  let decipher = createDecipheriv(mode, key, iv)
  return Buffer.concat([decipher.update(cipherBuffer), decipher.final()])
}


// const aesKey = Buffer.from('123456789abcdefg')
// const iv = Buffer.from('012345678901234a')

// // const encryptedAes = aesEncrypt(Buffer.from('hello'), 'aes-128-cbc', aesKey, iv)
// // console.log(encryptedAes)
// // // const encryptedAes = '4zbNfntuHPrHtPvhEVC10Q=='

// // console.log(aesDecrypt(Buffer.from(encryptedAes, 'base64'), 'aes-128-cbc', aesKey, iv).toString())

// // const encryptedAes = aesEncrypt(Buffer.from('hello'), 'aes-128-ecb', aesKey, '')
// // console.log(encryptedAes)
// const encryptedAes = 'oEShKajDOUILq3cVoRv0iw=='

// console.log(aesDecrypt(Buffer.from(encryptedAes, 'base64'), 'aes-128-ecb', aesKey, '').toString())

const text = '{"id":"3779629","n":100000,"p":1}'
const iv = Buffer.from('0102030405060708')
const presetKey = Buffer.from('0CoJUm6Qyw8W8jud')
const secretKey = [56, 70, 110, 77, 99, 98, 51, 117, 67, 98, 85, 73, 118, 80, 104, 70]

// Rn061YcbiMv3hQJlOLNklgQqbcUEF2YyiShXN8kevX3z+iU8j1qHhNEVEoNTNTPQ
// 4dbKbQjGbYdp/Q0bEwCTHcoB8vEQZNc5OUxz6VxScq4AuCYNHwWY44GJrfYuMV7GqQlC/88WdKg4w9ILJGAx5w==

const r1 = aesEncrypt(text, 'aes-128-cbc', presetKey, iv)
console.log(r1.toString('base64'))
console.log(aesEncrypt(r1, 'aes-128-cbc', Buffer.from(secretKey), iv).toString('base64'))
