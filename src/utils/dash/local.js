import {
  USAGE,
  DUFFS,
  DASH_URI_REGEX,
  OIDC_CLAIMS,
  SUPPORTED_CLAIMS,
} from '../constants.js'

import {
  DashHd,
  DashTx,
  DashPhrase,
} from '../../imports.js'

import {
  DatabaseSetup,
  findInStore,
  getFilteredStoreLength,
  getStoredItems,
  loadStoreObject,
} from '../db.js'

import {
  encryptData,
  encryptKeystore,
  storedData,
} from '../cryptic.js'

import {
  appState,
  appTools,
  appDialogs,
} from '../../store/index.js'

import {
  getStoredWallet,
  userInfo,
} from '../../state/index.js'

import showErrorDialog from '../../rigs/show-error.js'

export const store = await DatabaseSetup()

/**
 *
 * @param {String} [phraseOrXkey]
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [usageIndex]
 *
 * @returns {Promise<SeedWallet>}
 */
export async function deriveWalletData(
  phraseOrXkey,
  accountIndex = 0,
  addressIndex = 0,
  usageIndex = DashHd.RECEIVE,
) {
  if (!phraseOrXkey) {
    throw new Error('Seed phrase or xkey value empty or invalid')
  }

  let recoveryPhrase
  let seed, derivedWallet, wpub, id, account
  let xkey, xprv, xpub, xkeyId
  let addressKey, addressKeyId, address
  let secretSalt = ''; // "TREZOR";
  let recoveryPhraseArr = phraseOrXkey.trim().split(' ')

  if (recoveryPhraseArr?.length >= 12) {
    recoveryPhrase = phraseOrXkey;
  }

  if (
    ['xprv', 'xpub'].includes(
      phraseOrXkey?.substring(0,4) || ''
    )
  ) {
    xkey = await DashHd.fromXKey(phraseOrXkey);
  } else {
    seed = await DashPhrase.toSeed(recoveryPhrase, secretSalt);
    derivedWallet = await DashHd.fromSeed(seed);
    wpub = await DashHd.toXPub(derivedWallet);
    id = await DashHd.toId(derivedWallet);
    account = await derivedWallet.deriveAccount(accountIndex);
    xkey = await account.deriveXKey(usageIndex);
    xprv = await DashHd.toXPrv(xkey);
  }

  xkeyId = await DashHd.toId(xkey);
  xpub = await DashHd.toXPub(xkey);
  addressKey = await xkey.deriveAddress(addressIndex);
  addressKeyId = await DashHd.toId(addressKey);
  address = await DashHd.toAddr(addressKey.publicKey);

  let derivedData = {
    id,
    accountIndex,
    usageIndex,
    addressIndex,
    addressKeyId,
    addressKey,
    address,
    xkeyId,
    xkey,
    xprv,
    xpub,
    seed,
    wpub,
    account,
    derivedWallet,
    // recoveryPhrase,
  }

  Object.defineProperties(derivedData, {
    recoveryPhrase: {
      get: () => recoveryPhrase,
    },
  });

  return derivedData
}

/**
 *
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [use]
 *
 * @returns {Promise<SeedWallet>}
 */
export async function generateWalletData(
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE
) {
  let targetBitEntropy = 128;
  let recoveryPhrase = await DashPhrase.generate(targetBitEntropy);

  return await deriveWalletData(
    recoveryPhrase,
    accountIndex,
    addressIndex,
    use
  )
}

/**
 *
 * @example
 *    let acct = deriveAccountData(wallet, 0, 0, 0)
 *
 * @param {HDWallet} wallet
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [use]
 *
 * @returns
 */
export async function deriveAccountData(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
) {
  let account = await wallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);
  let xkeyId = await DashHd.toId(xkey);
  let xprv = await DashHd.toXPrv(xkey);
  let xpub = await DashHd.toXPub(xkey);
  let xpubKey = await DashHd.fromXKey(xpub);
  let xpubId = await DashHd.toId(xpubKey);
  let key = await xkey.deriveAddress(addressIndex);
  let address = await DashHd.toAddr(key.publicKey);

  return {
    account,
    xkeyId,
    xkey,
    xprv,
    xpub,
    xpubKey,
    xpubId,
    key,
    address
  }
}

