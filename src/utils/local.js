import {
  DashHd,
  DashPhrase,
} from '../imports.js'

import {
  DUFFS,
  DASH_URI_REGEX,
  SUPPORTED_CLAIMS,
} from './constants.js'

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

  return {
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
    recoveryPhrase,
  }
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

// export async function batchAddressGenerate(
//   wallet,
//   accountIndex = 0,
//   addressIndex = 0,
//   use = DashHd.RECEIVE,
//   batchSize = 20
// ) {
//   let batchLimit = addressIndex + batchSize
//   let addresses = []

//   let account = await wallet.deriveAccount(accountIndex);
//   let xkey = await account.deriveXKey(use);

//   for (;addressIndex < batchLimit; addressIndex++) {
//     let key = await xkey.deriveAddress(addressIndex);
//     let address = await DashHd.toAddr(key.publicKey);
//     addresses.push({
//       address,
//       addressIndex,
//       accountIndex,
//     })
//   }

//   return {
//     addresses,
//     finalAddressIndex: addressIndex,
//   }
// }

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

// https://stackoverflow.com/a/27946310
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
  // let searchParams = new URLSearchParams([
  //   ...claims,
  //   ['scope', scope]
  // ])
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

  // let searchParams = new URLSearchParams([
  //   ...claims,
  // ])
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

export function isUniqueAlias(aliases, preferredAlias) {
  return !aliases[preferredAlias]
}

export async function getUniqueAlias(aliases, preferredAlias) {
  let uniqueAlias = preferredAlias
  let notUnique = !isUniqueAlias(aliases, uniqueAlias)

  if (notUnique) {
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
