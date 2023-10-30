import {
  DashHd,
  DashPhrase,
} from '../imports.js'

import {
  DUFFS,
  DASH_URI_REGEX,
} from './constants.js'

// export async function walletSchema(
//   phrase = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
//   accountIndex = 0
// ) {
//   let wallets = {
//     'jojobyte': {
//       phrase,
//       accountIndex,
//     }
//   }
//   let contacts = {
//     'bob': {
//       name: 'Bob Jones',
//       gravatarEmail: 'bob@jones.com',
//       // `m/44'/5'/${accountIndex}'/0/${addressIndex}`;
//       index: 1,
//       txIndex: 0,
//       xpubs: {
//         'laptop': 'xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz'
//       },
//       xpubsArr: [
//         {
//           device: 'laptop',
//           key: 'xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz',
//         }
//       ],
//     }
//   }
//   // contactsArr: [
//   //   {
//   //     alias: 'bob',
//   //     // `m/44'/5'/${accountIndex}'/0/${addressIndex}`;
//   //     index: 1,
//   //     txIndex: 0,
//   //     xpub: ''
//   //   }
//   // ],

//   return wallets
// }

/**
 *
 * @param {String} [phraseOrXkey]
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [use]
 *
 * @returns {Promise<SeedWallet>}
 */
export async function deriveWalletData(
  phraseOrXkey,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE
) {
  let recoveryPhrase, seed, derivedWallet, wpub, id, account
  let xkey, xprv, xpub, xkeyId
  let addressKey, addressKeyId, address
  let targetBitEntropy = 128;
  let secretSalt = ''; // "TREZOR";
  let recoveryPhraseArr = phraseOrXkey?.split(' ')

  if (recoveryPhraseArr?.length >= 12) {
    recoveryPhrase = phraseOrXkey;
  }

  if (!phraseOrXkey) {
    recoveryPhrase = await DashPhrase.generate(targetBitEntropy);
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
    xkey = await account.deriveXKey(use);
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
  // return {
  //   account,
  //   xkey,
  //   key,
  //   address
  // }
}

export async function batchAddressGenerate(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
  batchSize = 20
) {
  let batchLimit = addressIndex + batchSize
  let addresses = []

  let account = await wallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);

  for (;addressIndex < batchLimit; addressIndex++) {
    let key = await xkey.deriveAddress(addressIndex);
    let address = await DashHd.toAddr(key.publicKey);
    addresses.push({
      address,
      addressIndex,
      accountIndex,
    })
  }

  return {
    addresses,
    finalAddressIndex: addressIndex,
  }
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
  const aliasA = a.info?.preferred_username?.toUpperCase() || 'zzz';
  const aliasB = b.info?.preferred_username?.toUpperCase() || 'zzz';

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

export function parseDashURI(uri) {
  let result = {}
  let parsedUri = [
    ...uri.matchAll(DASH_URI_REGEX)
  ]?.[0]?.groups || {}
  let searchParams = new URLSearchParams(parsedUri?.params || '')

  console.log(
    'parseDashURI',
    parsedUri,
    searchParams
  )

  if (parsedUri?.address) {
    result.address = parsedUri?.address
  }

  // let xkeyOrAddr = xprv || xpub || addr

  if (searchParams?.size > 0) {
    let {
      xprv, xpub, name, preferred_username, sub, scope, amount,
    } = Object.fromEntries(
      searchParams?.entries()
    )

    if (xprv) {
      result.xprv = xprv
    }
    if (xpub) {
      result.xpub = xpub
    }

    if (name) {
      result.name = name
    }
    if (preferred_username) {
      result.preferred_username = preferred_username
    }
    if (amount) {
      result.amount = amount
    }

    if (sub) {
      result.sub = sub
    }
    if (scope) {
      result.scope = scope
    }
  }

  return result
}

export function parseAddressField(uri) {
  let result = {}

  if (uri.includes(':')) {
    let [protocol] = uri.split(':')
    if (protocol.includes('dash')) {
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
      ...claims,
      ...filteredInfo,
    ]
  }

  let scope = claims.map(p => p[0]).join(',')
  let searchParams = new URLSearchParams([
    ...claims,
    ['scope', scope]
  ])

  console.log(
    'Generate Dash URI claims',
    claims, scope, searchParams,
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

  // dash:XmPNH5bMkwwc1kjVGwxWxTs86C3ZsgjdSX?amount=0.0001
  // dash:XktddCruaWEMDqqiciagWPXCfqc1jfY6zf?amount=0.0001
  // dash:XtXnZkocKvrqGDxW7mhBvoR6yCAD99mnau?amount=0.0001

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

  let searchParams = new URLSearchParams([
    ...claims,
  ])

  let res = `${protocol}${joiner}${addr}`

  if (searchParams.size > 0) {
    res += `?${searchParams.toString()}`
  }

  return res
}

// export function generatePaymentRequestURI(state) {
//   let shareUri = `dash:${state.wallet?.address || ''}?`
//   let shareParams = []

//   if (state.amount > 0) {
//     shareParams.push(`amount=${state.amount}`)
//   }

//   if (state.label) {
//     shareParams.push(`label=${state.label}`)
//   }

//   if (state.message) {
//     shareParams.push(`message=${state.message}`)
//   }

//   if (shareParams.length > 0) {
//     shareUri += `?${shareParams.join('&')}`
//   }

//   return shareUri
// }

export async function loadStore(store, callback) {
  // let storeLen = await store.length()
  let result = []

  return await store.iterate((v, k, i) => {
    result.push(v)

    // if (i === storeLen) {
    //   return result
    // }
  })
  .then(() => callback(result))
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
  .then(() => callback(result))
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
