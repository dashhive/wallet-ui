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
