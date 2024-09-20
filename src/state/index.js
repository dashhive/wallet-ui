import {
  OIDC_CLAIMS,
} from '../utils/constants.js'
import {
  envoy,
} from '../utils/retort.js'
import {
  store,
} from '../utils/dash/network.js'

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

export const appState = envoy(
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
  // async (state, oldState, prop) => {
  //   if (prop === 'sentTransactions') {
  //     console.log(prop, state[prop])
  //   }
  // },
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
      let decryptedAlias = await appTools.storedData.decryptItem(
        store.aliases,
        appState.selectedAlias,
      )
      appTools.storedData.encryptItem(
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