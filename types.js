/**
 * @typedef {import("./node_modules/crypticstorage/crypticstorage.js")} CrypticStorage
 * @typedef {import("dashhd").HDWallet} HDWallet
 * @typedef {import("dashhd").HDXKey} HDXKey
 * @typedef {import("dashhd").HDAccount} HDAccount
 * @typedef {import("dashhd").HDFromXKeyOptions} HDFromXKeyOptions
 * @typedef {import("dashhd").HDToPublic} HDToPublic
 * @typedef {import("dashhd").HDKey} HDKey
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
 *
 * @typedef {{
 *  id: string;
 *  addressKeyId: string;
 *  address: string;
 *  xkeyId: string;
 *  xkey: HDXKey;
 *  xprv: string;
 *  xpub: string;
 *  seed: Uint8Array;
 *  wpub: string;
 *  wallet: HDWallet;
 *  account: HDAccount;
 *  recoveryPhrase: string;
 * }} SeedWallet
 *
 * @typedef {{
 *  xpub: string;
 *  xpubKey: HDXKey;
 *  xpubId: string;
 *  address: string;
 * }} GetAddr
 *
 * @typedef {{
 *  fromXpub: string;
 *  hdkeyId: string;
 *  keyId: string;
 *  hdkey: string;
 *  key: string;
 *  xpub: string;
 *  xpubKey: HDXKey;
 *  xpubId: string;
 *  address: string;
 * }} ContactAddr
 */
