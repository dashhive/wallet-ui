import { lit as html } from './helpers/lit.js'

import {
  deriveWalletData,
  formDataEntries,
  envoy,
  sortContactsByAlias,
  loadStore,
} from './helpers/utils.js'

import {
  OIDC_CLAIMS,
} from './helpers/constants.js'

import {
  batchAddressGenerate,
  updateAllFunds,
  decryptWallet,
  loadWalletsForAlias,
  store,
} from './helpers/wallet.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupSendRequestBtns from './components/send-request-btns.js'
import setupContactsList from './components/contacts-list.js'
import setupSVGSprite from './components/svg-sprite.js'
import setupDialog from './components/dialog.js'

import onboardRig from './rigs/onboard.js'
import phraseGenerateRig from './rigs/phrase-generate.js'
import phraseBackupRig from './rigs/phrase-backup.js'
import phraseImportRig from './rigs/phrase-import.js'
import walletEncryptRig from './rigs/wallet-encrypt.js'
import walletDecryptRig from './rigs/wallet-decrypt.js'
import addContactRig from './rigs/add-contact.js'
import editProfileRig from './rigs/edit-profile.js'
import scanContactRig from './rigs/scan.js'
import sendOrRequestRig from './rigs/send-or-request.js'

// Example Dash URI's

// let testDashReqUri = `dash:XYZdashAddressZYX?amount=0.50000000&label=test&message=give me monies`
// let testDashExtUri = `web+dash://?xpub=xpub6FKUF6P1ULrfvSrhA9DKSS3MA3digsd27MSTMjBxCczsfYz7vcFLnbQwjP9CsAfEJsnD4UwtbU43iZaibv4vnzQNZmQAVcufN4r3pva8kTz&sub=01H5KG2NGES5RVMA85YB3M6G0G&nickname=Prime%208&profile=https://imgur.com/gallery/y6sSvCr.json&picture=https://i.imgur.com/y6sSvCr.jpeg&scope=sub,nickname,profile,xpub&redirect_uri=https://`

// app/data state
let wallets
let wallet
let userInfo
let appState = envoy(
  {
    phrase: null,
    encryptionPassword: null,
    selectedWallet: '',
    selectedAlias: '',
    aliasInfo: {},
    contacts: [],
  },
  (state, oldState) => {
    if (state.contacts !== oldState.contacts) {
      console.log(
        'state.contacts !== oldState.contacts on push',
        oldState.contacts,
        state.contacts,
      )
    }
  }
)

// rigs
let appDialogs = envoy(
  {
    onboard: {},
    phraseBackup: {},
    phraseGenerate: {},
    phraseImport: {},
    walletEncrypt: {},
    walletDecrypt: {},
    addContact: {},
    editProfile: {},
    scanContact: {},
    sendOrRequest: {},
  },
)

// element
let bodyNav
let dashBalance
let mainApp = document.querySelector('main#app')

// init components
let mainFtr = await setupMainFooter(mainApp)
let sendRequestBtn = await setupSendRequestBtns(mainApp)
let svgSprite = await setupSVGSprite(mainApp)
let contactsList = await setupContactsList(
  mainApp,
  {
    events: {
      handleClick: state => async event => {
        event.preventDefault()
        // console.warn(
        //   'handle contacts click',
        //   event.target,
        //   state,
        // )
        if (
          event.target?.id === 'add_contact' ||
          event.target?.parentNode?.id === 'add_contact'
        ) {
          await getUserInfo()
          let selectedWallet = wallets?.[appState.selectedWallet]
          let accountIndex = selectedWallet
            ?.accountIndex || 0

          let shareAccount
          let newContact

          if (appState.phrase) {
            console.log(
              'share qr current wallet',
              accountIndex,
              selectedWallet?.xkeyId,
              selectedWallet,
            )

            accountIndex += 1

            if (selectedWallet) {
              let upWallet = await store.wallets.setItem(
                appState.selectedWallet,
                {
                  ...selectedWallet,
                  accountIndex,
                }
              )
              wallets[appState.selectedWallet] = upWallet
            }

            shareAccount = await deriveWalletData(
              appState.phrase,
              accountIndex
            )

            console.log(
              'share qr derived wallet',
              accountIndex,
              // shareAccount?.xkeyId,
              shareAccount,
              // wallet,
            )

            newContact = await store.contacts.setItem(
              // shareAccount.id,
              shareAccount.xkeyId,
              {
                incoming: {
                  // ...(state.contact.incoming || {}),
                  [`${appState.selectedWallet}/${shareAccount.xkeyId}`]: {
                    accountIndex,
                    addressIndex: shareAccount.addressIndex,
                    xprv: shareAccount.xprv,
                    xpub: shareAccount.xpub,
                    id: shareAccount.id,
                    xkeyId: shareAccount.xkeyId,
                    addressKeyId: shareAccount.addressKeyId,
                    address: shareAccount.address,
                  },
                },
              }
            )

            appState.contacts.push(newContact)

            contactsList.render(
              appState.contacts.sort(sortContactsByAlias)
            )

            // await loadStore(
            //   store.contacts,
            //   res => contactsList.render(res)
            // )

            console.log(
              'share qr new contact',
              newContact,
            )
          }

          appDialogs.addContact.render(
            {
              wallet: shareAccount,
              contact: newContact,
              userInfo,
            },
            'afterend',
          )
          appDialogs.addContact.showModal()
        }
      },
    },
  }
)

