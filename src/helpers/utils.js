import {
  // Base58Check,
  DashHd,
  DashPhrase,
  DashSight,
  // DashKeys,
} from '../imports.js'
import { DatabaseSetup } from './db.js'

// @ts-ignore
let dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

const db = await DatabaseSetup()

export async function walletSchema(
  phrase = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
  accountIndex = 0
) {
  let wallets = {
    'jojobyte': {
      phrase,
      accountIndex,
    }
  }
  let contacts = {
    'bob': {
      name: 'Bob Jones',
      gravatarEmail: 'bob@jones.com',
      // `m/44'/5'/${accountIndex}'/0/${addressIndex}`;
      index: 1,
      txIndex: 0,
      xpubs: {
        'laptop': 'xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz'
      },
      xpubsArr: [
        {
          device: 'laptop',
          key: 'xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz',
        }
      ],
    }
  }
  // contactsArr: [
  //   {
  //     alias: 'bob',
  //     // `m/44'/5'/${accountIndex}'/0/${addressIndex}`;
  //     index: 1,
  //     txIndex: 0,
  //     xpub: ''
  //   }
  // ],

  return wallets
}

/**
 *
 * @example
 *    let addr = getAddr(wallet, 0, 0, 0)
 *
 * @param {HDWallet} wallet
 * @param {Number} [accountIndex]
 * @param {Number} [addressIndex]
 * @param {Number} [use]
 *
 * @returns
 */
export async function getAddr(
  wallet,
  accountIndex = 0,
  addressIndex = 0,
  use = DashHd.RECEIVE,
) {
  let account = await wallet.deriveAccount(accountIndex);
  let xkey = await account.deriveXKey(use);
  let xprv = await DashHd.toXPrv(xkey);
  let xpub = await DashHd.toXPub(xkey);
  let xpubKey = await DashHd.fromXKey(xpub);
  let xpubId = await DashHd.toId(xpubKey);
  let key = await xkey.deriveAddress(addressIndex);
  let address = await DashHd.toAddr(key.publicKey);
  // let keyId = await DashHd.toId(xkey);

  return {
    // keyId,
    // account,
    // xkey,
    xprv,
    xpub,
    xpubKey,
    xpubId,
    // key,
    address
  }
}

export async function initWallet(
  wallet,
  accountIndex = 0,
  addrIndex = 0,
  info = {},
) {
  let initInfo = {
    name: '',
    email: '', // gravatar?
    picture: '', // avatar
    sub: '',
    xpub: '',
    preferred_username: '',
  }

  info = {
    ...initInfo,
    ...info,
  }

  let addr = await getAddr(
    wallet.wallet,
  )

  let { address, xpubId } = addr

  let storedReceiveAddr = await db.addresses.setItem(
    `receiveaddr__${address}`,
    {
      walletId: wallet.id,
      accountIndex,
      addrIndex
    }
  )

  console.log('storedReceiveAddr in db', storedReceiveAddr)

  let alias = info.preferred_username
  let contacts = '{}'

  return {
    contacts: '{}',
  }
}

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
  let recoveryPhraseArr = phraseOrXkey?.split(' ')
  let targetBitEntropy = 128;
  let secretSalt = ''; // "TREZOR";
  let recoveryPhrase
  let seed
  let wallet
  let wpub
  let id
  let account
  // let use = DashHd.RECEIVE;
  let xkey, xprv, xpub, xkeyId
  let addressKey, addressKeyId
  let address

  if (!phraseOrXkey) {
    recoveryPhrase = await DashPhrase.generate(targetBitEntropy);
  }

  if (recoveryPhraseArr?.length >= 12) {
    recoveryPhrase = phraseOrXkey;
  }

  if (
    ['xprv','xpub'].includes(
      phraseOrXkey.substring(0,4)
    )
    // phraseOrXkey.lastIndexOf('xprv', 0) === 0 ||
    // phraseOrXkey.lastIndexOf('xpub', 0) === 0
  ) {
    // recoveryPhrase = await DashPhrase.generate(targetBitEntropy);
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

export async function checkWalletFunds(addr) {
  console.info('check wallet addr', addr)
  let walletFunds = await dashsight.getInstantBalance(addr)

  console.info('check wallet funds', walletFunds)

  return walletFunds
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
  // let copyText = document.querySelector(sel);
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
    (cv) => {
      /* success */
      console.log('setClipboard', cv)
    },
    (ce) => {
      console.error('setClipboard fail', ce)
      /* failure */
    }
  );
}