import { lit as html } from './helpers/lit.js'

import {
  deriveWalletData,
  formDataEntries,
  setClipboard,
  phraseToEl,
  envoy,
  sortContactsByAlias,
  loadStore,
  // sortContactsByName,
} from './helpers/utils.js'

import {
  OIDC_CLAIMS,
  ALIAS_REGEX,
  PHRASE_REGEX,
} from './helpers/constants.js'

import {
  batchAddressGenerate,
  updateAllFunds,
  decryptWallet,
  // initWallet,
  loadWalletsForAlias,
  store,
} from './helpers/wallet.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupSendRequestBtns from './components/send-request-btns.js'
import setupContactsList from './components/contacts-list.js'
import setupSVGSprite from './components/svg-sprite.js'
import setupDialog from './components/dialog.js'
import setupInputAmount from './components/input-amount.js'

import walletEncryptRig from './rigs/wallet-encrypt.js'
import addContactRig from './rigs/add-contact.js'
import editProfileRig from './rigs/edit-profile.js'
import scanContactRig from './rigs/scan.js'

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

// element
let bodyNav
let dashBalance
let mainApp = document.querySelector('main#app')

// rigs
let walletEncrypt
let addContact
let editProfile
let scanContact

// init components
let mainFtr = await setupMainFooter(
  mainApp,
  {}
)
let sendRequestBtn = await setupSendRequestBtns(
  mainApp,
  {}
)
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

          addContact.render(
            {
              wallet: shareAccount,
              contact: newContact,
              userInfo,
            },
            'afterend',
          )
          addContact.showModal()
        }
      },
    },
  }
)
let svgSprite = await setupSVGSprite(
  mainApp,
  {}
)
let inputAmount = setupInputAmount(
  mainApp,
  {}
)