async function getUserInfo() {
  if (appState.selectedAlias) {
    console.log(
      'getUserInfo selectedAlias',
      appState.selectedAlias,
      // appState
    )
    let { $wallets, ...$userInfo } = await loadWalletsForAlias(
      appState.selectedAlias
    )
    wallets = $wallets

    userInfo = envoy(
      {
        ...OIDC_CLAIMS,
        ...($userInfo?.info || {}),
      },
      async (state, oldState, prop) => {
        if (state[prop] !== oldState[prop]) {
          let $aliases = await store.aliases.getItem(
            appState.selectedAlias,
          )
          store.aliases.setItem(
            appState.selectedAlias,
            {
              ...$aliases,
              info: {
                ...$aliases.info,
                [prop]: state[prop],
              },
            }
          )
        }
      }
    )
  }
}

async function main() {
  appState.encryptionPassword = window.atob(
    sessionStorage.encryptionPassword || ''
  )
  appState.selectedWallet = localStorage?.selectedWallet || ''
  appState.selectedAlias = localStorage?.selectedAlias || ''

  await getUserInfo()

  let accountIndex = wallets?.[appState.selectedWallet]
    ?.accountIndex || 0

  bodyNav = await setupNav(
    mainApp,
    {
      data: {
        alias: appState.selectedAlias
      },
    }
  )

  appDialogs.walletEncrypt = walletEncryptRig({
    setupDialog, appDialogs, appState, mainApp,
    wallet, wallets, bodyNav, dashBalance,
  })

  appDialogs.walletDecrypt = walletDecryptRig({
    setupDialog, appDialogs, appState, mainApp,
    wallets, decryptWallet, getUserInfo,
  })

  appDialogs.phraseBackup = phraseBackupRig({
    mainApp, setupDialog, appDialogs,
  })

  appDialogs.phraseGenerate = phraseGenerateRig({
    setupDialog, appDialogs, appState,
    mainApp, wallet, deriveWalletData,
  })

  appDialogs.phraseImport = phraseImportRig({
    setupDialog, appDialogs, appState,
    mainApp, wallet, deriveWalletData,
  })

  appDialogs.onboard = onboardRig({
    mainApp, setupDialog, appDialogs,
  })

  appDialogs.addContact = addContactRig({
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, userInfo, contactsList,
  })

  appDialogs.editProfile = editProfileRig({
    mainApp, setupDialog, store,
    appState, bodyNav,
  })

  appDialogs.scanContact = scanContactRig({
    setupDialog, mainApp,
  })

  appDialogs.sendOrRequest = sendOrRequestRig({
    mainApp, setupDialog, appDialogs,
    wallet, deriveWalletData,
  })

  svgSprite.render()

  document.addEventListener('submit', async event => {
    let {
      // @ts-ignore
      name: formName, parentElement, form,
    } = event?.target

    if (formName === 'send_or_request') {
      event.preventDefault()
      event.stopPropagation()

      appDialogs.sendOrRequest.render({
        userInfo,
        contacts: appState.contacts
      })
      appDialogs.sendOrRequest.showModal()
        // .catch(console.error)
    }
  })
  document.addEventListener('change', async event => {
    let {
      // @ts-ignore
      name: fieldName, parentElement, form,
    } = event?.target

    // console.log('form change', {
    //   fieldName,
    //   form,
    // })

    if (
      fieldName === 'show_pass'
    ) {
      event.stopPropagation()
      event.preventDefault()

      let { pass, show_pass, } = form

      if (show_pass?.checked) {
        pass.type = 'text'
      } else {
        pass.type = 'password'
      }
    }
  })

  let ks_phrase = wallets?.[appState.selectedWallet]
    ?.keystore?.crypto?.ciphertext || ''
  let ks_iv = wallets?.[appState.selectedWallet]
    ?.keystore?.crypto?.cipherparams?.iv || ''
  let ks_salt = wallets?.[appState.selectedWallet]
    ?.keystore?.crypto?.kdfparams?.salt || ''

  if (appState.encryptionPassword) {
    try {
      appState.phrase = await decryptWallet(
        appState.encryptionPassword,
        ks_iv,
        ks_salt,
        ks_phrase
      )
    } catch(err) {
      console.error(
        '[fail] unable to decrypt recovery phrase',
        err
      )
      sessionStorage.removeItem('encryptionPassword')
    }
  }

  if (
    !appState.phrase &&
    ks_phrase && ks_iv && ks_salt
  ) {
    sessionStorage.removeItem('encryptionPassword')

    appDialogs.walletDecrypt.render({ wallet })
    await appDialogs.walletDecrypt.showModal()
  }

  let walletFunds = envoy(
    {
      balance: 0
    },
    (state, oldState) => {
      if (state.balance !== oldState.balance) {
        dashBalance?.restate({
          wallet,
          walletFunds: {
            balance: state.balance
          }
        })
      }
    }
  )

  if (!appState.phrase) {
    appDialogs.onboard.render()
    await appDialogs.onboard.show()
  } else {
    wallet = await deriveWalletData(appState.phrase)

    if (store.addresses.length() === 0) {
      let addressIndex = 0
      let acctBatch = accountIndex + 5
      let accts = {}

      for (;accountIndex < acctBatch;accountIndex++) {
        accts[`bat__${accountIndex}`] = await batchAddressGenerate(
          wallet,
          accountIndex,
          addressIndex,
        )
      }
    }
  }

  bodyNav.render({
    data: {
      alias: appState.selectedAlias
    },
  })
  mainFtr.render()

  await loadStore(
    store.contacts,
    res => {
      if (res) {
        appState.contacts = res

        contactsList.render({
          contacts: res?.sort(sortContactsByAlias),
          userInfo,
        })
      }
    }
  )

  await contactsList.render({
    userInfo,
    contacts: appState.contacts
  })
  sendRequestBtn.render()

  document.addEventListener('click', async event => {
    let {
      // @ts-ignore
      id,
    } = event?.target

    if (id === 'nav-alias') {
      event.preventDefault()
      event.stopPropagation()

      let shareAccount

      if (appState.phrase) {
        console.log(
          'share qr current wallet',
          accountIndex,
          wallet?.xkeyId,
          wallet,
        )

        accountIndex += 1

        shareAccount = await deriveWalletData(
          appState.phrase,
          accountIndex
        )

        console.log(
          'share qr derived wallet',
          accountIndex,
          shareAccount?.xkeyId,
          shareAccount,
        )
      }

      await getUserInfo()

      appDialogs.editProfile.render(
        {
          wallet: shareAccount,
          userInfo,
        },
        'afterend',
      )

      appDialogs.editProfile.showModal()
    }
  })

  mainApp.insertAdjacentHTML('afterbegin', html`
    <header></header>
  `)

  import('./components/balance.js')
    .then(async ({ setupBalance }) => {
      dashBalance = await setupBalance(
        mainApp.querySelector('& > header'),
        {
          wallet,
        }
      )
      dashBalance.render({
        wallet,
        walletFunds: {
          balance: walletFunds?.balance || 0
        }
      })
    })

  updateAllFunds(wallet)
    .then(funds => {
      dashBalance?.restate({
        wallet,
        walletFunds: {
          balance: funds
        }
      })
    })
    .catch(err => console.error('catch updateAllFunds', err, wallet))
}

main()
