// @ts-ignore
import blake from 'blakejs'
// @ts-ignore
import { keccak_256 } from '@noble/hashes/sha3'

import {
  Cryptic,
} from '../imports.js'
import {
  KS_CIPHER, KS_PRF,
} from './constants.js'

export async function decryptWallet(
  decryptPass,
  decryptIV,
  decryptSalt,
  ciphertext,
) {
  const cryptic = Cryptic.create(
    decryptPass,
    decryptSalt,
  )

  return await cryptic.decrypt(ciphertext, decryptIV);
}

export function blake256(data) {
  if ('string' === typeof data) {
    data = Cryptic.hexToBuffer(data)
  }
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, data);
  return Cryptic.toHex(blake.blake2bFinal(context));
}

export function getKeystoreData(keystore) {
  const {
    ciphertext,
    cipher,
    mac,
  } = keystore.crypto
  const [
    cipherAlgorithm,
    cipherLength,
  ] = KS_CIPHER[cipher]

  const derivationAlgorithm = keystore.crypto.kdf.toUpperCase()
  const hashingAlgorithm = KS_PRF[keystore.crypto.kdfparams.prf]
  const derivedKeyLength = keystore?.crypto?.kdfparams?.dklen
  const iterations = keystore.crypto.kdfparams.c
  const iv = keystore.crypto.cipherparams.iv
  const ivBuffer = Cryptic.hexToBuffer(iv)
  const salt = keystore.crypto.kdfparams.salt
  const saltBuffer = Cryptic.hexToBuffer(salt)

  const keyLength = derivedKeyLength / 2
  const numBits = (keyLength + iv.length) * 8

  return {
    cipher,
    cipherAlgorithm,
    cipherLength,
    ciphertext,
    mac,
    derivationAlgorithm,
    hashingAlgorithm,
    derivedKeyLength,
    iterations,
    iv,
    ivBuffer,
    salt,
    saltBuffer,
    keyLength,
    numBits,
  }
}

export async function setupCryptic(
  encryptionPassword,
  keystore,
) {
  const ks = getKeystoreData(keystore)
  const {
    cipherLength, cipherAlgorithm,
    derivationAlgorithm, hashingAlgorithm, iv,
    iterations, salt,
  } = ks

  Cryptic.setConfig({
    cipherAlgorithm,
    cipherLength,
    hashingAlgorithm,
    derivationAlgorithm,
    iterations,
  })

  const cryptic = Cryptic.create(
    encryptionPassword,
    salt,
  );

  return {
    Cryptic,
    cryptic,
    ks,
  }
}

export async function encryptData(
  encryptionPassword,
  keystore,
  data,
) {
  const { cryptic, ks } = await setupCryptic(
    encryptionPassword,
    keystore,
  )

  return await cryptic.encrypt(data, ks.iv);
}

export async function decryptData(
  encryptionPassword,
  keystore,
  data,
) {
  const { cryptic, ks } = await setupCryptic(
    encryptionPassword,
    keystore,
  )

  return await cryptic.decrypt(data, ks.iv)
}

export function storedData(
  encryptionPassword,
  keystore,
) {
  const SD = {}

  SD.decryptData = async function(data) {
    if (data && 'string' === typeof data && data.length > 0) {
      data = JSON.parse(await decryptData(
        encryptionPassword,
        keystore,
        data
      ))
    }

    return data
  }

  SD.decryptItem = async function(targetStore, item,) {
    let data = await targetStore.getItem(
      item,
    )

    data = await SD.decryptData(data)

    return data
  }

  /**
   *
   * @param {*} targetStore
   * @param {*} item
   * @param {*} data
   * @param {*} extend
   * @returns {Promise<[String,Object]>}
   */
  SD.encryptData = async function(
    targetStore, item, data = {}, extend = true
  ) {
    let encryptedData = ''
    let storedData = {}
    let jsonData = {}
    if (extend) {
      // storedData = await targetStore.getItem(
      //   item,
      // )
      storedData = await SD.decryptItem(
        targetStore,
        item
      )
    }

    if (data) {
      jsonData = {
        ...storedData,
        ...data,
      }
      encryptedData = await encryptData(
        encryptionPassword,
        keystore,
        JSON.stringify(jsonData)
      )
    }

    return [
      encryptedData,
      jsonData,
    ]
  }

  SD.encryptItem = async function(
    targetStore, item, data = {}, extend = true
  ) {
    let encryptedData = ''
    let encryptedResult = ''
    let result = {}

    if (data || extend) {
      let d = await SD.encryptData(targetStore, item, data, extend)
      encryptedResult = d[0]
      result = d[1]
      encryptedData = await targetStore.setItem(
        item,
        encryptedResult
      )
    }

    return result || data || encryptedData
    // return encryptedData
  }

  return SD
}

export async function decryptKeystore(
  encryptionPassword,
  keystore,
) {
  const { Cryptic, cryptic, ks } = await setupCryptic(
    encryptionPassword,
    keystore,
  )

  const derivedBytes = await cryptic.deriveBits(ks.numBits, ks.salt)

  const bMAC = blake256([
    ...new Uint8Array(derivedBytes.slice(16, 32)),
    ...Cryptic.toBytes(ks.ciphertext),
  ])
  const kMAC = Cryptic.toHex(keccak_256(new Uint8Array([
    ...new Uint8Array(derivedBytes.slice(16, 32)),
    ...Cryptic.toBytes(ks.ciphertext),
  ])));

  if (ks.mac && ![bMAC, kMAC].includes(ks.mac)) {
    throw new Error('Invalid password')
  }

  return await cryptic.decrypt(ks.ciphertext, ks.iv)
}

export function genKeystore(
  // aes-256-gcm
  cipher = 'aes-128-ctr',
  salt = Cryptic.randomBytes(32),
  iv = Cryptic.randomBytes(16),
  iterations = 262144,
  id = crypto.randomUUID(),
) {
  return {
    crypto: {
      cipher,
      ciphertext: '',
      cipherparams: {
        iv: Cryptic.bufferToHex(iv),
      },
      kdf: "pbkdf2",
      kdfparams: {
        c: iterations,
        dklen: 32,
        prf: "hmac-sha256",
        salt: Cryptic.bufferToHex(salt),
      },
      mac: '',
    },
    id,
    meta: 'dash-incubator-keystore',
    version: 3,
  }
}

export async function encryptKeystore(
  encryptionPassword,
  recoveryPhrase,
) {
  let keystore = genKeystore()
  const { Cryptic, cryptic, ks } = await setupCryptic(
    encryptionPassword,
    keystore,
  )

  const derivedBytes = await cryptic.deriveBits(ks.numBits, ks.salt)
  const encryptedPhrase = await cryptic.encrypt(recoveryPhrase, ks.iv);

  keystore.crypto.ciphertext = encryptedPhrase

  const bMAC = blake256([
    ...new Uint8Array(derivedBytes.slice(16, 32)),
    ...Cryptic.toBytes(keystore.crypto.ciphertext),
  ])
  const kMAC = Cryptic.toHex(keccak_256(new Uint8Array([
    ...new Uint8Array(derivedBytes.slice(16, 32)),
    ...Cryptic.toBytes(keystore.crypto.ciphertext),
  ])));

  keystore.crypto.mac = bMAC

  // console.log(
  //   'encrypted keystore',
  //   ks,
  //   {
  //     encryptedPhrase,
  //     // keyMaterial,
  //     // derivedKey,
  //     // derivedBytes,
  //   },
  //   {
  //     bMAC,
  //     kMAC,
  //   },
  // )

  return keystore
}