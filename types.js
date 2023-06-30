/**
 * @typedef {import("./node_modules/crypticstorage/crypticstorage.js")} CrypticStorage
 * @typedef {Window & import("@dashincubator/base58check/base58check.js")}
 *
 * @typedef {{
 *  encPrivKey?: HTMLElement & { passphrase?: HTMLInputElement };
 *  encryptWallet?: HTMLElement & { passphrase?: HTMLInputElement };
 *  privKeyForm?: HTMLElement & { privateKey?: HTMLInputElement };
 *  balanceForm?: HTMLElement;
 *  fundingModal?: HTMLDialogElement,
 *  generatePrivKeyForm?: HTMLElement,
 *  addPrivKeyForm?: HTMLElement,
 * } & Document} document
 *
 * @typedef {{
 *  addrs?: Object<string, string?>
 * }} PrivateAndPublicKeys
 */
