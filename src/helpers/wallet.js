import {
  DashWallet,
  DashTx,
  DashHd,
  DashSight,
  DashSocket,
  Cryptic,
} from '../imports.js'
import {
  DatabaseSetup,
} from './db.js'
import { deriveWalletData } from './utils.js'
import {
  STOREAGE_SALT, OIDC_CLAIMS,
  KS_CIPHER, KS_PRF,
} from './constants.js'

// @ts-ignore
import blake from 'blakejs'
// @ts-ignore
import { keccak_256 } from '@noble/hashes/sha3'

// @ts-ignore
let dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

let defaultSocketEvents = {
  onClose: async (e) => console.log('onClose', e),
  onError: async (e) => console.log('onError', e),
  onMessage: async (e, data) => console.log('onMessage', e, data),
}

// Cryptic.setConfig({
//   // cipherAlgorithm: 'AES-GCM',
//   // cipherLength: 256,
//   // hashingAlgorithm: 'SHA-256',
//   // derivationAlgorithm: 'PBKDF2',
//   iterations: 1000,
// })

export async function initDashSocket(
  events = {}
) {
  // @ts-ignore
  let dashsocket = DashSocket.create({
    dashsocketBaseUrl: 'https://insight.dash.org/socket.io',
    cookieStore: null,
    debug: true,
    ...defaultSocketEvents,
    ...events,
  })

  await dashsocket.init()
    .catch((e) => console.log('dashsocket catch err', e));

  // setTimeout(() => {
  //   dashsocket.close()
  // }, 15*60*1000);

  return dashsocket
}

export const store = await DatabaseSetup()

export async function getStoredItems(targStore) {
  let result = {}
  let storeLen = await targStore.length()

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    result[key] = value

    if (iterationNumber === storeLen) {
      return result
    }
  })
}

export async function getFilteredStoreLength(targStore, query = {}) {
  let resLength = 0
  let storeLen = await targStore.length()
  let qs = Object.entries(query)

  console.log('getFilteredStoreLength qs', {
    storeName: targStore?._config?.storeName,
    storeLen,
    qs,
  })

  if (storeLen === 0) {
    return 0
  }

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    let res = true

    // console.log('getFilteredStoreLength qs before each', key, res)

    qs.forEach(([k,v]) => {
      // console.log('getFilteredStoreLength qs each', k, v, value[k])
      if (k === 'key' && key !== v || value[k] !== v) {
        res = undefined
      }
    })

    // console.log('getFilteredStoreLength qs after each', key, res)

    if (res) {
      resLength += 1
    }

    if (iterationNumber === storeLen) {
      return resLength
    }
  })
}

export async function findInStore(targStore, query = {}) {
  let result = {}
  let storeLen = await targStore.length()
  let qs = Object.entries(query)
  // console.log('findInStore qs', qs)

  return await targStore.iterate((
    value, key, iterationNumber
  ) => {
    let res = value

    // console.log('findInStore qs before each', key, res)

    qs.forEach(([k,v]) => {
      // console.log('findInStore qs each', k, v, value[k])
      if (k === 'key' && key !== v || value[k] !== v) {
        res = undefined
      }
    })

    // console.log('findInStore qs after each', key, res)

    if (res) {
      result[key] = res
    }

    if (iterationNumber === storeLen) {
      return result
    }
  })
}

export async function loadWalletsForAlias($alias) {
  $alias.$wallets = {}

  if ($alias?.wallets) {
    for (let w of $alias.wallets) {
      let wallet = await store.wallets.getItem(w)
      $alias.$wallets[w] = wallet
    }
  }

  return $alias
}

export async function initWalletsInfo(
  info = {},
) {
  let wallets = await getStoredItems(store.wallets)

  info = {
    ...OIDC_CLAIMS,
    ...info,
  }

  let alias = info.preferred_username

  wallets = Object.values(wallets || {})
  wallets = wallets
    .filter(w => w.alias === alias)
    .map(w => w.id)

  return {
    alias,
    wallets,
    info,
  }
}

