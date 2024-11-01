import {
  CrowdNode,
} from './imports.js'

import {
  DUFFS,
  DIALOG_STATUS,
  DEFAULT_ENTRYPOINT,
  CROWDNODE,
} from './utils/constants.js'

import {
  lit as html,
  formDataEntries,
  getTarget,
  handlePasswordToggle,
  showNotification,
} from './utils/generic.js'

import {
  fixedDash,
  roundUsing,
  getUserInfo,
  batchGenAccts,
  getAccountWallet,
  deriveWalletData,
  getAddrsWithFunds,
  batchGenAcctAddrs,
  generateWalletData,
  batchGenAcctsAddrs,
  loadWalletsForAlias,
  getUnusedChangeAddress,
  batchXkeyAddressGenerate,
  getTransactionsByContactAlias,
} from './utils/dash/local.js'

import {
  createTx,
  dashsight,
  getAddrsTransactions,
  getTxs,
  initDashSocket,
  sendTx,
  updateAllFunds,
} from './utils/dash/network.js'

import {
  decryptKeystore,
  storedData,
} from './utils/cryptic.js'

import {
  exportWalletData,
  findInStore,
  getStoreData,
  getStoredItems,
  importFromJson,
  loadStoreObject,
  localForageBaseCfg,
  saveJsonToFile,
} from './utils/db.js'

import {
  appDialogs,
  appComponents,
  appState,
  appTools,
  userInfo,
  walletFunds,
} from './state/index.js'

import {
  store,
  getStoredWallet,
} from './store/index.js'

import {
  putContact,
  findContactByXkeyID,
  findContactByAlias,
} from './models/contacts.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupSendRequestBtns from './components/send-request-btns.js'
import setupContactsList from './components/contacts-list.js'
import setupTransactionsList from './components/transactions-list.js'
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
import showQrCode from './rigs/show-qr.js'
import pairQrRig from './rigs/pair-qr.js'
import txInfoRig from './rigs/tx-info.js'
import showErrorDialog from './rigs/show-error.js'

import crowdnodeTransactionRig from './rigs/crowdnode-tx.js'

CrowdNode.init({
  baseUrl: CROWDNODE.network.main.baseUrl,
  insightBaseUrl: 'https://insight.dash.org',
  dashsocketBaseUrl: 'https://insight.dash.org/socket.io',
  dashsightBaseUrl: 'https://insight.dash.org/insight-api',
})

// app/data state
let accounts
let wallets
let wallet

// element
let bodyNav
let dashBalance
let mainApp = DEFAULT_ENTRYPOINT

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
          // model.putContact
        }
      },
    },
  }
)
appComponents.contactsList = contactsList

let transactionsList = await setupTransactionsList(mainAppGrid, {
  events: {
    handleClick: state => async event => {
      let txArticle = event.target?.closest('a, article')

      if (!txArticle) {
        event.preventDefault()
        event.stopPropagation()
      }

      console.log(
        'setupTransactionsList click event',
        event.target,
        txArticle,
      )
    },
  },
})

