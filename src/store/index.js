/**
 * Why is there `state/index.js` & `store/index.js`?
 *
 * `store` is using Signals via the `createSignal` function
 * and is what we're moving towards and is meant to be
 * the only one interacting with localForage data. The
 * intention is to shift all localStorage/IndexedDB
 * interactions into signal listeners so the loaded app
 * state and stored data is synchronized.
 *
 * For various reasons, the migration to the Signal based
 * setup is only partially completed and thus both exist.
 *
 * See `state/index.js` for its purpose.
 */
import {
  createSignal,
} from '../utils/retort.js'

import {
  DatabaseSetup,
  getStoredItems,
} from '../utils/db.js'

export const store = await DatabaseSetup()

export const storedWallets = await getStoredItems(store.wallets)

export const wallets = createSignal(
  {
    ...storedWallets,
  },
)

// wallets.on((v, ov) => {
//   if (v !== ov) {
//     store.wallets.getItem(v.id)
//       .then(async storedWallet => {
//         store.addresses.setItem(v.id, storedWallet)
//       })
//   }
// })

export function getStoredWallet(
  selectedWallet = localStorage.selectedWallet,
) {
  return wallets?.value?.[selectedWallet]
}

export function getUnusedAccountIndex(
  wallet = getStoredWallet()
) {
  let accountIndex = wallet?.accountIndex || 0

  accountIndex += 1

  return accountIndex
}

// export const aliases = createSignal({
//   ...(await getStoreData(
//     store.contacts,
//     getTransactionsByContactAlias(appState),
//     res => async v => {
//       res.push(await appTools.storedData?.decryptData?.(v) || v)
//     },
//   ))
// })

// appState.contacts.forEach(
//   ({ alias }) => {
//     if (alias) {
//       aliases.value[alias] = true
//     }
//   }
// )

export const appState = createSignal(
  {
    phrase: null,
    encryptionPassword: null,
    selectedWallet: '',
    selectedAlias: '',
    aliasInfo: {},
    contacts: [],
    sentTransactions: {},
    transactions: {},
    account: {},
  },
)

export const appTools = createSignal(
  {
    storedData: {},
    balance: {},
  },
)

export const appDialogs = createSignal(
  {
    onboard: {},
    phraseBackup: {},
    phraseGenerate: {},
    phraseImport: {},
    walletEncrypt: {},
    walletDecrypt: {},
    addContact: {},
    editContact: {},
    editProfile: {},
    scanContact: {},
    sendOrReceive: {},
    sendConfirm: {},
    requestQr: {},
  },
)
