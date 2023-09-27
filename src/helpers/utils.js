import {
  DashHd,
  DashPhrase,
} from '../imports.js'

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
  let recoveryPhrase, seed, wallet, wpub, id, account
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
    wallet = await DashHd.fromSeed(seed);
    wpub = await DashHd.toXPub(wallet);
    id = await DashHd.toId(wallet);
    account = await wallet.deriveAccount(accountIndex);
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
    addressKeyId,
    address,
    xkeyId,
    xkey,
    xprv,
    xpub,
    seed,
    wpub,
    wallet,
    account,
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

export const DUFFS = 100000000;

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

export function copyToClipboard(event) {
  event.preventDefault()
  event.target.previousElementSibling.select();
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
  const data = [new ClipboardItem({ [type]: blob })];

  navigator.clipboard.write(data).then(
    cv => {
      console.log('setClipboard', cv)
    },
    ce => {
      console.error('[fail] setClipboard', ce)
    }
  );
}

export function envoy(obj, ...listeners) {
  return new Proxy(obj, {
    set(obj, prop, value) {
      listeners.forEach(
        fn => fn(
          {...obj, [prop]: value},
          obj
        )
      );
      obj[prop] = value;
      return true;
    }
  })
}