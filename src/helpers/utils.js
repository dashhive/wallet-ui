import {
  DashHd,
  DashPhrase,
} from '../imports.js'

import {
  DUFFS,
  DASH_URI_REGEX,
  OIDC_CLAIMS,
  SUPPORTED_CLAIMS,
  TIMEAGO_LOCALE_EN,
  MOMENT, MOMENTS, NEVER,
  SECONDS, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR,
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

export function formDataEntries(event) {
  let fd = new FormData(
    event.target,
    event.submitter
  )

  return Object.fromEntries(fd.entries())
}

export function copyToClipboard(target) {
  target.select();
  document.execCommand("copy");
}

export function setClipboard(event) {
  event.preventDefault()
  let el = event.target?.previousElementSibling
  let val = el.textContent?.trim()
  if (el.nodeName === 'INPUT') {
    val = el.value?.trim()
  }
  const type = "text/plain";
  const blob = new Blob([val], { type });

  if (
    "clipboard" in navigator &&
    typeof navigator.clipboard.write === "function"
  ) {
    const data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data).then(
      cv => {
        console.log('setClipboard', cv)
      },
      ce => {
        console.error('[fail] setClipboard', ce)
      }
    );
  } else {
    copyToClipboard(el)
  }
}

export function openBlobSVG(target) {
	const svgStr = new XMLSerializer().serializeToString(target);
	const svgBlob = new Blob([svgStr], { type: "image/svg+xml" });
	const url = URL.createObjectURL(svgBlob);
	const win = open(url);
	win.onload = (evt) => URL.revokeObjectURL(url);
}

/**
 * Creates a `Proxy` wrapped object with optional listeners
 * that react to changes
 *
 * @example
 *    let fooHistory = []
 *
 *    let kung = envoy(
 *      { foo: 'bar' },
 *      function firstListener(state, oldState) {
 *        if (state.foo !== oldState.foo) {
 *          localStorage.foo = state.foo
 *        },
 *      },
 *      async function secondListener(state, oldState) {
 *        if (state.foo !== oldState.foo) {
 *          fooHistory.push(oldState.foo)
 *        }
 *      }
 *    )
 *    kung.foo = 'baz'
 *    console.log(localStorage.foo) // 'baz'
 *    kung.foo = 'boo'
 *    console.log(fooHistory) // ['bar','baz']
 *
 * @param {Object} obj
 * @param {...(
 *  state: any, oldState: any, prop: string | symbol
 * ) => void | Promise<void>?} [initListeners]
 *
 * @returns {obj}
 */
export function envoy(obj, ...initListeners) {
  let _listeners = [...initListeners]
  return new Proxy(obj, {
    get(obj, prop, receiver) {
      if (prop === '_listeners') {
        return _listeners
      }
      return Reflect.get(obj, prop, receiver)
    },
    set(obj, prop, value) {
      if (
        prop === '_listeners' &&
        Array.isArray(value)
      ) {
        _listeners = value
      }

      _listeners.forEach(
        fn => fn(
          {...obj, [prop]: value},
          obj,
          prop
        )
      )

      obj[prop] = value

      return true
    }
  })
}

/**
 * Creates a reactive signal
 *
 * Inspired By
 * {@link https://gist.github.com/developit/a0430c500f5559b715c2dddf9c40948d Valoo} &
 * {@link https://dev.to/ratiu5/implementing-signals-from-scratch-3e4c Signals from Scratch}
 *
 * @example
 *    let count = createSignal(0)
 *    console.log(count.value) // 0
 *    count.value = 2
 *    console.log(count.value) // 2
 *
 *    let off = count.on((value) => {
 *      document.querySelector("body").innerHTML = value;
 *    });
 *
 *    off(); // unsubscribe
 *
 * @param {Object} initialValue inital value
*/
export function createSignal(initialValue) {
  let _value = initialValue;
  let _last = _value;
  const subs = [];

  function pub() {
    for (let s of subs) {
      s && s(_value, _last);
    }
  }

  return {
    get value() { return _value; },
    set value(v) {
      _last = _value
      _value = v;
      pub();
    },
    on: s => {
      const i = subs.push(s)-1;
      return () => { subs[i] = 0; };
    }
  }
}

