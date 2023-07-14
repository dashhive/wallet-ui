import {
  // Base58Check,
  DashHd,
  DashPhrase,
  // DashKeys,
} from '../imports.js'

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
    recoveryPhrase,
    seed,
    wallet,
    account,
    xkey,
    xprv,
    xpub,
    // wif,
    address,
  }
}