// @ts-nocheck

/**
 * Use IIFE modules in browser that do not provide
 *
 * `export default`
 *    or
 * `export let rabbit = 'hole'`
 *
 * and preserve JSDoc type hinting.
 *
 * See https://github.com/jojobyte/browser-import-rabbit-hole
 */

import '../node_modules/dashtx/dashtx.js';
import '../node_modules/dashkeys/dashkeys.js';
import '../node_modules/dashhd/dashhd.js';
import '../node_modules/dashphrase/dashphrase.js';
import '../node_modules/dashsight/dashsight.js';
import '../node_modules/dashsight/dashsocket.js';
import '../node_modules/@dashincubator/base58check/base58check.js';
import '../node_modules/@dashincubator/ripemd160/ripemd160.js';
import '../node_modules/@dashincubator/secp256k1/secp256k1.js';
import '../node_modules/crypticstorage/cryptic.js';
import '../node_modules/dashwallet/dashwallet.js';
import '../node_modules/localforage/dist/localforage.js';

import * as DashTxTypes from '../node_modules/dashtx/dashtx.js';
import * as DashKeysTypes from '../node_modules/dashkeys/dashkeys.js';
import * as DashHDTypes from '../node_modules/dashhd/dashhd.js';
import * as DashPhraseTypes from '../node_modules/dashphrase/dashphrase.js';
import * as DashSightTypes from '../node_modules/dashsight/dashsight.js';
import * as DashSocketTypes from '../node_modules/dashsight/dashsocket.js';
import * as Base58CheckTypes from '../node_modules/@dashincubator/base58check/base58check.js';
import * as RIPEMD160Types from '../node_modules/@dashincubator/ripemd160/ripemd160.js';
import * as Secp256k1Types from '../node_modules/@dashincubator/secp256k1/secp256k1.js';
import * as CrypticTypes from '../node_modules/crypticstorage/cryptic.js';
import * as CrypticStorageTypes from '../node_modules/crypticstorage/storage.js';
import * as DashWalletTypes from '../node_modules/dashwallet/dashwallet.js';
// import * as LocalForageTypes from '../node_modules/localforage/dist/localforage.js';

/** @type {DashTxTypes} */
export let DashTx = window?.DashTx || globalThis?.DashTx;
/** @type {DashKeysTypes} */
export let DashKeys = window?.DashKeys || globalThis?.DashKeys;
/** @type {DashHDTypes} */
export let DashHd = window?.DashHd || globalThis?.DashHd;
/** @type {DashPhraseTypes} */
export let DashPhrase = window?.DashPhrase || globalThis?.DashPhrase;
/** @type {DashSightTypes} */
export let DashSight = window?.DashSight || globalThis?.DashSight;
/** @type {DashSocketTypes} */
export let DashSocket = window?.DashSocket || globalThis?.DashSocket;
/** @type {Base58CheckTypes} */
export let Base58Check = window?.Base58Check || globalThis?.Base58Check;
/** @type {RIPEMD160Types} */
export let RIPEMD160 = window?.RIPEMD160 || globalThis?.RIPEMD160;
/** @type {Secp256k1Types} */
export let Secp256k1 = window?.nobleSecp256k1 || globalThis?.nobleSecp256k1;
/** @type {CrypticTypes} */
export let Cryptic =
  window?.Cryptic || globalThis?.Cryptic;
/** @type {CrypticStorageTypes} */
export let CrypticStorage =
  window?.CrypticStorage || globalThis?.CrypticStorage;
/** @type {DashWalletTypes} */
export let DashWallet = window?.Wallet || globalThis?.Wallet;

export let localforage =
  window?.localforage || globalThis?.localforage;

export default {
  DashWallet,
  DashTx,
  DashKeys,
  DashHd,
  DashPhrase,
  DashSight,
  DashSocket,
  Base58Check,
  RIPEMD160,
  Secp256k1,
  Cryptic,
  CrypticStorage,
  localforage,
};