export async function restate(
  state = {},
  renderState = {},
) {
  let renderKeys = Object.keys(renderState)

  for await (let prop of renderKeys) {
    state[prop] = renderState[prop]
  }

  return state
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

export function DashURLSearchParams(params) {
  let searchParams
  let qry = {}

  Object.defineProperty(this, "entries", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: () => Object.entries(qry),
  });
  Object.defineProperty(this, "toString", {
    enumerable: false,
    configurable: false,
    writable: false,
    value: () => this.entries().map(p => p.join('=')).join('&'),
  });
  Object.defineProperty(this, "size", {
    get() { return this.entries().length },
    enumerable: false,
    configurable: false,
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

export async function getStoreData(
  store,
  callback,
  iterableCallback = res => async (v, k, i) => res.push(v)
) {
  let result = []

  return await store.keys().then(async function(keys) {
    for (let k of keys) {
      let v = await store.getItem(k)
      await iterableCallback(result)(v, k)
    }

    callback?.(result)

    return result
  }).catch(function(err) {
    console.error('getStoreData', err)
    return null
  });
}

export async function loadStore(
  store,
  callback,
  iterableCallback = res => v => res.push(v)
) {
  let result = []

  return await store.iterate(iterableCallback(result))
  .then(() => callback?.(result))
  .catch(err => {
    console.error('loadStore', err)
    return null
  });
}

export async function loadStoreObject(store, callback) {
  // let storeLen = await store.length()
  let result = {}

  return await store.iterate((v, k, i) => {
    result[k] = v

    // if (i === storeLen) {
    //   return result
    // }
  })
  .then(() => callback?.(result))
  .then(() => result)
  .catch(err => {
    console.error('loadStoreObject', err)
    return null
  });
}

/**
 * promise debounce changes
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const change = debounce((a) => console.log('Saving data', a));
 *    change('b');change('c');change('d');
 *    'Saving data d'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {Promise<any>}
*/
export async function debouncePromise(callback, delay = 300) {
  let timer

  return await new Promise(resolve => async (...args) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      resolve(callback.apply(this, args))
    }, delay)
  })

  // return async (...args) => {
  //   clearTimeout(timer)

  //   timer = resolve => setTimeout(() => {
  //     resolve(callback.apply(this, args))
  //   }, delay)

  //   return await new Promise(timer)
  // }
}

/**
 * debounce changes
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const change = debounce((a) => console.log('Saving data', a));
 *    change('b');change('c');change('d');
 *    'Saving data d'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {(...args) => void}
*/
export function debounce(callback, delay = 300) {
  let timer

  return (...args) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      return callback.apply(this, args)
    }, delay)

    return timer
  }
}

/**
 * debounce that immediately triggers and black holes any extra
 * executions within the time delay
 *
 * https://www.freecodecamp.org/news/javascript-debounce-example/
 *
 * @example
 *    const dry = nobounce((a) => console.log('Saving data', a));
 *    dry('b');dry('c');dry('d');
 *    'Saving data b'
 *
 * @param {(...args) => void} callback
 * @param {number} [delay]
*
* @returns {(...args) => void}
*/
export function nobounce(callback, delay = 300) {
  let timer

  return (...args) => {
    if (!timer) {
      callback.apply(this, args)
    }

    clearTimeout(timer)

    timer = setTimeout(() => {
      timer = undefined
    }, delay)
  }
}

export function timeago(ms, locale = TIMEAGO_LOCALE_EN) {
  var ago = Math.floor(ms / 1000);
  var part = 0;

  if (ago < MOMENTS) { return locale.moment; }
  if (ago < SECONDS) { return locale.moments; }
  if (ago < MINUTE) { return locale.seconds.replace(/%\w?/, `${ago}`); }

  if (ago < (2 * MINUTE)) { return locale.minute; }
  if (ago < HOUR) {
    while (ago >= MINUTE) { ago -= MINUTE; part += 1; }
    return locale.minutes.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * HOUR)) { return locale.hour; }
  if (ago < DAY) {
    while (ago >= HOUR) { ago -= HOUR; part += 1; }
    return locale.hours.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * DAY)) { return locale.day; }
  if (ago < WEEK) {
    while (ago >= DAY) { ago -= DAY; part += 1; }
    return locale.days.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * WEEK)) { return locale.week; }
  if (ago < MONTH) {
    while (ago >= WEEK) { ago -= WEEK; part += 1; }
    return locale.weeks.replace(/%\w?/, `${part}`);
  }

  if (ago < (2 * MONTH)) { return locale.month; }
  if (ago < YEAR) { // 45 years, approximately the epoch
    while (ago >= MONTH) { ago -= MONTH; part += 1; }
    return locale.months.replace(/%\w?/, `${part}`);
  }

  if (ago < NEVER) {
    return locale.years;
  }

  return locale.never;
}