/**
 *
 * @example
 *    let addr = deriveAddressData(wallet, 0, 0, 0)
 *
 * @param {HDWallet} wallet
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [use]
 *
 * @returns
 */
export async function deriveAddressData(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
) {
  let account = await wallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);
  let key = await xkey.deriveAddress(addressIndex);
  let address = await DashHd.toAddr(key.publicKey);

  return address
}

export function phraseToEl(phrase, el = 'span', cls = 'tag') {
  let words = phrase?.split(' ')
  return words?.map(
    w => `<${el} class="${cls}">${w}</${el}>`
  )?.join(' ')
}

/**
 * @param {Number} duffs - ex: 00000000
 * @param {Number} [fix] - value for toFixed - ex: 8
 */
export function toDash(duffs, fix = 8) {
  return (duffs / DUFFS).toFixed(fix);
}

/**
 * @param {String} dash - ex: 0.00000000
 */
export function toDashStr(dash, pad = 12) {
  return `Đ ` + `${dash}`.padStart(pad, " ");
}

/**
 * Based on https://stackoverflow.com/a/48100007
 *
 * @param {Number} dash - ex: 0.00000000
 * @param {Number} [fix] - value for toFixed - ex: 8
 */
export function fixedDash(dash, fix = 8) {
  return (
    Math.trunc(dash * Math.pow(10, fix)) / Math.pow(10, fix)
  )
  .toFixed(fix);
}

/**
 * Based on https://stackoverflow.com/a/27946310
 * @example
 *    let roof = roundUsing(Math.ceil, 0.1111111, 3)
 *    let base = roundUsing(Math.floor, 0.1111111, 3)
 *
 * @param {Function} func - Math.ceil
 * @param {Number} number - ex: 0.00000000
 * @param {Number} [prec] - precision - ex: 8
 */
export function roundUsing(func, number, prec = 8) {
  var tempnumber = number * Math.pow(10, prec);
  tempnumber = func(tempnumber);
  return tempnumber / Math.pow(10, prec);
}

/**
 * @param {Number} duffs - ex: 00000000
 */
export function toDASH(duffs) {
  let dash = toDash(duffs / DUFFS);
  return toDashStr(dash);
}

/**
 * @param {Number} dash - ex: 0.00000000
 * @param {Number} [fix] - value for toFixed - ex: 8
 */
export function fixedDASH(dash, fix = 8) {
  return toDashStr(fixedDash(dash, fix));
}

/**
 * @param {String} dash - ex: 0.00000000
 */
export function toDuff(dash) {
  return Math.round(parseFloat(dash) * DUFFS);
}

export function formatDash(
  unformattedBalance,
  options = {},
) {
  let opts = {
    maxlen: 10,
    fract: 8,
    sigsplit: 3,
    ...options,
  }
  let funds = 0
  let balance = `${funds}`

  if (unformattedBalance) {
    funds += unformattedBalance
    balance = fixedDash(funds, opts.fract)
    // TODO FIX: does not support large balances

    // console.log('balance fixedDash', balance, balance.length)

    let [fundsInt,fundsFract] = balance.split('.')
    opts.maxlen -= fundsInt.length

    let fundsFraction = fundsFract?.substring(
      0, Math.min(Math.max(0, opts.maxlen), opts.sigsplit)
    )

    let fundsRemainder = fundsFract?.substring(
      fundsFraction.length,
      Math.max(0, opts.maxlen)
    )

    balance = `${
      fundsInt
    }<sub><span>.${
      fundsFraction
    }</span>${
      fundsRemainder
    }</sub>`
  }

  return balance
}

