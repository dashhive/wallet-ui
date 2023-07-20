import {
  // Base58Check,
  DashHd,
  DashPhrase,
  DashSight,
  // DashKeys,
} from '../imports.js'

// @ts-ignore
let dashsight = DashSight.create({
  baseUrl: 'https://insight.dash.org',
  // baseUrl: 'https://dashsight.dashincubator.dev',
});

export async function checkWalletFunds(addr) {
  console.info('check wallet addr', addr)
  let walletFunds = await dashsight.getInstantBalance(addr)

  console.info('check wallet funds', walletFunds)

  return walletFunds
}

export async function generateRecoveryPhrase(
  phrase,
  accountIndex = 0
) {
  let recoveryPhraseArr = phrase?.split(' ')
  let targetBitEntropy = 128;
  let secretSalt = ''; // "TREZOR";
  let recoveryPhrase
  let seed
  let wallet
  // let accountIndex = 0;
  let addressIndex = 0;
  let account
  let use = DashHd.RECEIVE;
  let xkey
  let xprv
  let xpub
  let key
  let privateKey
  let wif
  let address

  if (recoveryPhraseArr?.length >= 12) {
    recoveryPhrase = phrase
  }

  if (!phrase) {
    recoveryPhrase = await DashPhrase.generate(targetBitEntropy);
  }

  seed = await DashPhrase.toSeed(recoveryPhrase, secretSalt);
  wallet = await DashHd.fromSeed(seed);
  account = await wallet.deriveAccount(accountIndex);
  xkey = await account.deriveXKey(use);
  xprv = await DashHd.toXPrv(xkey);
  xpub = await DashHd.toXPub(xkey);
  key = await xkey.deriveAddress(addressIndex);
  address = await DashHd.toAddr(key.publicKey);

  // wif = await DashHd.toWif(key?.privateKey || privateKey);

  return {
    address,
    xkey,
    xprv,
    xpub,
    seed,
    wallet,
    account,
    recoveryPhrase,
    // wif,
  }
}

export function phraseToEl(phrase, el = 'span', cls = 'tag') {
  let words = phrase?.split(' ')
  return words?.map(
    w => `<${el} class="${cls}">${w}</${el}>`
  )?.join(' ')
}export const DUFFS = 100000000;

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