export async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256", new TextEncoder().encode(str)
  );
  return Array.prototype.map.call(
    new Uint8Array(buf),
    x => (('00' + x.toString(16)).slice(-2))
  ).join('');
}

// https://stackoverflow.com/a/66494926
export function getBackgroundColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 100%, 67%)`;
}

export async function getAvatarUrl(
  email,
  size = 48,
  rating = 'pg',
  srv = 'gravatar',
) {
  let emailSHA = await sha256(email || '')

  if (srv === 'gravatar') {
    return `https://gravatar.com/avatar/${
      emailSHA
    }?s=${size}&r=${rating}&d=retro`
  }
  if (srv === 'libravatar') {
    return `https://seccdn.libravatar.org/avatar/${
      emailSHA
    }?s=${size}&r=${rating}&d=retro`
  }

  return ''
}

export async function getAvatar(c) {
  let initials = c?.info?.name?.
    split(' ').map(n => n[0]).slice(0,3).join('') || ''
  let nameOrAlias = c?.info?.name || c?.alias || c?.info?.preferred_username

  if (!initials) {
    initials = (c?.alias || c?.info?.preferred_username)?.[0] || ''
  }

  let avStr = `<div class="avatar" style="`

  if (nameOrAlias) {
    avStr += `background-color:${
      getBackgroundColor(nameOrAlias)
    };color:#000;`
  }

  if (c?.info?.picture) {
    avStr += `color:transparent;background-image:url(${c.info.picture});`
  }

  // Gravatar
  if (c?.info?.email) {
    avStr += `color:transparent;background-image:url(${
      await getAvatarUrl(c.info.email)
    });`
  }

  return `${avStr}">${initials}</div>`
}

export function fileIsSubType(file, type) {
  const fileType = file?.type?.split('/')?.[1]

  if (!fileType) {
    return false
  }

  return fileType === type
}

// fileInTypes({type:'application/json'}, ['image/png'])
export function fileInMIMETypes(file, types = []) {
  const fileType = file?.type

  if (!fileType) {
    return false
  }

  return types.includes(fileType)
}

export function fileTypeInTypes(file, types = []) {
  const fileType = file?.type?.split('/')?.[0]

  if (!fileType) {
    return false
  }

  return types.includes(fileType)
}

export function fileTypeInSubtype(file, subtypes = []) {
  const fileSubType = file?.type?.split('/')?.[1]

  if (!fileSubType) {
    return false
  }

  return subtypes.includes(fileSubType)
}

export function readFile(file, options) {
  let opts = {
    expectedFileType: 'json',
    denyFileTypes: ['audio','video','image','font','model'],
    denyFileSubTypes: ['msword','xml'],
    callback: () => {},
    errorCallback: () => {},
    ...options,
  }
  let reader = new FileReader();
  let result

  reader.addEventListener('load', () => {
    if (
      fileTypeInTypes(
        file,
        opts.denyFileTypes,
      ) || fileTypeInSubtype(
        file,
        opts.denyFileSubTypes,
      )
    ) {
      return opts.errorCallback?.({
        err: `Wrong file type: ${file.type}. Expected: ${opts.expectedFileType}.`,
        file,
      })
    }

    try {
      // @ts-ignore
      result = JSON.parse(reader?.result || '{}');

      // console.log('parse loaded json', result);

      opts.callback?.(result, file)

      // state[key] = result
    } catch(err) {
      opts.errorCallback?.({
        err,
        file,
      })

      throw new Error(`failed to parse JSON data from ${file.name}`)
    }
  });

  reader.readAsText(file);
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