export async function getUnusedChangeAddress(account) {
  let filterQuery = {
    xkeyId: account.xkeyId,
    usageIndex: DashHd.CHANGE,
  }

  let foundAddrs = await findInStore(store.addresses, filterQuery)

  for (let [fkey,fval] of Object.entries(foundAddrs)) {
    if (!fval.insight?.balance) {
      return fkey
    }
  }

  // return foundAddr.address
  return null
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

  let addrs = await batchAddressUsageGenerate(
    wallet,
    accountIndex,
    addressIndex,
  )

  console.log('init wallet batchAddressUsageGenerate', addrs)

  for (let a of addrs.addresses) {
    store.addresses.setItem(
      a.address,
      {
        updatedAt: Date.now(),
        walletId: wallet.id,
        accountIndex: a.accountIndex,
        addressIndex: a.addressIndex,
        usageIndex: a.usageIndex,
        xkeyId: a.xkeyId,
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
    keystore: storeWallet.keystore,
    wallets,
    contacts,
  }
}

export function filterPairedContacts(contact) {
  let outLen = Object.keys(contact.outgoing || {}).length
  return outLen > 0 // && !!contact.alias
}

export function filterUnpairedContacts(contact) {
  return !filterPairedContacts(contact)
}

export function sortContactsByAlias(a, b) {
  const aliasA = a.alias || a.info?.preferred_username?.toUpperCase() || 'zzz';
  const aliasB = b.alias || b.info?.preferred_username?.toUpperCase() || 'zzz';

  if (aliasA < aliasB) {
    return -1;
  }
  if (aliasA > aliasB) {
    return 1;
  }
  return 0;
}

export function sortContactsByName(a, b) {
  const nameA = a.info?.name?.toUpperCase();
  const nameB = b.info?.name?.toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

export function sortTransactionsByTime(a, b) {
  const timeA = a.time;
  const timeB = b.time;

  if (timeA > timeB) {
    return -1;
  }
  if (timeA < timeB) {
    return 1;
  }
  return 0;
}

export function DashURLSearchParams(params) {
  let searchParams
  let qry = {}

  Object.defineProperties(this, {
    entries: {
      enumerable: false,
      configurable: false,
      writable: false,
      value: () => Object.entries(qry),
    },
    toString: {
      enumerable: false,
      configurable: false,
      writable: false,
      value: () => this.entries().map(p => p.join('=')).join('&'),
    },
    size: {
      enumerable: false,
      configurable: false,
      get() { return this.entries().length },
    },
  });

  if (typeof params === 'string' && params !== '') {
    searchParams = params.split('&')
    searchParams.forEach(q => {
      let [prop,val] = q.split('=')
      qry[prop] = val
    })
  }

  if(Array.isArray(params) && params.length > 0) {
    params.forEach(q => {
      let [prop,val] = q
      qry[prop] = val
    })
  }

  // console.log('DashURLSearchParams', {
  //   params, searchParams, qry,
  //   qryStr: this.toString(),
  // })
}

export function parseDashURI(uri) {
  let result = {}
  let parsedUri = [
    ...uri.matchAll(DASH_URI_REGEX)
  ]?.[0]?.groups || {}
  // let searchParams = new URLSearchParams(parsedUri?.params || '')
  let searchParams = new DashURLSearchParams(parsedUri?.params || '')

  console.log(
    'parseDashURI',
    parsedUri,
    searchParams
  )

  if (parsedUri?.address) {
    result.address = parsedUri?.address
  }

  if (searchParams?.size > 0) {
    let claims = Object.fromEntries(
      searchParams?.entries()
    )

    for (let c in claims) {
      if (SUPPORTED_CLAIMS.includes(c)) {
        result[c] = claims[c]
      }
    }
  }

  return result
}

export function parseAddressField(uri) {
  /* @type {Record<keyof OIDC_CLAIMS,any>} */
  let result = {}

  if (uri.includes(':')) {
    let [protocol] = uri.split(':')
    if (protocol.includes('dash')) {
      // @ts-ignore
      result = parseDashURI(uri)
    }
  } else if (
    'xprv' === uri?.substring(0,4)
  ) {
    result.xprv = uri
  } else if (
    'xpub' === uri?.substring(0,4)
  ) {
    result.xpub = uri
  } else {
    result.address = uri
  }

  return result
}

export function isEmpty(value) {
  if (value === null) {
    return true
  }
  // if (typeof value === 'boolean' && value === false) {
  //   return true
  // }
  if (typeof value === 'string' && value?.length === 0) {
    return true
  }
  if (typeof value === 'object' && Object.keys(value)?.length === 0) {
    return true
  }
  if (Array.isArray(value) && value.length === 0) {
    return true
  }
  return false;
}

export function generateContactPairingURI(
  state,
  protocol = 'dash', // 'web+dash'
  joiner = ':'
) {
  let addr = state.wallet?.address || ''
  let claims = [
    ["xpub", state.wallet?.xpub || ''],
    ["sub", state.wallet?.xkeyId || ''],
  ]

  if (state.userInfo) {
    let filteredInfo = Array.from(
      Object.entries(state.userInfo)
    ).filter(p => {
      let [key, val] = p
      if (
        ![
          // 'updated_at',
          'email_verified',
          'phone_number_verified',
        ].includes(key) &&
        !isEmpty(val)
      ) {
        return true
      }
    })

    claims = [
      ...claims,
      ...filteredInfo,
    ]
  }

  let scope = claims.map(p => p[0]).join(',')
  let searchParams = new DashURLSearchParams([
    ...claims,
    ['scope', scope]
  ])

  console.log(
    'Generate Dash URI claims',
    claims, scope, searchParams,
    searchParams.size,
    searchParams.entries(),
  )

  let res = `${protocol}${joiner}${addr}`

  if (searchParams.size > 0) {
    res += `?${searchParams.toString()}`
  }

  return res
}

export function generatePaymentRequestURI(
  state,
  protocol = 'dash',
  joiner = ':'
) {
  let addr = state.wallet?.address || ''
  let claims = []
  // console.log(
  //   'generatePaymentRequestURI',
  //   state,
  //   protocol
  // )

  if (state.userInfo) {
    let filteredInfo = Array.from(
      Object.entries(state.userInfo)
    ).filter(p => {
      let [key, val] = p
      if (
        ![
          'updated_at',
          'email_verified',
          'phone_number_verified',
        ].includes(key) &&
        !isEmpty(val)
      ) {
        return true
      }
    })

    claims = [
      ...filteredInfo,
    ]
  }

  if (state.amount > 0) {
    claims.push(
      ["amount", state.amount],
    )
  }

  if (state.label) {
    claims.push(
      ["label", state.label],
    )
  }

  if (state.message) {
    claims.push(
      ["message", state.message],
    )
  }

  let searchParams = new DashURLSearchParams([
    ...claims,
  ])

  let res = `${protocol}${joiner}${addr}`

  if (searchParams.size > 0) {
    res += `?${searchParams.toString()}`
  }

  return res
}

export async function getRandomWords(len = 32) {
  return await DashPhrase.generate(len)
}

export async function verifyPhrase(phrase) {
  return await DashPhrase.verify(phrase).catch(_ => false)
}

export async function getUniqueAlias(aliases, preferredAlias) {
  let uniqueAlias = preferredAlias

  if (aliases.includes(preferredAlias)) {
    let aliasArr = uniqueAlias.split('_')
    let randomWords = (await getRandomWords()).split(' ')

    if (aliasArr.length > 1) {
      let lastWord = aliasArr.pop()
      let index = DashPhrase.base2048.indexOf(lastWord);

      if (index < 0) {
        aliasArr.push(lastWord)
      } else {
        aliasArr.push(randomWords[0])
      }
    } else {
      aliasArr.push(randomWords[0])
    }

    uniqueAlias = aliasArr.join('_')

    return await getUniqueAlias(aliases, uniqueAlias)
  }

  return uniqueAlias
}

export function getPartialHDPath(wallet) {
  return [
    wallet.accountIndex,
    wallet.usageIndex,
    wallet.addressIndex,
  ].join('/')
}

export function getAddressIndexFromUsage(wallet, account, usageIdx) {
  let usageIndex = usageIdx ?? wallet?.usageIndex ?? 0
  let addressIndex = account.usage?.[usageIndex] ?? account.addressIndex ?? 0
  let usage = account.usage ?? [
    account.addressIndex ?? 0,
    0
  ]

  // console.log(
  //   'getAddressIndexFromUsage',
  //   usageIndex,
  //   addressIndex,
  //   account,
  //   usage,
  // )

  return {
    ...account,
    usage,
    usageIndex,
    addressIndex,
  }
}

export async function generateAddressIterator(
  xkey,
  xkeyId,
  addressIndex,
) {
  let key = await xkey.deriveAddress(addressIndex);
  let address = await DashHd.toAddr(key.publicKey);

  return {
    address,
    addressIndex,
    usageIndex: xkey.index,
    xkeyId,
  }
}

export async function generateAndStoreAddressIterator(
  xkey,
  xkeyId,
  walletId,
  accountIndex,
  addressIndex,
  usageIndex = DashHd.RECEIVE,
) {
  let { address } = await generateAddressIterator(
    xkey,
    xkeyId,
    addressIndex,
  )

  // console.log(
  //   'generateAddressIterator',
  //   {xkey, xkeyId, key, address, accountIndex, addressIndex},
  // )

  store.addresses.getItem(address)
    .then(a => {
      let $addr = a || {}
      // console.log(
      //   'generateAddressIterator store.addresses.getItem',
      //   {address, $addr},
      // )

      store.addresses.setItem(
        address,
        {
          ...$addr,
          updatedAt: Date.now(),
          walletId,
          xkeyId,
          accountIndex,
          addressIndex,
          usageIndex,
        },
      )
    })

  return {
    address,
    addressIndex,
    accountIndex,
    usageIndex: xkey.index,
    xkeyId,
  }
}

export async function batchXkeyAddressGenerate(
  wallet,
  addressIndex = 0,
  batchSize = 20,
) {
  let batchLimit = addressIndex + batchSize
  let addresses = []

  for (let addrIdx = addressIndex; addrIdx < batchLimit; addrIdx++) {
    addresses.push(
      await generateAddressIterator(
        wallet.xkey,
        wallet.xkeyId,
        addrIdx,
      )
    )
  }

  return {
    addresses,
    finalAddressIndex: batchLimit,
  }
}

export async function batchAddressGenerate(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  usageIndex = DashHd.RECEIVE,
  batchSize = 20,
) {
  // let hdpath = `m/44'/5'/${accountIndex}'/${usageIndex}/${addressIndex}`,
  let batchLimit = addressIndex + batchSize
  let addresses = []

  let account = await wallet.derivedWallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(usageIndex);
  let xkeyId = await DashHd.toId(xkey);

  if (usageIndex !== DashHd.RECEIVE) {
    let xkeyReceive = await account.deriveXKey(DashHd.RECEIVE);
    xkeyId = await DashHd.toId(xkeyReceive);
  }

  for (let addrIdx = addressIndex; addrIdx < batchLimit; addrIdx++) {
    addresses.push(
      await generateAndStoreAddressIterator(
        xkey,
        xkeyId,
        wallet.id,
        accountIndex,
        addrIdx,
        usageIndex,
      )
    )
  }

  return {
    addresses,
    finalAddressIndex: batchLimit,
  }
}

export async function batchAddressUsageGenerate(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  batchSize = 20,
) {
  // let hdpath = `m/44'/5'/${accountIndex}'/${usageIndex}/${addressIndex}`,
  let batchLimit = addressIndex + batchSize
  let addresses = []

  let account = await wallet.derivedWallet.deriveAccount(accountIndex);
  let xkeyReceive = await account.deriveXKey(DashHd.RECEIVE);
  let xkeyChange = await account.deriveXKey(DashHd.CHANGE);
  let xkeyId = await DashHd.toId(xkeyReceive);

  console.log(
    'batchAddressUsageGenerate',
    {batchLimit, account, xkeyReceive, xkeyChange},
  )

  for (let addrIdx = addressIndex; addrIdx < batchLimit; addrIdx++) {
    addresses.push(
      await generateAndStoreAddressIterator(
        xkeyReceive,
        xkeyId,
        wallet.id,
        accountIndex,
        addrIdx,
        DashHd.RECEIVE,
      )
    )
    addresses.push(
      await generateAndStoreAddressIterator(
        xkeyChange,
        xkeyId,
        wallet.id,
        accountIndex,
        addrIdx,
        DashHd.CHANGE,
      )
    )
  }

  return {
    addresses,
    finalAddressIndex: batchLimit,
  }
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

export async function batchGenAccts(
  phrase,
  accountIndex = 0,
  batchSize = 5,
) {
  let $accts = await getStoredItems(store.accounts)
  // let $acctsArr = Object.values($accts)
  let accts = {}
  let batch = batchSize + accountIndex

  console.log(
    'BATCH GENERATED ACCOUNTS START',
    {
      $accts,
      // $acctsArr,
      accountIndex,
      batch,
    }
  )

  for (let i = accountIndex; i < batch; i++) {
    let acctWallet = await deriveWalletData(
      phrase,
      i,
    )

    if (!$accts[acctWallet.xkeyId]) {
      let newAccount = await store.accounts.setItem(
        acctWallet.xkeyId,
        {
          createdAt: (new Date()).toISOString(),
          updatedAt: (new Date()).toISOString(),
          accountIndex: i,
          usage: [0,0],
          walletId: acctWallet.id,
          xkeyId: acctWallet.xkeyId,
          addressKeyId: acctWallet.addressKeyId,
          address: acctWallet.address,
        }
      )

      accts[`acct__${i}`] = [ acctWallet, newAccount ]
    }

    // accts[`acct__${i}`] = batchGenAcctAddrs(
    //   acctWallet,
    //   newAccount,
    // )
  }

  // let allBatches = Promise.allSettled(Object.values(accts))

  return accts
}

export async function batchGenAcctAddrs(
  wallet,
  account,
  usageIndex = -1,
  batchSize = 20,
) {
  // console.log('batchGenAcctAddrs account', account, usageIndex)

  let filterQuery = {
    accountIndex: account.accountIndex,
  }

  if (usageIndex >= 0) {
    filterQuery.usageIndex = usageIndex
  }

  let acctAddrsLen = await getFilteredStoreLength(
    store.addresses,
    filterQuery,
  )

  // console.log('getFilteredStoreLength res', acctAddrsLen)

  let addrUsageIdx = account.usage?.[usageIndex] || 0
  let addrIdx = addrUsageIdx
  let batSize = batchSize

  if (acctAddrsLen === 0) {
    addrIdx = 0
    batSize = addrUsageIdx + batchSize
  }

  if (acctAddrsLen <= addrUsageIdx + (batchSize / 2)) {
    if (usageIndex >= 0) {
      return await batchAddressGenerate(
        wallet,
        account.accountIndex,
        account.usage[usageIndex],
        usageIndex,
        batSize,
      )
    } else {
      return await batchAddressUsageGenerate(
        wallet,
        account.accountIndex,
        addrIdx,
        batSize,
      )
    }
  }

  return null
}

export async function batchGenAcctsAddrs(
  wallet,
  usageIndex = -1,
  batchSize = 20,
) {
  let $accts = await getStoredItems(store.accounts)
  let $acctsArr = Object.values($accts)
  let accts = {}

  if ($acctsArr.length > 0) {
    for (let $a of $acctsArr) {
      accts[`bat__${$a.accountIndex}`] = await batchGenAcctAddrs(
        wallet,
        $a,
        usageIndex,
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

export async function getAccountWallet(wallet, phrase) {
  let acctFromStore = await store.accounts.getItem(
    wallet.xkeyId,
  ) || {}
  let acctFromStoreWallet = getAddressIndexFromUsage(
    wallet,
    acctFromStore,
  )

  if (acctFromStoreWallet?.addressIndex > 0) {
    return {
      wallet: await deriveWalletData(
        phrase,
        acctFromStoreWallet.accountIndex,
        acctFromStoreWallet.addressIndex,
        acctFromStoreWallet?.usageIndex ?? USAGE.RECEIVE,
      ),
      account: acctFromStore,
    }
  }

  return {
    wallet,
    account: acctFromStore,
  }
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

export function sortIncomingAndOutgoingTxs({
  conAddr, tx, addr, dir, sentAmount = null, receivedAmount = null,
  byAlias = {}, byAddress = {}, byTx = {},
}) {
  let alias = byTx?.[tx.txid]?.alias || conAddr.alias
  byAlias[conAddr.alias] = {
    ...(byAlias[conAddr.alias] || []),
    [tx.txid]: {
      addr,
      dir,
      sentAmount,
      receivedAmount,
      ...tx,
      ...conAddr,
      alias,
    }
  }
  byAddress[addr] = [
    ...(byAddress[addr] || []),
    {
      receivedAmount,
      sentAmount,
      dir,
      ...tx,
      ...conAddr,
      alias,
    }
  ]
  byTx[tx.txid] = {
    receivedAmount,
    sentAmount,
    dir,
    ...tx,
    ...conAddr,
    alias,
  }

  // console.log(
  //   'sortIncomingAndOutgoingTxs',
  //   conAddr.alias, conAddr.xkeyId, tx,
  // )

  return {
    byAlias,
    byAddress,
    byTx,
  }
}

export async function getContactsByXkeyId(
  appState,
) {
  let contactsXkeys = {}

  for await (let c of appState.contacts) {
    let og = Object.values(c.outgoing || {})?.[0]
    let ic = Object.values(c.incoming || {})?.[0]

    if (og) {
      contactsXkeys[og.xkeyId] = {
        ...c,
        dir: 'outgoing',
      }
    }
    if (ic) {
      contactsXkeys[ic.xkeyId] = {
        ...c,
        dir: 'incoming',
      }
    }
  }

  return contactsXkeys
}

export async function getContactsFromAddrs(
  appState,
) {
  let accts = await loadStoreObject(store.accounts)
  let addrs = await loadStoreObject(store.addresses)
  let contactAddrs = await getContactsByXkeyId(appState)
  let contacts = {}

  for await (let [ck,cv] of Object.entries(addrs)) {
    let contact = contactAddrs[cv.xkeyId]
    let acct = accts[cv.xkeyId]
    if (contact) {
      contacts[ck] = contact
    } else if (acct) {
      contacts[ck] = {
        ...acct,
        alias: null,
      }
    }
  }

  return contacts
}

export async function deriveContactAddrs(
  appState, dir = 'outgoing',
) {
  let addrs = {}

  for await (let c of appState.contacts) {
    let og = Object.values(c[dir] || {})?.[0]
    let xkey = og?.xpub || og?.xprv

    if (xkey) {
      let contactWallet = await deriveWalletData(
        xkey,
      )
      let contactAddrs = await batchXkeyAddressGenerate(
        contactWallet,
        contactWallet.addressIndex,
      )

      contactAddrs.addresses.forEach(g => {
        addrs[g.address] = {
          alias: c.alias,
          xkeyId: contactWallet.xkeyId,
          dir,
        }
      })
    }
  }

  // console.log('deriveContactAddrs', {
  //   asc: appState.contacts,
  //   addrs,
  // })

  return addrs
}

export function getTransactionsByContactAlias(appState) {
  return async res => {
    if (!res) {
      return []
    }

    appState.contacts = res

    return res
  }
}

export async function getUserInfo() {
  let ks = getStoredWallet()?.keystore

  if (
    appState.encryptionPassword &&
    appState.selectedAlias &&
    ks
  ) {
    appTools.storedData = storedData(
      appState.encryptionPassword,
      ks,
    )

    await appTools.storedData?.decryptItem(
      store.aliases,
      appState.selectedAlias,
    )
    .then(async $alias => {
      let { $wallets, ...$userInfo } = await loadWalletsForAlias(
        $alias
      )
      // wallets = $wallets
      console.log(
        'getUserInfo $alias',
        {
          $alias,
          $wallets,
          $userInfo,
        }
      )

      Object.entries(($userInfo?.info || {}))
        .forEach(
          ([k,v]) => userInfo[k] = v
        )
    })
    .catch(err => {
      showErrorDialog({
        title: 'Unable to decrypt seed phrase',
        msg: err,
        showActBtn: false,
        confirmAction: appDialogs.confirmAction,
      })
    })
  }
}