async function main() {
  appState.encryptionPassword = window.atob(
    sessionStorage.encryptionPassword || ''
  )
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
      walletId: localStorage.selectedWallet,
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
    mainApp, appDialogs, appState, appTools,
    setupDialog,
  })

  appDialogs.walletEncrypt = await walletEncryptRig({
    appDialogs, appState, appTools, mainApp,
    wallet, wallets, bodyNav, dashBalance,
    setupDialog,
  })

  appDialogs.walletDecrypt = await walletDecryptRig({
    appDialogs, appState, appTools, mainApp,
    wallets, store,
    importFromJson, decryptKeystore, getUserInfo,
    deriveWalletData, showErrorDialog, setupDialog,
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
    setupDialog, updateAllFunds, batchXkeyAddressGenerate,
    getAddrsTransactions,
    appDialogs, appState, appTools, store, dashsight,
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

  appState.keystore = getStoredWallet()?.keystore

  let ks = appState.keystore
  let ks_phrase = ks?.crypto?.ciphertext || ''
  let ks_iv = ks?.crypto?.cipherparams?.iv || ''
  let ks_salt = ks?.crypto?.kdfparams?.salt || ''

  if (appState.encryptionPassword && appState.keystore) {
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
        appTools.balance?.restate({
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

          showQrCode({
            wallet,
          })

          // let showRequestQR = await appDialogs.requestQr.showModal()
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

          updateAllFunds(wallet)
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

  // contactsList.render({
  //   contacts: appState.contacts,
  //   userInfo,
  // })

  appState.transactions = await loadStoreObject(
    store.transactions,
  )
  appState.integrations = await loadStoreObject(
    store.integrations,
  )

  // console.log('appState.transactions', appState.transactions)

  appState.contacts = await getStoreData(
    store.contacts,
    getTransactionsByContactAlias(appState),
    res => async v => {
      res.push(await appTools.storedData?.decryptData?.(v) || v)
    },
  )
  console.log('appState.contacts', appState.contacts)

  await contactsList.render({
    userInfo,
    contacts: appState.contacts,
  })
  sendRequestBtn.render()

  mainApp.insertAdjacentHTML('afterbegin', html`
    <header></header>
  `)

  import('./components/balance.js')
    .then(async ({ setupBalance }) => {
      appTools.balance = await setupBalance(
        mainApp.querySelector('& > header'),
        {
          wallet,
        }
      )
      appTools.balance.render({
        wallet,
        walletFunds,
      })
    })

  import('./components/crowdnode-card.js')
    .then(async ({ CrowdNodeCard }) => {
      let cnAPI = await appTools.storedData?.decryptItem?.(
        store.integrations,
        'crowdnode',
      )
      let cnEncAPI = await store.integrations.getItem('crowdnode')

      console.log(
        `CrowdNodeCard`,
        { cnAPI, cnEncAPI },
      )

      let cfg = {
        state: {
        },
        events: {
          submit: async event => {
            event.preventDefault()
            event.stopPropagation()

            let fde = formDataEntries(event)

            console.log(
              `Crowdnode Card submit`,
              {event, fde},
            )

            if (fde.intent === 'signup') {
              let confAct = await appDialogs.confirmAction.render({
                name: 'Signup for Crowdnode',
                actionTxt: 'Signup',
                actionAlt: 'Signup for Crowdnode',
                action: '',
                actionType: 'infoo',
                placement: 'center auto-height',
                // status: DIALOG_STATUS.LOADING,
                acceptedToS: false,
                submitIcon: () => ``,
                alert: state => html`
                  <fieldset class="inline">
                    <label class="jc-center gap-2 fs-4">
                      <input name="acceptToS" type="checkbox" required ${
                        state.acceptedToS ? 'checked' : ''
                      } />
                      I accept the CrowdNode <a href="https://crowdnode.io/terms/" target="_blank">Terms and Conditions</a>
                    </label>
                    <p class="jc-center ta-center"><em>This process may take a while, please be patient.</em></p>
                  </fieldset>
                `,
                fields: () => html`
                  <fieldset class="inline">
                    <article class="px-3 col">
                      <span class="ta-left">To stake your Dash and begin earning interest, read and accept the CrowdNode Terms and Conditions.</span>
                      <span class="ta-left">Funds are required to complete the signup process.</span>
                    </article>
                  </fieldset>
                `,
                callback: async (state, fde) => {
                  let shareAccount

                  state.status = DIALOG_STATUS.LOADING

                  if (fde?.acceptToS === 'on') {
                    state.acceptedToS = true
                  }

                  let cbConfAct = await appDialogs.confirmAction.render(state)

                  cnCard.api.value = {
                    ...(cnAPI || {}),
                    acceptedToS: true,
                    balance: 0,
                  }

                  let cnContactExists = await findContactByAlias('crowdnode')

                  if (!cnContactExists) {
                    let generatedContact = await putContact({
                      uri: CROWDNODE.network.main.hotwallet,
                      alias: 'crowdnode',
                      info: {
                        name: 'CrowdNode',
                        preferred_username: 'crowdnode',
                        picture: '/public/icons/CrowdNode.svg',
                      },
                    })

                    appState.contacts = [
                      ...appState.contacts,
                      generatedContact.newContact
                    ]
                    shareAccount = generatedContact.shareAccount
                  } else {
                    let contactAccountIndex = Object.values(cnContactExists.incoming || {})?.[0]?.accountIndex

                    shareAccount = await deriveWalletData(
                      appState.phrase,
                      contactAccountIndex,
                    )

                    console.log('use existing crowdnode contact', cnContactExists, shareAccount)
                  }

                  appTools.storedData?.encryptItem?.(
                    store.integrations,
                    'crowdnode',
                    {
                      ...cnCard.api.value,
                    },
                    false,
                  )

                  let cnActive = (
                    await CrowdNode.http.IsAddressInUse(shareAccount.address)
                  )?.inUse

                  if (cnActive) {
                    let cnBalance = await CrowdNode.http.GetBalance(shareAccount.address)

                    cnCard.api.value = {
                      ...(cnCard.api.value || {}),
                      balance: cnBalance?.TotalBalance || 0,
                      earned: cnBalance?.TotalDividend || 0,
                    }
                  }

                  let cnAddr = await store.addresses.getItem(
                    shareAccount.address
                  )

                  console.log(
                    `CN confirm action`,
                    {state, fde, cbConfAct},
                  )

                  let cnFunding
                  let minimumNeededFunds = 1.1
                  let neededFunds = roundUsing(
                    Math.ceil,
                    minimumNeededFunds - walletFunds.balance,
                    3
                  )

                  if (
                    cnCard.api.value.balance === 0 &&
                    (!cnAddr?.insight?.balance ||
                    cnAddr.insight.balance < minimumNeededFunds)
                  ) {
                    if (
                      walletFunds.balance < minimumNeededFunds
                    ) {
                      cnFunding = await showQrCode({
                        wallet: shareAccount,
                        name: 'CrowdNode Funding',
                        amount: neededFunds,
                        status: DIALOG_STATUS.LOADING,
                        fieldsetHeader: state => html`
                          Send ${neededFunds} Dash or more<br/>
                          to signup & fund your CrowdNode account.
                        `,
                        footer: state => html`
                          <footer class="inline col center" title="CrowdNode requires a small amount of funds to signup and a minimum balance of 1 dash to receive rewards.">
                            See "Active Balance" in <a href="https://crowdnode.io/terms/" target="_blank">CrowdNode Terms and Conditions</a> for more details.
                            <!-- <div class="ta-left" style="max-width:450px;">
                              CrowdNode requires a small amount of funds to signup and a minimum balance of 1 dash to receive rewards.
                            </div> -->
                          </footer>
                        `,
                      })
                    } else {
                      // Show Confirmation Dialog to redistribute
                      // funds to the correct address
                      console.warn(
                        'wallet has sufficient funds but they need to be transferred to correct address to be deposited',
                        { cnAddr, walletFunds }
                      )
                    }
                  }

                  state.status = DIALOG_STATUS.SUCCESS

                  cbConfAct = await appDialogs.confirmAction.render(state)

                  console.log('CN Card Funding Callback', cnCard)

                  appTools.storedData?.encryptItem?.(
                    store.integrations,
                    'crowdnode',
                    {
                      ...cnCard.api.value,
                    },
                    false,
                  )

                  cnCard.render({
                    cfg,
                    el: integrationsSection,
                    position: 'beforeend'
                  })

                  console.log(
                    `confirm action SUCCESS`,
                    {state, fde, cnFunding},
                  )

                  return { state, fde }
                },
              })

              console.log('CN Card confAct Submit Event', cnCard)
              console.log('confAct', confAct, appDialogs.confirmAction)

              confAct?.elements?.form?.classList.add?.('min-h-auto')

              appDialogs.confirmAction.showModal()
            }

            if (fde.intent === 'fund') {
              let minimumNeededFunds = 1.1
              let neededFunds = roundUsing(
                Math.ceil,
                minimumNeededFunds - walletFunds.balance,
                3
              )
              let cnFunding = await showQrCode({
                wallet,
                name: 'CrowdNode Funding',
                amount: neededFunds,
                status: DIALOG_STATUS.LOADING,
                fieldsetHeader: state => html`
                  Send ${neededFunds} Dash or more<br/>
                  to signup & fund your CrowdNode account.
                `,
                footer: state => html`
                  <footer class="inline col center" title="CrowdNode requires a small amount of funds to signup and a minimum balance of 1 dash to receive rewards.">
                    See "Active Balance" in <a href="https://crowdnode.io/terms/" target="_blank">CrowdNode Terms and Conditions</a> for more details.
                    <!-- <div class="ta-left" style="max-width:450px;">
                      CrowdNode requires a small amount of funds to signup and a minimum balance of 1 dash to receive rewards.
                    </div> -->
                  </footer>
                `,
              })

              console.log(
                `confirm action SUCCESS`,
                {fde, cnFunding},
              )
            }

            console.log(
              `Crowdnode Card submit TX`,
              fde.intent,
              {event, fde},
            )

            if (fde.intent === 'deposit') {
              appDialogs.sendOrReceive?.elements?.form?.classList.add?.('min-h-auto')
              await appDialogs.sendOrReceive.render({
                name: 'Deposit to CrowdNode',
                cashSend: () => html``,
                hideAddressee: true,
                action: fde.intent,
                wallet,
                account: appState.account,
                userInfo,
                contacts: appState.contacts,
                to: '@crowdnode',
              })
              appDialogs.sendOrReceive.showModal()
            }

            if (fde.intent === 'withdraw') {
              crowdnodeTransactionRig.markup.fields = html`
                <article class="flex row">
                  <input
                    id="unstakeRange"
                    name="percentRange"
                    type="range"
                    min="0.1"
                    max="100.0"
                    step="0.1"
                    value="1"
                    style="flex:1 1 auto;"
                  />
                  <label
                    class="percent"
                    style="flex:1 1 10rem;"
                  ><input
                    id="unstakePercent"
                    type="number"
                    name="percent"
                    step="0.1"
                    value="1"
                    placeholder="Unstake Percentage (0.1)"
                  /></label>
                </article>
                <em>Enter the percentage you wish to unstake.</em>
              `

              let cnWithdraw = crowdnodeTransactionRig.render({
                el: mainApp,
                cfg: {
                  state: {
                    name: 'Withdraw from CrowdNode',
                    submitTxt: 'Withdraw',
                    submitAlt: 'Withdraw funds from CrowdNode',
                    cancelTxt: 'Cancel',
                    cancelAlt: `Cancel Withdraw`,
                    callback: async (state, res) => {
                      console.log('cnWithdraw callback', { state, res })
                      state.value = {
                        ...state.value,
                        status: DIALOG_STATUS.SUCCESS
                      }
                      return { state, res }
                    },
                  },
                  events: {
                    input: event => {
                      if (
                        event?.target?.type === 'range' &&
                        event.target.value > -1
                      ) {
                        event.target.form.percent.value = event?.target?.value || 0
                      }

                      if (
                        event?.target?.type === 'number' &&
                        event.target.value > -1
                      ) {
                        event.target.form.percentRange.value = event?.target?.value || 0
                      }
                    },
                  },
                },
              })

              cnWithdraw?.elements?.form?.classList.add?.('min-h-auto')

              crowdnodeTransactionRig.markup.footer = html`
                <footer class="inline">
                  <button
                    class="rounded"
                    type="submit"
                    name="intent"
                    value="cancel"
                    title="${crowdnodeTransactionRig.state.value.cancelAlt}"
                  >
                    <span>${crowdnodeTransactionRig.state.value.cancelTxt}</span>
                  </button>
                  <button
                    class="rounded"
                    type="submit"
                    name="intent"
                    value="act"
                    title="${crowdnodeTransactionRig.state.value.submitAlt}"
                  >
                    <span>${crowdnodeTransactionRig.state.value.submitTxt}</span>
                  </button>
                </footer>
              `

              console.log(
                `Crowdnode Card TX`,
                fde.intent,
                {cnWithdraw},
              )

              cnWithdraw.showModal()
            }
          }
        },
        appElement: integrationsSection,
      }

      let cnCard = new CrowdNodeCard(cfg)
      console.log('CN Card Outer', cnCard)

      cnCard.api.value = {
        ...(cnAPI || {}),
      }

      cnCard.render({
        cfg,
        el: integrationsSection,
        position: 'beforeend'
      })
  })

  // integrationsSection.insertAdjacentHTML('beforeend', html`
  //   <section>
  //     <header>
  //       <h5 class="lh-2">Coming soon</h5>
  //       <h4 class="lh-2">Earn interest with</h4>
  //     </header>
  //     <div>
  //       <a href="https://app.crowdnode.io/" target="_blank" rel="noreferrer">
  //         <img src="/public/icons/crowdnode-logo-1000.png" height="50" />
  //       </a>
  //       <a href="https://www.mayascan.org/earn" target="_blank" rel="noreferrer">
  //         <img src="/public/icons/maya-protocol.png" height="50" />
  //       </a>
  //     </div>
  //   </section>
  // `)

  let txs = await getTxs(
    appState,
    Object.values(appState.transactions || {})
  )

  await transactionsList.render({
    userInfo,
    contacts: appState.contacts,
    transactions: Object.values(txs.byTx),
  })

  txs = await getTxs(appState)

  console.log('main getTxs', txs)

  transactionsList.render({
    userInfo,
    contacts: appState.contacts,
    transactions: Object.values(txs.byTx),
  })

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
        callback: async () => {
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
        callback: async () => {
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

        setTimeout(() => {
          updateAllFunds(wallet)
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

            getTxs(appState).then(txs => {
              console.log('socket main getTxs', txs)

              transactionsList.render({
                userInfo,
                contacts: appState.contacts,
                transactions: Object.values(txs.byTx),
              })
            })
          },
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

        setTimeout(() => {
          updateAllFunds(wallet)
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

            getTxs(appState).then(txs => {
              console.log('socket main getTxs', txs)

              transactionsList.render({
                userInfo,
                contacts: appState.contacts,
                transactions: Object.values(txs.byTx),
              })
            })
          },
          1000
        )
      }

      let txs = appState?.sentTransactions
      let txsStartLen = Object.keys(txs).length

      Object.keys(txUpdates).forEach(
        txid => {
          if (txs?.[txid]) {
            delete txs[txid]
          }
        }
      )

      if (txsStartLen > Object.keys(txs).length) {
        appState.sentTransactions = txs
      }
    },
  })
}

main()