let walletBak = setupDialog(
  mainApp,
  {
    name: 'New Wallet',
    submitTxt: 'I backed up this Recovery Phrase',
    submitAlt: 'Confirm Recovery Phrase backup',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel`,
    closeTxt: html``,
    closeAlt: ``,
    footer: state => html`
      <footer class="inline col">
        <sub class="ta-left">
          <i class="icon-warning-circle"></i>
          IMPORTANT
        </sub>
        <sup class="ta-left">Do not lose this recovery phrase. We recommend you write it down or print it out and keep it somewhere safe. THERE ARE NO OTHER BACKUPS.</sup>
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="backup_wallet"
          title="${state.submitAlt}"
        >
          <span>${state.submitTxt}</span>
        </button>
      </footer>
    `,
    content: state => html`
      ${state.header(state)}

      <fieldset>
        <article>
          <label for="phrase">
            Recovery Phrase
          </label>

          <section>
            <article>
              <div
                class="ta-left"
                spellcheck="false"
              >
                ${phraseToEl(
                  state.wallet?.recoveryPhrase
                )}
              </div>
              <button id="phrase" class="pill rounded copy" title="Copy Recovery Phrase">
                <i class="icon-copy"></i>
                Copy
              </button>
            </article>
          </section>
        </article>
      </fieldset>

      ${state.footer(state)}
    `,
    fields: html``,
    events: {
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()

        let { wallet } = state

        let fde = formDataEntries(event)

        walletBak.close()

        walletEncrypt.render(
          {
            wallet,
          },
          'afterend',
        )
        await walletEncrypt.showModal()
      },
      handleClick: state => async event => {
        if (
          event.target?.classList?.contains('copy') ||
          event.target?.classList?.contains('icon-copy')
        ) {
          event.preventDefault()
          event.stopPropagation()
          setClipboard(event)
        }
      }
    },
  }
)

let walletGen = setupDialog(
  mainApp,
  {
    name: 'New Wallet',
    submitTxt: 'Next',
    submitAlt: 'Next Form',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel Form`,
    closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
    <use xlink:href="#icon-x"></use>
  </svg>`,
    closeAlt: `Close`,
    footer: state => html`
      <footer class="inline col">
        <sup>Hit next to generate a new wallet and recovery phrase.</sup>
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="new_wallet"
          title="${state.submitAlt}"
        >
          <span>${state.submitTxt}</span>
        </button>
      </footer>
    `,
    content: state => html`
      ${state.header(state)}

      <fieldset>
        <article>
          <label for="${state.slugs.form}_alias">
            Alias
          </label>
          <div
            data-prefix="@"
          >
            <input
              type="text"
              id="${state.slugs.form}_alias"
              name="alias"
              placeholder="your_alias"
              pattern="${ALIAS_REGEX.source}"
              required
              spellcheck="false"
            />
          </div>

          <div class="error"></div>
        </article>
      </fieldset>

      ${state.footer(state)}
    `,
    fields: html``,
    events: {
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()

        let fde = formDataEntries(event)

        if (!fde.alias) {
          event.target.alias.setCustomValidity(
            'An alias is required'
          )
          event.target.alias.reportValidity()
          return;
        }

        wallet = await deriveWalletData()

        appState.phrase = wallet.recoveryPhrase
        appState.selectedWallet = wallet.id
        appState.selectedAlias = `${fde.alias}`

        localStorage.selectedWallet = appState.selectedWallet
        localStorage.selectedAlias = appState.selectedAlias

        // console.log('GENERATE wallet!', wallet)

        walletBak.render(
          {
            wallet,
          },
          'afterend',
        )
        walletBak.showModal()

        walletGen.close()
      },
    },
  }
)

let walletImp = setupDialog(
  mainApp,
  {
    name: 'Existing Wallet',
    submitTxt: 'Add Wallet',
    submitAlt: 'Import Existing Wallet',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel Wallet Import`,
    closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
    <use xlink:href="#icon-x"></use>
  </svg>`,
    closeAlt: `Close`,
    footer: state => html`
      <footer class="inline">
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="request"
          title="${state.submitAlt}"
        >
          <span>${state.submitTxt}</span>
        </button>
      </footer>
    `,
    content: state => html`
      ${state.header(state)}

      <fieldset>
        <article>
          <label for="phrase">
            Recovery Phrase
          </label>
          <div class="password">
            <input
              type="password"
              id="phrase"
              name="pass"
              placeholder="zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"
              pattern="${PHRASE_REGEX.source}"
              required
              spellcheck="false"
            />
            <label title="Show/Hide Phrase">
              <input name="show_pass" type="checkbox" />
              <svg class="open-eye" width="24" height="24" viewBox="0 0 32 32">
                <use xlink:href="#icon-eye-open"></use>
              </svg>
              <svg class="closed-eye" width="24" height="24" viewBox="0 0 24 24">
                <use xlink:href="#icon-eye-closed"></use>
              </svg>
            </label>
          </div>
          <p>Import an existing wallet by pasting a 12 word recovery phrase.</p>

          <div class="error"></div>
        </article>
        <article>
          <label for="${state.slugs.form}_alias">
            Alias
          </label>
          <div
            data-prefix="@"
          >
            <input
              type="text"
              id="${state.slugs.form}_alias"
              name="alias"
              placeholder="your_alias"
              pattern="${ALIAS_REGEX.source}"
              required
              spellcheck="false"
            />
          </div>
          <p>Name the wallet (similar to a username), shared when connecting with a contact.</p>

          <div class="error"></div>
        </article>
      </fieldset>

      ${state.footer(state)}
    `,
    fields: html``,
    events: {
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()

        let fde = formDataEntries(event)

        if (!fde.pass) {
          event.target.pass.setCustomValidity(
            'A recovery phrase is required'
          )
          event.target.reportValidity()
          return;
        }
        if (!fde.alias) {
          event.target.alias.setCustomValidity(
            'An alias is required'
          )
          event.target.reportValidity()
          return;
        }

        appState.phrase = `${fde.pass}`

        wallet = await deriveWalletData(appState.phrase)

        appState.selectedAlias = `${fde.alias}`
        appState.selectedWallet = wallet.id

        localStorage.selectedWallet = appState.selectedWallet
        localStorage.selectedAlias = appState.selectedAlias

        // console.log('IMPORT wallet!', wallet)

        walletImp.close()

        walletEncrypt.render(
          {
            wallet,
          },
          'afterend',
        )
        await walletEncrypt.showModal()
      },
    },
  }
)

let onboard = setupDialog(
  mainApp,
  {
    name: 'Onboarding Flow',
    placement: 'fullscreen',
    events: {
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()

        let fde = formDataEntries(event)

        if (fde?.intent === 'generate') {
          walletGen.render()
          walletGen.showModal()
        } else if (fde?.intent === 'import') {
          walletImp.render()
          walletImp.showModal()
        }
      },
    },
    header: () => ``,
    footer: () => ``,
    content: state => html`
      <a class="brand" href="#home">
        <svg viewBox="0 0 101 32">
          <use xlink:href="#icon-logo"></use>
        </svg>
        <span class="pill">Incubator</span>
      </a>
      <section>
        <aside>
          <h2>Welcome to the new Dash Wallet</h2>
          <p>The easiest way to send, receive and save your Dash.</p>
        </aside>
        <article>
          <div>
            <h3>Generate a New Wallet</h3>
            <p>This option will give you a brand new wallet and recovery phrase.</p>

            <button
              class="rounded"
              type="submit"
              title="Generate a New Wallet"
              name="intent"
              value="generate"
            >
              <span>Generate a New Wallet</span>
            </button>

            <div class="error"></div>
          </div>
          <hr />
          <div>
            <h3>Add an Existing Wallet</h3>
            <p>Already have a Dash wallet? Click below to add it using your recovery phrase.</p>

            <button
              class="rounded"
              type="submit"
              title="Add an Existing Wallet"
              name="intent"
              value="import"
            >
              <span>Add an Existing Wallet</span>
            </button>

            <div class="error"></div>
          </div>
        </article>
      </section>
    `
  }
)

let sendOrRequest = setupDialog(
  mainApp,
  {
    name: 'Send or Request',
    sendTxt: 'Send',
    sendAlt: 'Send Dash',
    requestTxt: 'Request',
    requestAlt: 'Request Dash',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel Form`,
    closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
    <use xlink:href="#icon-x"></use>
  </svg>`,
    closeAlt: `Close`,
    footer: state => html`
      <footer class="inline row">
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="send"
          title="${state.sendAlt}"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use xlink:href="#icon-arrow-circle-up"></use>
          </svg>
          <span>${state.sendTxt}</span>
        </button>
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="request"
          title="${state.requestAlt}"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <use xlink:href="#icon-arrow-circle-down"></use>
          </svg>
          <span>${state.requestTxt}</span>
        </button>
      </footer>
    `,
    content: state => html`
      ${state.header(state)}

      <fieldset>
        <article>
          <!-- <label for="to">
            To
          </label> -->
          <div>
            <input
              type="text"
              id="${state.slugs.form}_to"
              name="to"
              placeholder="enter @alias or dash address"
              spellcheck="false"
              list="contactAliases"
            />

            <button
              class="rounded outline"
              type="submit"
              name="intent"
              value="scan_new_contact"
              title="${state.scanAlt}"
            >
              <span>
                <svg class="qr-code" width="24" height="24" viewBox="0 0 24 24">
                  <use xlink:href="#icon-qr-code"></use>
                </svg>
              </span>
            </button>

            <datalist id="contactAliases">
              ${
                (state.contacts || []).map(contact => {
                  return html`<option value="@${contact.alias}">${contact.info?.name || contact.alias}</option>`
                })
              }
            </datalist>
          </div>

          ${inputAmount.renderAsHTML()}

          <div class="error"></div>
        </article>
      </fieldset>

      ${state.footer(state)}
    `,
    events: {
      handleClose: (
        state,
        resolve = res=>{},
        reject = res=>{},
      ) => async event => {
        event.preventDefault()
        // event.stopPropagation()
        state.removeAllListeners()

        if (state.elements.dialog.returnValue !== 'cancel') {
          resolve(state.elements.dialog.returnValue)
        } else {
          resolve('cancel')
        }
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        event.target.to.setCustomValidity(
          ''
        )
        event.target.to.reportValidity()

        let fde = formDataEntries(event)

        if (fde?.intent === 'scan_new_contact') {
          scanContact.render(
            {
              wallet,
            },
            'afterend',
          )

          let showScan = await scanContact.showModal()
          console.log(
            'showScan',
            showScan,
            // scanContact,
            // scanContact?.element?.returnValue
          )
          let [, addr] = showScan?.split('dash://')
          if (addr) {
            // event.target.addr.value = addr
            event.target.to.value = showScan
          }
          return;
        }

        if (fde.intent === 'send' && !fde.to) {
          event.target.to.setCustomValidity(
            'You must specify a contact or address to send to'
          )
          event.target.to.reportValidity()
          return;
        }

        if (String(fde.to).startsWith('@')) {
          let cAlias = String(fde.to).substring(1)
          let contact = state.contacts.find(c => c.alias === cAlias)
          let inWallet = Object.values(contact?.incoming)?.[0]
          let outWallet = Object.values(contact?.outgoing)?.[0]

          if (fde.intent === 'send') {
            let {
              xkeyId,
              addressKeyId,
              addressIndex,
              address: addr,
            } = await deriveWalletData(
              outWallet?.xpub,
              0,
              outWallet?.addressIndex + 1,
            )

            console.log(
              `${fde.intent} TO CONTACT`,
              contact,
              {
                xkeyId: outWallet?.xkeyId,
                addressKeyId: outWallet?.addressKeyId,
                addressIndex: outWallet?.addressIndex,
                address: outWallet?.address,
              },
              {
                xkeyId,
                addressKeyId,
                addressIndex,
                address: addr,
              },
            )
          }
          if (fde.intent === 'request') {
            let {
              xkeyId,
              addressKeyId,
              addressIndex,
              address: addr,
            } = await deriveWalletData(
              inWallet?.xpub,
              0,
              inWallet?.addressIndex + 1,
            )

            console.log(
              `${fde.intent} TO CONTACT`,
              contact,
              {
                xkeyId: inWallet?.xkeyId,
                addressKeyId: inWallet?.addressKeyId,
                addressIndex: inWallet?.addressIndex,
                address: inWallet?.address,
              },
              {
                xkeyId,
                addressKeyId,
                addressIndex,
                address: addr,
              },
            )
          }

          return;
        }

        sendOrRequest.close(fde.intent)
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

  walletEncrypt = walletEncryptRig({
    mainApp, setupDialog, appState,
    bodyNav, dashBalance, onboard,
    wallet, wallets,
  })

  scanContact = scanContactRig({
    mainApp, setupDialog, appState,
  })

  addContact = addContactRig({
    mainApp, setupDialog, appState,
    wallet, wallets, userInfo,
    scanContact, contactsList, store,
  })

  editProfile = editProfileRig({
    mainApp, setupDialog, appState,
    wallet, wallets, store,
    bodyNav, userInfo,
  })

  svgSprite.render()

  console.log(
    'load wallet alias',
    userInfo
  )

  document.addEventListener('submit', async event => {
    let {
      // @ts-ignore
      name: formName, parentElement, form,
    } = event?.target

    if (formName === 'send_or_request') {
      event.preventDefault()
      event.stopPropagation()

      sendOrRequest.render({
        userInfo,
        contacts: appState.contacts
      })
      sendOrRequest.showModal()
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

    walletEncrypt.render(
      {
        wallet,

        name: 'Decrypt Wallet',
        submitTxt: 'Decrypt',
        submitAlt: 'Decrypt Wallet',
        events: {
          handleSubmit: state => async event => {
            event.preventDefault()
            event.stopPropagation()

            let decryptedRecoveryPhrase
            let fde = formDataEntries(event)

            if (!fde.pass) {
              event.target.pass.setCustomValidity(
                'A decryption password is required'
              )
              event.target.reportValidity()
              return;
            }

            try {
              decryptedRecoveryPhrase = await decryptWallet(
                fde.pass,
                ks_iv,
                ks_salt,
                ks_phrase
              )
            } catch(err) {
              console.error('[fail] unable to decrypt recovery phrase', err)
              event.target.pass.setCustomValidity(
                'Unable to decrypt recovery phrase. Did you type the correct encryption password?'
              )
              event.target.reportValidity()
              return;
            }

            appState.phrase = decryptedRecoveryPhrase
            appState.encryptionPassword = fde.pass

            await getUserInfo()

            if (fde.remember) {
              sessionStorage.encryptionPassword = window.btoa(String(appState.encryptionPassword))
            }

            walletEncrypt.close()
          },
        }
      },
      'afterend',
    )
    await walletEncrypt.showModal()
  }

  let walletFunds = envoy(
    {
      balance: 0
    },
    (state, oldState) => {
      if (state.balance !== oldState.balance) {
        // console.warn(
        //   'addrFunds change',
        //   {
        //     state,
        //     oldState,
        //     walletFunds: state.balance
        //   }
        // )
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
    onboard.render()
    await onboard.show()
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
      console.log(
        'loadStore store.contacts',
        res,
      )
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
      id, parentElement,
    } = event?.target

    if (id === 'nav-alias') {
      event.preventDefault()
      event.stopPropagation()

      console.log(
        'nav alias click',
        event,
        [event?.target],
      )

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

      editProfile.render(
        {
          wallet: shareAccount,
          userInfo,
        },
        'afterend',
      )

      editProfile.showModal()
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
      // console.warn(
      //   'LOAD ASYNC setupBalance',
      //   dashBalance
      // )
      dashBalance.render({
        wallet,
        walletFunds: {
          balance: walletFunds?.balance || 0
        }
      })
    })

  // console.log('init', {
  //   phrase: phrase?.split(' ')?.length,
  //   wallet,
  // })

  updateAllFunds(wallet)
    .then(funds => {
      // console.log('updateAllFunds', funds)

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
