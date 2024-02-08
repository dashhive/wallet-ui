import { lit as html } from './helpers/lit.js'

import {
  generateWalletData,
  deriveWalletData,
  envoy,
  sortContactsByAlias,
  getStoreData,
  formDataEntries,
} from './helpers/utils.js'

import {
  DUFFS,
  OIDC_CLAIMS,
} from './helpers/constants.js'

import {
  findInStore,
  initDashSocket,
  batchAddressGenerate,
  batchGenAcctAddrs,
  batchGenAcctsAddrs,
  updateAllFunds,
  decryptKeystore,
  getStoredItems,
  loadWalletsForAlias,
  store,
  createTx,
  sendTx,
  getAddrsWithFunds,
  storedData,
} from './helpers/wallet.js'
import {
  localForageBaseCfg,
  importFromJson,
  exportWalletData,
  saveJsonToFile,
} from './helpers/db.js'

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
import walletBackupRig from './rigs/wallet-backup.js'
import addContactRig from './rigs/add-contact.js'
import editContactRig from './rigs/edit-contact.js'
import confirmActionRig from './rigs/confirm-action.js'
import confirmDeleteRig from './rigs/confirm-delete.js'
import editProfileRig from './rigs/edit-profile.js'
import scanContactRig from './rigs/scan.js'
import sendOrRequestRig from './rigs/send-or-request.js'
import sendConfirmRig from './rigs/send-confirm.js'
import requestQrRig from './rigs/request-qr.js'
import pairQrRig from './rigs/pair-qr.js'

// app/data state
let accounts
let wallets
let wallet

