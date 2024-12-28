/**
 * Why is there `state/index.js` & `store/index.js`?
 *
 * `state` is using currently using JS Proxies via the
 * `envoy` function which is the original implementation
 * in the wallet, but as has some issues. The intention
 * is to shift it to pure objects with no side effects.
 *
 * For various reasons, the migration to the Signal based
 * setup is only partially completed and thus both exist.
 *
 * See `store/index.js` for its purpose.
 */
import {
  OIDC_CLAIMS,
} from '../utils/constants.js'
import {
  envoy,
} from '../utils/retort.js'

import {
  DatabaseSetup,
  getStoredItems,
} from '../utils/db.js'

export const store = await DatabaseSetup()

export const storedWallets = await getStoredItems(store.wallets)

export const wallets = envoy(
  {
    ...storedWallets,
  },
  // async (state, oldState, prop) => {
  //   if (state[prop] !== oldState[prop]) {
  //     console.log({ prop, new: state[prop], old: oldState[prop] })

  //     store.wallets.getItem(state[prop].id)
  //       .then(async storedWallet => {
  //         store.addresses.setItem(state[prop].id, storedWallet)
  //       })
  //   }
  // },
)

export function getStoredWallet(
  selectedWallet = localStorage.selectedWallet,
) {
  return wallets?.[selectedWallet]
}

export function getUnusedAccountIndex(
  wallet = getStoredWallet()
) {
  let accountIndex = wallet?.accountIndex || 0

  accountIndex += 1

  return accountIndex
}

export const appDialogs = envoy(
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

export const appComponents = envoy(
  {
    contactsList: {},
  },
)

export const appState = envoy(
  {
    phrase: null,
    encryptionPassword: null,
    selectedWallet: '',
    selectedAlias: '',
    aliasInfo: {},
    aliases: [],
    contacts: [],
    sentTransactions: {},
    transactions: {},
    integrations: {},
    account: {},
    keystore: {},
  },
)

export const appTools = envoy(
  {
    storedData: {},
    balance: {},
  },
)

export const userInfo = envoy(
  {
    ...OIDC_CLAIMS,
  },
  async (state, oldState, prop) => {
    if (
      state[prop] !== oldState[prop] &&
      appState.selectedAlias
    ) {
      let decryptedAlias = await appTools.storedData?.decryptItem?.(
        store.aliases,
        appState.selectedAlias,
      )
      appTools.storedData?.encryptItem?.(
        store.aliases,
        appState.selectedAlias,
        {
          ...decryptedAlias,
          updatedAt: (new Date()).toISOString(),
          info: {
            ...decryptedAlias.info,
            [prop]: state[prop],
          },
        },
        false,
      )
    }
  },
)

export const walletFunds = envoy(
  {
    balance: 0
  },
)