export async function decryptWallet(
  decryptPass,
  decryptIV,
  decryptSalt,
  ciphertext,
) {
  const cryptic = Cryptic.create(
    decryptPass,
    decryptSalt,
    // Cryptic.bufferToHex(
    //   Cryptic.stringToBuffer(decryptSalt)
    // )
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
  encryptionPassword, keystore,
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

export async function initWallet(
  encryptionPassword,
  wallet,
  keystore,
  accountIndex = 0,
  addressIndex = 0,
  infoOverride = {},
) {
  let {
    alias,
    wallets,
    info,
  } = await initWalletsInfo(infoOverride)

  let { id, recoveryPhrase } = wallet

  // console.log(
  //   'initWallet wallets',
  //   wallets,
  //   info,
  // )

  if (!wallets.includes(id)) {
    wallets.push(id)
  }

  let addrs = await batchAddressGenerate(
    wallet,
    accountIndex,
    addressIndex,
  )

  for (let a of addrs.addresses) {
    store.addresses.setItem(
      a.address,
      {
        updatedAt: Date.now(),
        walletId: wallet.id,
        accountIndex: a.accountIndex,
        addressIndex: a.addressIndex,
      }
    )
  }

  let storeWallet = await store.wallets.setItem(
    `${id}`,
    {
      id,
      updatedAt: Date.now(),
      accountIndex,
      addressIndex: addrs?.finalAddressIndex || addressIndex,
      keystore: keystore || await encryptKeystore(
        encryptionPassword,
        recoveryPhrase
      ),
    }
  )

  let storedAlias = await store.aliases.setItem(
    `${alias}`,
    await encryptData(
      encryptionPassword,
      storeWallet.keystore,
      JSON.stringify({
        wallets,
        info,
      })
    )
  )

  // console.log(
  //   'initWallet stored values',
  //   storeWallet,
  //   storedAlias,
  // )

  let contacts = '{}'

  return {
    wallets,
    contacts,
  }
}

export async function checkWalletFunds(addr, wallet = {}) {
  const HOUR = 1000 * 60 * 60;

  let {
    address,
    accountIndex,
    addressIndex,
  } = addr
  let updatedAt = Date.now()
  let $addr = await store.addresses.getItem(address) || {}

  $addr = {
    walletId: wallet.id,
    accountIndex,
    addressIndex,
    ...$addr,
  }
  // console.log('checkWalletFunds $addr', $addr)
  let walletFunds = $addr?.insight

  if (
    !walletFunds?.updatedAt ||
    updatedAt - walletFunds?.updatedAt > HOUR
  ) {
    // console.info('check insight api for addr', addr)

    let insightRes = await dashsight.getInstantBalance(address)

    if (insightRes) {
      let { addrStr, ...res } = insightRes
      walletFunds = res

      $addr.insight = {
        ...walletFunds,
        updatedAt,
      }

      store.addresses.setItem(
        address,
        $addr,
      )
    }
  }

  // console.info('check addr funds', addr, walletFunds)

  return $addr
}

export async function updateAddrFunds(
  wallet, insightRes,
) {
  let updatedAt = Date.now()
  let { addrStr, ...res } = insightRes
  let $addr = await store.addresses.getItem(addrStr) || {}
  let {
    walletId,
    accountIndex,
    addressIndex,
  } = $addr
  // console.log(
  //   'checkWalletFunds $addr',
  //   $addr,
  //   walletId,
  //   wallet?.id,
  //   walletId === wallet?.id
  // )

  if (walletId === wallet?.id) {
    $addr = {
      walletId: wallet.id,
      accountIndex,
      addressIndex,
      ...$addr,
    }

    $addr.insight = {
      ...res,
      updatedAt,
    }

    store.addresses.setItem(
      addrStr,
      $addr,
    )

    // funds += res?.balance || 0
    // walletFunds.balance = funds
    return res
  }
}

export async function updateAllFunds(wallet, walletFunds) {
  let funds = 0
  let addrKeys = await store.addresses.keys()

  if (addrKeys.length === 0) {
    return funds
  }

  console.log(
    'updateAllFunds getInstantBalances for',
    addrKeys,
    addrKeys.length,
  )
  let balances = await dashsight.getInstantBalances(addrKeys)

  console.log('updateAllFunds balances', balances)

  if (balances.length > 0) {
    walletFunds.balance = funds
  }

  for (const insightRes of balances) {
    let { addrStr } = insightRes
    let addrIdx = addrKeys.indexOf(addrStr)
    if (addrIdx > -1) {
      addrKeys.splice(addrIdx, 1)
    }
    funds += (await updateAddrFunds(wallet, insightRes))?.balance || 0
    walletFunds.balance = funds
  }

  for (const addr of addrKeys) {
    let { insight, ...$addr } = await store.addresses.getItem(addr) || {}

    store.addresses.setItem(
      addr,
      $addr,
    )
  }

  console.log('updateAllFunds funds', funds)

  return funds
}

export async function getTotalFunds(wallet) {
  let funds = 0
  let result = {}
  let addrsLen = await store.addresses.length()

  return await store.addresses.iterate((
    value, key, iterationNumber
  ) => {
    if (value?.walletId === wallet?.id) {
      result[key] = value
      funds += value?.insight?.balance || 0
    }

    if (iterationNumber === addrsLen) {
      return funds
    }
  })
}

export async function getAddrsWithFunds(wallet) {
  let result = {}
  let addrsLen = await store.addresses.length()

  return await store.addresses.iterate((
    value, key, iterationNumber
  ) => {
    if (
      value?.walletId === wallet?.id &&
      value?.insight?.balance > 0
    ) {
      result[key] = {
        ...value,
        address: key,
      }
    }

    if (iterationNumber === addrsLen) {
      return result
    }
  })
}

export async function batchAddressGenerate(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
  batchSize = 20,
) {
  let batchLimit = addressIndex + batchSize
  let addresses = []

  let account = await wallet.derivedWallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);

  for (let addrIdx = addressIndex; addrIdx < batchLimit; addrIdx++) {
    let key = await xkey.deriveAddress(addrIdx);
    let address = await DashHd.toAddr(key.publicKey);

    addresses.push({
      address,
      addressIndex: addrIdx,
      accountIndex,
    })

    store.addresses.getItem(address)
      .then(a => {
        let $addr = a || {}

        store.addresses.setItem(
          address,
          {
            ...$addr,
            updatedAt: Date.now(),
            walletId: wallet.id,
            accountIndex,
            addressIndex: addrIdx,
          },
        )
      })
  }

  return {
    addresses,
    finalAddressIndex: batchLimit,
  }
}

export async function batchGenAcctAddrs(
  wallet,
  account,
  batchSize = 20
) {
  let acctAddrsLen = await getFilteredStoreLength(
    store.addresses,
    {
      accountIndex: account.accountIndex,
    }
  )
  let addrIdx = account.addressIndex
  let batSize = batchSize

  if (acctAddrsLen === 0) {
    addrIdx = 0
    batSize = account.addressIndex + batchSize
  }

  if (acctAddrsLen <= account.addressIndex + (batchSize / 2)) {
    return await batchAddressGenerate(
      wallet,
      account.accountIndex,
      addrIdx,
      DashHd.RECEIVE,
      batSize
    )
  }

  return null
}

export async function batchGenAcctsAddrs(
  wallet,
  batchSize = 20
) {
  let $accts = await getStoredItems(store.accounts)
  let $acctsArr = Object.values($accts)
  let accts = {}

  if ($acctsArr.length > 0) {
    for (let $a of $acctsArr) {
      accts[`bat__${$a.accountIndex}`] = await batchGenAcctAddrs(
        wallet,
        $a,
        batchSize,
      )
    }

    // console.warn(
    //   'BATCH GENERATED ACCOUNTS',
    //   accts,
    // )
  }

  return accts
}

export async function forceInsightUpdateForAddress(addr) {
  let currentAddr = await store.addresses.getItem(
    addr
  )
  await store.addresses.setItem(
    addr,
    {
      ...currentAddr,
      insight: {
        ...currentAddr.insight,
        updatedAt: 0
      }
    }
  )
}

export function sortAddrs(a, b) {
  // Ascending Lexicographical on TxId (prev-hash) in-memory (not wire) byte order
  if (a.accountIndex > b.accountIndex) {
    return 1;
  }
  if (a.accountIndex < b.accountIndex) {
    return -1;
  }
  // addressIndex
  // Ascending Vout (Numerical)
  let indexDiff = a.addressIndex - b.addressIndex;
  return indexDiff;
}

export function getBalance(utxos) {
  return utxos.reduce(function (total, utxo) {
    return total + utxo.satoshis;
  }, 0);
}

export function selectOptimalUtxos(utxos, output) {
  let balance = getBalance(utxos);
  let fees = DashTx.appraise({
    //@ts-ignore
    inputs: [{}],
    //@ts-ignore
    outputs: [{}],
  });

  let fullSats = output + fees.min;

  if (balance < fullSats) {
    return [];
  }

  // from largest to smallest
  utxos.sort(function (a, b) {
    return b.satoshis - a.satoshis;
  });

  // /** @type Array<T> */
  let included = [];
  let total = 0;

  // try to get just one
  utxos.every(function (utxo) {
    if (utxo.satoshis > fullSats) {
      included[0] = utxo;
      total = utxo.satoshis;
      return true;
    }
    return false;
  });
  if (total) {
    return included;
  }

  // try to use as few coins as possible
  utxos.some(function (utxo, i) {
    included.push(utxo);
    total += utxo.satoshis;
    if (total >= fullSats) {
      return true;
    }

    // it quickly becomes astronomically unlikely to hit the one
    // exact possibility that least to paying the absolute minimum,
    // but remains about 75% likely to hit any of the mid value
    // possibilities
    if (i < 2) {
      // 1 input 25% chance of minimum (needs ~2 tries)
      // 2 inputs 6.25% chance of minimum (needs ~8 tries)
      fullSats = fullSats + DashTx.MIN_INPUT_SIZE;
      return false;
    }
    // but by 3 inputs... 1.56% chance of minimum (needs ~32 tries)
    // by 10 inputs... 0.00953674316% chance (needs ~524288 tries)
    fullSats = fullSats + DashTx.MIN_INPUT_SIZE + 1;
  });
  return included;
}

export async function createTx(
  fromWallet,
  fundAddrs,
  recipient,
  amount,
  fullTransfer = false,
) {
  const MIN_FEE = 191;
  const DUST = 2000;
  const AMOUNT_SATS = DashTx.toSats(amount)
  const COIN_TYPE = 5
  const usage = 0

  let cachedAddrs = {}

  // console.log(DashTx, fromWallet)

  let dashTx = DashTx.create({
    // @ts-ignore
    version: 3,
  });

  let privateKeys = {}
  let coreUtxos
  let changeAddr = (await deriveWalletData(
    fromWallet.recoveryPhrase,
    0,
    0,
  ))?.address
  let tmpWallet

  let recipientAddr = recipient?.address || recipient

  // console.log('createTx fundAddrs', [...fundAddrs])

  if (Array.isArray(fundAddrs) && fundAddrs.length > 0) {
    fundAddrs.sort(sortAddrs)
    changeAddr = changeAddr || fundAddrs[0].address
    // console.log('createTx fundAddrs sorted', fundAddrs)
    for (let w of fundAddrs) {
      // if (w.insight?.balanceSat < AMOUNT_SATS) {}
      tmpWallet = await deriveWalletData(
        fromWallet.recoveryPhrase,
        w.accountIndex,
        w.addressIndex,
      )
      privateKeys[tmpWallet.address] = tmpWallet.addressKey.privateKey
      cachedAddrs[w.address] = {
        checked_at: w.updatedAt,
        hdpath: `m/44'/${COIN_TYPE}'/${w.accountIndex}'/${usage}`,
        index: w.addressIndex,
        wallet: w.walletId, // maybe `selectedAlias`?
        txs: [],
        utxos: [],
      }
    }
    // console.log('createTx privateKeys', Object.keys(privateKeys), privateKeys)
    coreUtxos = await dashsight.getMultiCoreUtxos(
      Object.keys(privateKeys)
    )
  } else {
    tmpWallet = await deriveWalletData(
      fromWallet.recoveryPhrase,
      fundAddrs.accountIndex,
      fundAddrs.addressIndex,
    )
    privateKeys[tmpWallet.address] = tmpWallet.addressKey.privateKey
    coreUtxos = await dashsight.getCoreUtxos(
      tmpWallet.address
    )
    changeAddr = changeAddr || tmpWallet.address
    cachedAddrs[fundAddrs.address] = {
      checked_at: fundAddrs.updatedAt,
      hdpath: `m/44'/${COIN_TYPE}'/${fundAddrs.accountIndex}'/${usage}`,
      index: fundAddrs.addressIndex,
      wallet: fundAddrs.walletId, // maybe `selectedAlias`?
      txs: [],
      utxos: [],
    }
  }

  // console.log('fundAddrs', {fundAddrs, cachedAddrs})

  // @ts-ignore
  let dashwallet = await DashWallet.create({
    safe: {
      cache: {
        addresses: cachedAddrs
      }
    },
    store: {
      save: data => console.log('dashwallet.store.save', {data})
    },
    dashsight,
  });

  console.log('output', {
    amount,
    AMOUNT_SATS,
  });

  let selection
  let receiverOutput
  if (fullTransfer) {
    selection = dashwallet.useAllCoins({
      utxos: coreUtxos,
      breakChange: false,
    })
    receiverOutput = selection.output
  } else {
    receiverOutput = DashWallet._parseSendInfo(dashwallet, AMOUNT_SATS);

    console.log('_parseSendInfo receiverOutput', {
      receiverOutput,
    });

    selection = dashwallet.useMatchingCoins({
      output: receiverOutput,
      utxos: coreUtxos,
      breakChange: false,
    })
    console.log('sendMatchingUtxos', {
      selection,
    });
  }

  console.log('coreUtxos', {
    coreUtxos,
    selection,
    amount,
    AMOUNT_SATS,
    fullTransfer,
  });

  let outputs = [];
  let stampVal = dashwallet.__STAMP__ * selection.output.stampsPerCoin;
  let receiverDenoms = receiverOutput?.denoms.slice(0);

  for (let denom of selection.output.denoms) {
    let address = '';
    let matchingDenomIndex = receiverDenoms.indexOf(denom);
    if (matchingDenomIndex >= 0) {
      void receiverDenoms.splice(matchingDenomIndex, 1);
      address = recipientAddr;
    } else {
      address = changeAddr;
    }

    let coreOutput = {
      address,
      // address: addrsInfo.addresses.pop(),
      satoshis: denom + stampVal,
      faceValue: denom,
      stamps: selection.output.stampsPerCoin,
    };

    outputs.push(coreOutput);
  }

  let txInfo = {
    inputs: selection.inputs,
    outputs: outputs,
  };

  txInfo.outputs.sort(DashTx.sortOutputs)
  txInfo.inputs.sort(DashTx.sortInputs)

  console.log('txInfo', txInfo);

  let keys = txInfo.inputs.map(
    utxo => privateKeys[utxo.address]
  );

  let tx = await dashTx.hashAndSignAll(txInfo, keys);

  console.log('tx', tx);

  return {
    tx,
    changeAddr,
  }
}

export async function sendTx(
  tx,
) {
  let txHex = tx.transaction;

  console.log('txHex', [txHex]);

  let result = await dashsight.instantSend(txHex);

  console.log('instantSend result', result);

  return result
}