let appState = envoy(
  {
    phrase: null,
    encryptionPassword: null,
    selectedWallet: '',
    selectedAlias: '',
    aliasInfo: {},
    contacts: [],
    sentTransactions: {},
    account: {},
  },
)
let appTools = envoy(
  {
    storedData: {},
  },
)
let userInfo = envoy(
  {
    ...OIDC_CLAIMS,
  },
  async (state, oldState, prop) => {
    if (state[prop] !== oldState[prop]) {
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
    editContact: {},
    editProfile: {},
    scanContact: {},
    sendOrRequest: {},
    sendConfirm: {},
    requestQr: {},
  },
)

let walletFunds = envoy(
  {
    balance: 0
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
        // console.log(
        //   'handle contacts click',
        //   event.target,
        //   state,
        // )

        let contactArticle = event.target?.closest('a, article')

        if (
          // event.target?.nodeName === 'ARTICLE'
          contactArticle !== null
        ) {
          let contactID = contactArticle.dataset.id
          if (!contactID) {
            return;
          }
          let contactData = await appTools.storedData?.decryptItem?.(
            store.contacts,
            contactID,
          )
          if (!contactData.incoming) {
            return;
          }
          let contactAccountID = Object.values(contactData?.incoming || {})?.[0]?.accountIndex
          console.log('contact click data', contactData)

          let shareAccount = await deriveWalletData(
            appState.phrase,
            contactAccountID
          )

          if (!contactData.outgoing) {
            // Finish Pairing
            let contactName = contactData?.info?.name || 'Contact'
            appDialogs.addContact.render(
              {
                name: `Finish Pairing with ${contactName}`,
                wallet: shareAccount,
                contact: contactData,
                userInfo,
              },
              'afterend',
            )
            appDialogs.addContact.showModal()
          } else {
            // Edit Contact
            appDialogs.editContact.render(
              {
                wallet,
                account: appState.account,
                shareAccount,
                contact: contactData,
                userInfo,
              },
              'afterend',
            )
            appDialogs.editContact.showModal()
          }
        }

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
          let newAccount

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
                  updatedAt: (new Date()).toISOString(),
                }
              )
              wallets[appState.selectedWallet] = upWallet
            }

            shareAccount = await deriveWalletData(
              appState.phrase,
              accountIndex
            )

            let created = (new Date()).toISOString()

            newAccount = await store.accounts.setItem(
              shareAccount.xkeyId,
              {
                createdAt: created,
                updatedAt: (new Date()).toISOString(),
                accountIndex,
                addressIndex: shareAccount.addressIndex,
                walletId: shareAccount.id,
                xkeyId: shareAccount.xkeyId,
                addressKeyId: shareAccount.addressKeyId,
                address: shareAccount.address,
              }
            )
            let { createdAt, updatedAt, ...contactAcct } = newAccount

            let { addresses, finalAddressIndex } = await batchGenAcctAddrs(
              wallet,
              newAccount,
            )

            console.log(
              'share qr derived wallet',
              accountIndex,
              finalAddressIndex,
              addresses,
              // shareAccount?.xkeyId,
              shareAccount,
              // wallet,
            )

            newContact = await appTools.storedData.encryptItem(
              store.contacts,
              shareAccount.xkeyId,
              {
                createdAt,
                updatedAt,
                incoming: {
                  [`${contactAcct.walletId}/${contactAcct.xkeyId}`]: {
                    ...contactAcct,
                  }
                }
              },
              false,
            )

            appState.contacts.push(newContact)

            contactsList.render(
              appState.contacts.sort(sortContactsByAlias)
            )

            console.log(
              'share qr new contact',
              newContact,
            )
          }

          appDialogs.addContact.render(
            {
              name: 'Add a New Contact',
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
  let ks = wallets?.[appState.selectedWallet]?.keystore

  if (
    appState.encryptionPassword && appState.selectedAlias && ks
  ) {
    appTools.storedData = storedData(
      appState.encryptionPassword,
      ks,
    )
    // console.log(
    //   'getUserInfo selectedAlias',
    //   appState.selectedAlias,
    // )
    await appTools.storedData?.decryptItem(
      store.aliases,
      appState.selectedAlias,
    )
    .then(async $alias => {
      let { $wallets, ...$userInfo } = await loadWalletsForAlias(
        $alias
      )
      wallets = $wallets

      Object.entries(($userInfo?.info || {}))
        .forEach(
          ([k,v]) => userInfo[k] = v
        )
    })
  }
}

async function main() {
  appState.encryptionPassword = window.atob(
    sessionStorage.encryptionPassword || ''
  )
  appState.selectedWallet = localStorage?.selectedWallet || ''
  appState.selectedAlias = localStorage?.selectedAlias || ''
  appState.selectedAccount = localStorage?.selectedAccount || ''

  wallets = await getStoredItems(store.wallets)

  console.log('main wallets', wallets)

  if (appState.encryptionPassword) {
    await getUserInfo()
  }

  accounts = await findInStore(
    store.accounts,
    {
      walletId: appState.selectedWallet,
      accountIndex: 0,
    }
  )

  appState.account = Object.values(accounts || {})?.[0]

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
    setupDialog, appDialogs, appState, mainApp, importFromJson,
    wallets, decryptKeystore, getUserInfo, store, deriveWalletData,
  })

  appDialogs.walletBackup = walletBackupRig({
    mainApp, wallet, wallets, setupDialog, appDialogs, appState, store,
    exportWalletData, saveJsonToFile, localForageBaseCfg,
  })

  appDialogs.phraseBackup = phraseBackupRig({
    mainApp, wallets, setupDialog, appDialogs,
  })

  appDialogs.phraseGenerate = phraseGenerateRig({
    setupDialog, appDialogs, appState,
    mainApp, wallet, wallets, store,
    deriveWalletData, generateWalletData,
  })

  appDialogs.phraseImport = phraseImportRig({
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, wallets, deriveWalletData,
  })

  appDialogs.onboard = onboardRig({
    mainApp, setupDialog, appDialogs,
  })

  appDialogs.addContact = addContactRig({
    setupDialog, updateAllFunds,
    appDialogs, appState, appTools, store, walletFunds,
    mainApp, wallet, userInfo, contactsList,
  })

  appDialogs.confirmAction = confirmActionRig({
    mainApp, setupDialog,
    appDialogs, appState, appTools,
  })

  appDialogs.confirmDelete = confirmDeleteRig({
    mainApp, setupDialog, appDialogs, appState, appTools,
    store, userInfo, contactsList,
  })

  appDialogs.editContact = editContactRig({
    setupDialog, updateAllFunds,
    appDialogs, appState, appTools, store, walletFunds,
    mainApp, wallet, userInfo, contactsList,
  })

  appDialogs.editProfile = editProfileRig({
    mainApp, setupDialog, store,
    appState, appTools, bodyNav,
  })

  appDialogs.scanContact = scanContactRig({
    setupDialog, mainApp,
  })

  appDialogs.sendOrRequest = sendOrRequestRig({
    mainApp, appDialogs, appState, appTools, store,
    wallet, account: appState.account, walletFunds,
    setupDialog, deriveWalletData, createTx,
    getAddrsWithFunds, batchGenAcctAddrs,
  })

  appDialogs.sendConfirm = sendConfirmRig({
    mainApp, appDialogs, appState, appTools,
    store, userInfo, contactsList, walletFunds,
    setupDialog, deriveWalletData, getAddrsWithFunds,
    createTx, sendTx,
  })

  appDialogs.requestQr = requestQrRig({
    mainApp, setupDialog,
  })

  appDialogs.pairQr = pairQrRig({
    setupDialog,
    mainApp, wallet, userInfo,
  })

  svgSprite.render()

  document.addEventListener('submit', async event => {
    let {
      // @ts-ignore
      name: formName, parentElement, form,
    } = event?.target

    let fde = formDataEntries(event)

    if (formName === 'send_or_request') {
      event.preventDefault()
      event.stopPropagation()
      let name = 'Send Funds'
      if (fde.intent === 'request') {
        name = 'Request Funds'
      }

      appDialogs.sendOrRequest.render({
        action: fde.intent,
        wallet,
        account: appState.account,
        // accounts,
        userInfo,
        contacts: appState.contacts,
        to: null,
      })
      appDialogs.sendOrRequest.showModal()
        // .catch(console.error)
    }
  })
  document.addEventListener('input', async event => {
    let {
      // @ts-ignore
      name: fieldName, form,
    } = event?.target

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

  let ks = wallets?.[appState.selectedWallet]
    ?.keystore
  let ks_phrase = ks?.crypto?.ciphertext || ''
  let ks_iv = ks?.crypto?.cipherparams?.iv || ''
  let ks_salt = ks?.crypto?.kdfparams?.salt || ''

  if (appState.encryptionPassword && ks) {
    try {
      appState.phrase = await decryptKeystore(
        appState.encryptionPassword,
        ks,
      )

      appTools.storedData = storedData(
        appState.encryptionPassword,
        ks,
      )
    } catch(err) {
      console.error(
        '[fail] unable to decrypt seed phrase',
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

  walletFunds._listeners = [
    ...walletFunds._listeners,
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
  ]

  if (!appState.phrase) {
    appDialogs.onboard.render()
    await appDialogs.onboard.show()
  } else {
    wallet = await deriveWalletData(appState.phrase)
  }

  batchGenAcctsAddrs(wallet)
    // .then(data => console.warn('batchGenAcctsAddrs', { data }))

  // temp fix, should be handled already
  if (appState.phrase && !wallet) {
    wallet = await deriveWalletData(appState.phrase)
  }

  bodyNav.render({
    data: {
      alias: appState.selectedAlias
    },
  })
  mainFtr.render()

  wallets = wallets || await getStoredItems(store.wallets)

  await getUserInfo()

  console.log('appTools.storedData', appTools.storedData)

  getStoreData(
    store.contacts,
    res => {
      if (res) {
        appState.contacts = res

        contactsList.render({
          contacts: res?.sort(sortContactsByAlias),
          userInfo,
        })
      }
    },
    res => async v => {
      res.push(await appTools.storedData?.decryptData?.(v) || v)
      // appTools.storedData.decryptData(v)
      //   .then(ev => res.push(ev))
    }
  )

  await contactsList.render({
    userInfo,
    contacts: appState.contacts
  })
  sendRequestBtn.render()

  function getTarget(event, selector) {
    let {
      // @ts-ignore
      id,
      // @ts-ignore
      parentElement,
    } = event?.target

    let target

    if (id === selector) {
      target = event?.target
    }

    if (parentElement.id === selector) {
      target = parentElement
    }

    return target
  }

  document.addEventListener('click', async event => {
    let {
      // @ts-ignore
      id,
      // @ts-ignore
      nextElementSibling,
      // @ts-ignore
      parentElement,
    } = event?.target

    let aliasTarg = getTarget(event, 'nav-alias')

    if (aliasTarg) {
      event.preventDefault()
      event.stopPropagation()

      console.log('click alias', [aliasTarg])

      aliasTarg?.nextElementSibling.classList.toggle('hidden')
      // @ts-ignore
      // targ?.closest?.('menu.user')?.classList?.toggle('hidden')

      // event.target.next
    }
    if (id === 'nav-edit-profile') {
      event.preventDefault()
      event.stopPropagation()

      // @ts-ignore
      event.target?.closest?.('menu.user')?.classList?.toggle('hidden')

      await getUserInfo()

      appDialogs.editProfile.render(
        {
          wallet,
          userInfo,
        },
        'afterend',
      )

      appDialogs.editProfile.showModal()
    }
    if (id === 'nav-backup') {
      event.preventDefault()
      event.stopPropagation()

      // @ts-ignore
      event.target?.closest?.('menu.user')?.classList?.toggle('hidden')

      appDialogs.walletBackup.render(
        {
          wallet,
          wallets,
        },
        'afterend',
      )
      appDialogs.walletBackup.showModal()
    }
    if (id === 'nav-lock') {
      event.preventDefault()
      event.stopPropagation()

      // @ts-ignore
      event.target?.closest?.('menu.user')?.classList?.toggle('hidden')

      appDialogs.confirmAction.render({
        name: 'Confirm Wallet Lock',
        actionTxt: 'Lock it!',
        actionAlt: 'Lock the wallet',
        action: 'lock',
        // target: '',
        // targetFallback: 'this wallet',
        actionType: 'warn',
        alert: state => html``,
        callback: () => {
          sessionStorage.clear()
          window.location.reload()
        },
      })
      appDialogs.confirmAction.showModal()
    }
    if (id === 'nav-disconnect') {
      event.preventDefault()
      event.stopPropagation()

      // @ts-ignore
      event.target?.closest?.('menu.user')?.classList?.toggle('hidden')

      appDialogs.confirmAction.render({
        name: 'Confirm Wallet Disconnect',
        actionTxt: 'Disconnect',
        actionAlt: 'Clear all wallet data stored in browser',
        action: 'disconnect',
        // target: '',
        // targetFallback: 'this wallet',
        actionType: 'dang',
        submitIcon: state => `🧹`, // `💣`,
        alert: state => html`
          <div class="flex px-3 ta-left col">
            <sub class="ta-left my-0">
              <i class="icon-warning-circle"></i>
              IMPORTANT
            </sub>
            <sup class="ta-left">This is an irreversable action which removes all wallet data from your browser, make sure to backup your data first.<br/> <h3>WE RETAIN NO BACKUPS OF YOUR WALLET DATA.</h3></sup>
          </div>
        `,
        callback: () => {
          localStorage.clear()
          sessionStorage.clear()
          // @ts-ignore
          store.wallets.dropInstance({
            name: localForageBaseCfg.name
          })

          window.location.reload()
        },
      })
      appDialogs.confirmAction.showModal()
    }

    // @ts-ignore
    // event.target?.closest?.('menu menu:not(.hidden)')?.classList?.add('hidden')
    if ((
      !id?.startsWith('nav-')
    ) && (
      !parentElement?.id?.startsWith('nav-')
    )) {
      document.querySelector('menu.user:not(.hidden)')?.classList?.add('hidden')
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
        walletFunds,
      })
    })

  updateAllFunds(wallet, walletFunds)
    .then(funds => {
      console.log('updateAllFunds then funds', funds)
    })
    .catch(err => console.error('catch updateAllFunds', err, wallet))

  let addrs = (await store.addresses.keys()) || []

  initDashSocket({
    onMessage: async function (evname, data) {
      let updates = {}
      let txUpdates = {}

      if (![
          // "tx",
          "txlock"
        ].includes(evname)
      ) {
        return;
      }

      if (appState?.sentTransactions?.[data.txid]) {
        console.log(
          '===sentTransactions TXID===',
          appState?.sentTransactions?.[data.txid]
        )
      }

      let now = Date.now();
      // if (mempoolTx?.timestamp) {
      //   // don't wait longer than 3s for a txlock
      //   if (now - mempoolTx.timestamp > maxTxLockWait) {
      //     return mempoolTx;
      //   }
      // }

      // console.log('init dash socket vout', data.vout)

      let result = data.vout.some(function (vout) {
        let v = Object.keys(vout)
        let addr = v[0]
        let duffs = vout[addr];
        let checkAddr = addrs.includes(addr)

        if (!checkAddr) {
          if (
            appState?.sentTransactions?.[data.txid]
          ) {
            walletFunds.balance = (
              walletFunds.balance - (duffs / DUFFS)
            )

            txUpdates[data.txid] = true
          }

          return false
        }

        if (
          checkAddr &&
          appState?.sentTransactions?.[data.txid]
        ) {
          txUpdates[data.txid] = true
          store.addresses.getItem(addr)
            .then(async storedAddr => {
              if (storedAddr?.insight?.updated_at) {
                storedAddr.insight.balance = (duffs / DUFFS)
                storedAddr.insight.balanceSat = duffs
                storedAddr.insight.updated_at = 0
                store.addresses.setItem(addr, storedAddr)
              }
            })
          return false
        }

        // if (amount && duffs !== amount) {
        //   return false;
        // }

        let newTx = {
          address: addr,
          timestamp: now,
          txid: data.txid,
          satoshis: duffs,
          dash: (duffs / DUFFS),
          txlock: data.txlock,
        };

        walletFunds.balance = walletFunds?.balance + newTx.dash

        // dashBalance?.restate({
        //   wallet,
        //   walletFunds: {
        //     balance: walletFunds?.balance || 0
        //   }
        // })

        // if ("txlock" !== evname) {
        //   if (!mempoolTx) {
        //     mempoolTx = newTx;
        //   }
        //   return false;
        // }

        // result = newTx;
        console.log(
          'found address in store',
          addr,
          newTx,
        )
        updates[addr] = newTx
        store.addresses.getItem(addr)
          .then(async storedAddr => {
            if (storedAddr.insight?.updated_at) {
              storedAddr.insight.balance += (duffs / DUFFS)
              storedAddr.insight.balanceSat += duffs
              storedAddr.insight.updated_at = 0
              store.addresses.setItem(addr, storedAddr)
            }
          })

        return newTx;
      });

      if (result) {
        console.log(
          'socket found address in store',
          updates,
          txUpdates,
        )

        if (appDialogs.requestQr.element.open) {
          if (appDialogs.sendOrRequest.element.open) {
            appDialogs.sendOrRequest.close()
          }
          appDialogs.requestQr.close()
        }
      }
      let txs = appState?.sentTransactions

      Object.keys(txUpdates).forEach(
        txid => {
          // let txs = appState?.sentTransactions
          if (txs?.[txid]) {
            delete txs[txid]
          }
        }
      )

      appState.sentTransactions = txs
    },
  })
}

main()
