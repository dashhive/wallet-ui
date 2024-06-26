import { lit as html } from './helpers/lit.js'

import {
  generateWalletData,
  deriveWalletData,
  envoy,
  sortContactsByAlias,
  getStoreData,
  formDataEntries,
  getAddressIndexFromUsage,
} from './helpers/utils.js'

import {
  DUFFS,
  OIDC_CLAIMS,
  // USAGE,
} from './helpers/constants.js'

import {
  findInStore,
  initDashSocket,
  // batchAddressGenerate,
  batchGenAccts,
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
  getUnusedChangeAddress,
  getAccountWallet,
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
import sendOrReceiveRig from './rigs/send-or-request.js'
import sendConfirmRig from './rigs/send-confirm.js'
import requestQrRig from './rigs/request-qr.js'
import pairQrRig from './rigs/pair-qr.js'
import txInfoRig from './rigs/tx-info.js'
import showErrorDialog from './rigs/show-error.js'

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
    sendOrReceive: {},
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

mainApp.insertAdjacentHTML('afterbegin', html`
  <div class="cols integration-sect">
  </div>
  <div class="cols main-sect">
  </div>
`)

let integrationsSection = mainApp.querySelector('.integration-sect')
let mainAppGrid = mainApp.querySelector('.main-sect')

// init components
let mainFtr = await setupMainFooter(mainApp)
let sendRequestBtn = await setupSendRequestBtns(mainApp)
let svgSprite = await setupSVGSprite(mainApp)
let contactsList = await setupContactsList(
  mainAppGrid,
  {
    events: {
      handleClick: state => async event => {
        event.preventDefault()

        let contactArticle = event.target?.closest('a, article')

        if (
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

          let contactAccountID = Object.values(contactData.incoming || {})?.[0]?.accountIndex
          console.log('contact click data', contactData)

          let shareAccount = await deriveWalletData(
            appState.phrase,
            contactAccountID,
          )

          if (!contactData.outgoing) {
            // Finish Pairing
            let contactName = contactData?.info?.name || 'Contact'
            await appDialogs.addContact.render(
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
            await appDialogs.editContact.render(
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
          getTarget(event, 'paired_contacts')
        ) {
          event.preventDefault()
          event.stopPropagation()

          await contactsList.render({
            userInfo,
            contacts: appState.contacts,
            showUnpaired: false,
          })
        }

        if (
          getTarget(event, 'unpaired_contacts')
        ) {
          event.preventDefault()
          event.stopPropagation()

          await contactsList.render({
            userInfo,
            contacts: appState.contacts,
            showUnpaired: true,
          })
        }

        if (
          getTarget(event, 'add_contact')
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
              accountIndex,
            )

            console.log('main.js contact account', shareAccount)

            let created = (new Date()).toISOString()
            let usage = [0,0]

            newAccount = await store.accounts.setItem(
              shareAccount.xkeyId,
              {
                createdAt: created,
                updatedAt: (new Date()).toISOString(),
                accountIndex,
                usage,
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
            ) ?? {}

            console.log(
              'share qr derived wallet',
              accountIndex,
              finalAddressIndex,
              addresses,
              shareAccount,
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

            await contactsList.render({
              userInfo,
              contacts: appState.contacts,
            })

            console.log(
              'share qr new contact',
              newContact,
            )
          }

          await appDialogs.addContact.render(
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

    await appTools.storedData?.decryptItem(
      store.aliases,
      appState.selectedAlias,
    )
    .then(async $alias => {
      let { $wallets, ...$userInfo } = await loadWalletsForAlias(
        $alias
      )
      wallets = $wallets
      console.log(
        'getUserInfo $alias',
        {
          $alias,
          $wallets,
          $userInfo,
        }
      )

      Object.entries(($userInfo?.info || {}))
        .forEach(
          ([k,v]) => userInfo[k] = v
        )
    })
    .catch(err => {
      showErrorDialog({
        title: 'Unable to decrypt seed phrase',
        msg: err,
        showActBtn: false,
        confirmAction: appDialogs.confirmAction,
      })
    })
  }
}

async function handlePasswordToggle(event) {
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
}

function getTarget(event, selector) {
  let {
    // @ts-ignore
    id,
    // @ts-ignore
    parentElement,
    // @ts-ignore
    parentNode,
  } = event?.target

  let target

  if (id === selector) {
    target = event?.target
  }

  if (parentElement?.id === selector) {
    target = parentElement
  }

  if (parentNode?.id === selector) {
    target = parentNode
  }

  return target
}

async function showNotification({
  type = '',
  title = '',
  msg = '',
  sticky = false,
}) {
  console.log('notification', {type, title, msg, sticky})
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

  appDialogs.confirmAction = await confirmActionRig({
    mainApp, setupDialog,
    appDialogs, appState, appTools,
  })

  appDialogs.walletEncrypt = await walletEncryptRig({
    setupDialog, appDialogs, appState, mainApp,
    wallet, wallets, bodyNav, dashBalance,
  })

  appDialogs.walletDecrypt = await walletDecryptRig({
    setupDialog, appDialogs, appState, mainApp, importFromJson,
    wallets, decryptKeystore, getUserInfo, store, deriveWalletData,
    showErrorDialog,
  })

  appDialogs.walletBackup = await walletBackupRig({
    mainApp, wallet, wallets, setupDialog, appDialogs, appState, store,
    exportWalletData, saveJsonToFile, localForageBaseCfg,
  })

  appDialogs.phraseBackup = await phraseBackupRig({
    mainApp, wallets, setupDialog, appDialogs,
  })

  appDialogs.phraseGenerate = await phraseGenerateRig({
    setupDialog, appDialogs, appState,
    mainApp, wallet, wallets, store,
    deriveWalletData, generateWalletData,
  })

  appDialogs.phraseImport = await phraseImportRig({
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, wallets, deriveWalletData,
    showErrorDialog,
  })

  appDialogs.onboard = await onboardRig({
    mainApp, setupDialog, appDialogs,
  })

  appDialogs.addContact = await addContactRig({
    setupDialog, updateAllFunds,
    appDialogs, appState, appTools, store, walletFunds,
    mainApp, wallet, userInfo, contactsList,
  })

  appDialogs.confirmDelete = await confirmDeleteRig({
    mainApp, setupDialog, appDialogs, appState, appTools,
    store, userInfo, contactsList,
  })

  appDialogs.editContact = await editContactRig({
    setupDialog, updateAllFunds,
    appDialogs, appState, appTools, store, walletFunds,
    mainApp, wallet, userInfo, contactsList,
  })

  appDialogs.editProfile = await editProfileRig({
    mainApp, setupDialog, store,
    appState, appTools, bodyNav,
  })

  appDialogs.scanContact = await scanContactRig({
    setupDialog, mainApp,
  })

  appDialogs.sendOrReceive = await sendOrReceiveRig({
    mainApp, appDialogs, appState, appTools, store,
    wallet, account: appState.account, walletFunds,
    setupDialog, deriveWalletData, createTx,
    getAddrsWithFunds, batchGenAcctAddrs, getUnusedChangeAddress, getAccountWallet, showErrorDialog,
  })

  appDialogs.txInfo = await txInfoRig({
    setupDialog,
    mainApp, wallet, userInfo,
  })

  appDialogs.sendConfirm = await sendConfirmRig({
    mainApp, appDialogs, appState, appTools,
    store, userInfo, contactsList, walletFunds,
    setupDialog, deriveWalletData, getAddrsWithFunds,
    sendTx, updateAllFunds, showErrorDialog,
  })

  appDialogs.requestQr = await requestQrRig({
    mainApp, appDialogs, appState, appTools, userInfo, store,
    setupDialog, deriveWalletData, batchGenAcctAddrs,
  })

  appDialogs.pairQr = await pairQrRig({
    setupDialog,
    mainApp, wallet, userInfo,
  })

  svgSprite.render()

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
      await showErrorDialog({
        title: 'Unable to decrypt seed phrase',
        msg: err,
        showActBtn: false,
        confirmAction: appDialogs.confirmAction,
      })
      sessionStorage.removeItem('encryptionPassword')
    }
  }

  if (
    !appState.phrase &&
    ks_phrase && ks_iv && ks_salt
  ) {
    sessionStorage.removeItem('encryptionPassword')

    await appDialogs.walletDecrypt.render({ wallet })
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

  document.addEventListener('input', handlePasswordToggle)
  document.addEventListener('change', handlePasswordToggle)

  if (!appState.phrase) {
    await appDialogs.onboard.render()
    await appDialogs.onboard.show()
  }

  if (appState.phrase && !wallet) {
    wallet = await deriveWalletData(appState.phrase)
    let aw = await getAccountWallet(
      wallet,
      appState.phrase,
    )
    wallet = aw.wallet
  }

  document.addEventListener('submit', async event => {
    let {
      // @ts-ignore
      name: formName,
    } = event?.target

    let fde = formDataEntries(event)

    if (formName === 'send_or_receive') {
      event.preventDefault()
      event.stopPropagation()

      if (fde.intent === 'receive') {
        let receiveWallet
        let selectedWallet = wallets?.[appState.selectedWallet]

        // console.log('selectedWallet', wallet, selectedWallet)

        if (wallet?.xkeyId) {
          let aw = await getAccountWallet(
            wallet,
            appState.phrase,
          )

          wallet = aw.wallet

          batchGenAcctAddrs(
            receiveWallet,
            aw.account,
          )

          // console.log(
          //   `${fde.intent} TO SELECTED WALLET`,
          //   {
          //     wallet,
          //     account: aw.account,
          //   }
          // )

          await appDialogs.requestQr.render(
            {
              name: 'Share to receive funds',
              submitTxt: `Edit Amount or Contact`,
              submitAlt: `Change the currently selected contact`,
              footer: state => html`
                <footer class="inline col">
                  <button
                    class="rounded"
                    type="submit"
                    name="intent"
                    value="select_address"
                    title="${state.submitAlt}"
                  >
                    <span>${state.submitTxt}</span>
                  </button>
                </footer>
              `,
              amount: 0,
              wallet,
              contacts: appState.contacts,
            },
            'afterend',
          )

          let showRequestQR = await appDialogs.requestQr.showModal()
        }
      } else {
        await appDialogs.sendOrReceive.render({
          action: fde.intent,
          wallet,
          account: appState.account,
          userInfo,
          contacts: appState.contacts,
          to: null,
        })
        appDialogs.sendOrReceive.showModal()
      }
    }
  })

  batchGenAccts(appState.phrase, 1)
    .then(async accts => {
      console.log('batchGenAccts', { accts })

      batchGenAcctsAddrs(wallet)
        .then(accts => {
          console.log('batchGenAcctsAddrs', { accts })

          updateAllFunds(wallet, walletFunds)
            .then(funds => {
              console.log('updateAllFunds then funds', funds)
            })
            .catch(err => {
              // console.error('catch updateAllFunds', err, wallet)
              showNotification({
                type: 'error',
                title: 'Update funds',
                msg: err,
              })
            })
        })
    })

  bodyNav.render({
    data: {
      alias: appState.selectedAlias
    },
  })
  mainFtr.render()

  wallets = wallets || await getStoredItems(store.wallets)

  await getUserInfo()

  // console.log('appTools.storedData', appTools.storedData)

  getStoreData(
    store.contacts,
    res => {
      if (res) {
        appState.contacts = res

        contactsList.render({
          contacts: res,
          userInfo,
        })

        console.log('contacts', res)
      }
    },
    res => async v => {
      res.push(await appTools.storedData?.decryptData?.(v) || v)
    }
  )

  await contactsList.render({
    userInfo,
    contacts: appState.contacts,
  })
  sendRequestBtn.render()

  integrationsSection.insertAdjacentHTML('beforeend', html`
    <section>
      <header>
        <h5 class="lh-2">Coming soon</h5>
        <h4 class="lh-2">Earn interest with</h4>
      </header>
      <div>
        <a href="https://app.crowdnode.io/" target="_blank" rel="noreferrer">
          <img src="/public/icons/crowdnode-logo-1000.png" height="50" />
        </a>
        <a href="https://www.mayascan.org/earn" target="_blank" rel="noreferrer">
          <img src="/public/icons/maya-protocol.png" height="50" />
        </a>
      </div>
    </section>
  `)
  mainAppGrid.insertAdjacentHTML('beforeend', html`
    <section class="transactions">
      <header>
        <h5 class="lh-2">Transactions</h5>
      </header>
      <div>
      <span class="flex flex-fill center">Coming soon</span>
      </div>
    </section>
  `)

  document.addEventListener('click', async event => {
    let {
      // @ts-ignore
      id,
      // @ts-ignore
      parentElement,
    } = event?.target

    let aliasTarg = getTarget(event, 'nav-alias')

    if (aliasTarg) {
      event.preventDefault()
      event.stopPropagation()

      console.log('click alias', [aliasTarg])

      aliasTarg?.nextElementSibling.classList.toggle('hidden')
    }
    if (id === 'nav-edit-profile') {
      event.preventDefault()
      event.stopPropagation()

      // @ts-ignore
      event.target?.closest?.('menu.user')?.classList?.toggle('hidden')

      await getUserInfo()

      await appDialogs.editProfile.render(
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

      await appDialogs.walletBackup.render(
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

      await appDialogs.confirmAction.render({
        name: 'Confirm Wallet Lock',
        actionTxt: 'Lock it!',
        actionAlt: 'Lock the wallet',
        action: 'lock',
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

      await appDialogs.confirmAction.render({
        name: 'Confirm Wallet Disconnect',
        actionTxt: 'Disconnect',
        actionAlt: 'Clear all wallet data stored in browser',
        action: 'disconnect',
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

  let storedAddrs = (await store.addresses.keys()) || []

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

        setTimeout(() =>
          updateAllFunds(wallet, walletFunds)
            .then(funds => {
              console.log('updateAllFunds then funds', funds)
            })
            .catch(err => {
              // console.error('catch updateAllFunds', err, wallet)
              showNotification({
                type: 'error',
                title: 'Update funds',
                msg: err,
              })
            }),
          1000
        )
      }

      let now = Date.now();

      // console.log('dash socket vout', data)

      let result = data.vout.filter(function (vout) {
        let v = Object.keys(vout)
        let addr = v[0]
        let duffs = vout[addr]
        let checkAddr = storedAddrs.includes(addr)

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

        // Updates Insight info for Change Address
        if (
          appState?.sentTransactions?.[data.txid]
        ) {
          // console.log('data.vout.filter', vout, data)

          txUpdates[data.txid] = true
          store.addresses.getItem(addr)
            .then(async storedAddr => {
              if (storedAddr?.insight?.updatedAt) {
                storedAddr.insight.balance = (duffs / DUFFS)
                storedAddr.insight.balanceSat = duffs
                storedAddr.insight.updatedAt = 0
                store.addresses.setItem(addr, storedAddr)
              }
            })
          return false
        }

        let newTx = {
          address: addr,
          timestamp: now,
          txid: data.txid,
          satoshis: duffs,
          dash: (duffs / DUFFS),
          txlock: data.txlock,
        };

        walletFunds.balance = walletFunds?.balance + newTx.dash

        console.log(
          'found address in store',
          addr,
          newTx,
        )

        updates[addr] = newTx
        store.addresses.getItem(addr)
          .then(async storedAddr => {
            if (storedAddr.insight?.updatedAt) {
              storedAddr.insight.balance += (duffs / DUFFS)
              storedAddr.insight.balanceSat += duffs
              storedAddr.insight.updatedAt = 0
              store.addresses.setItem(addr, storedAddr)
            }

            let tmpWalletAcct = await store.accounts.getItem(
              storedAddr.xkeyId,
            ) || {}

            let batchAddrs = await batchGenAcctAddrs(
              wallet,
              tmpWalletAcct,
              tmpWalletAcct.usage[storedAddr.usageIndex],
            )

            console.log(
              'socket batch generate addresses for wallet',
              {
                // walletTemp,
                tmpWalletAcct,
                batchAddrs,
              }
            )
          })

        return newTx;
      });

      if (result.length > 0) {
        console.log(
          'socket found address in store',
          updates,
          txUpdates,
        )

        if (appDialogs.requestQr.element.open) {
          if (appDialogs.sendOrReceive.element.open) {
            appDialogs.sendOrReceive.close()
          }
          appDialogs.requestQr.close()
        }

        setTimeout(() =>
          updateAllFunds(wallet, walletFunds)
            .then(funds => {
              console.log('updateAllFunds then funds', funds)
            })
            .catch(err => {
              // console.error('catch updateAllFunds', err, wallet)
              showNotification({
                type: 'error',
                title: 'Update funds',
                msg: err,
              })
            }),
          1000
        )
      }
      let txs = appState?.sentTransactions

      Object.keys(txUpdates).forEach(
        txid => {
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
