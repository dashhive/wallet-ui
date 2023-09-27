import { lit as html } from './helpers/lit.js'

import {
  deriveWalletData,
  formDataEntries,
  setClipboard,
  phraseToEl,
  envoy,
} from './helpers/utils.js'

import {
  batchAddressGenerate,
  updateAllFunds,
  decryptWallet,
  initWallet,
  loadWalletsForAlias,
  store,
} from './helpers/wallet.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupSVGSprite from './components/svg-sprite.js'
import setupDialog from './components/dialog.js'
import setupInputAmount from './components/input-amount.js'

// form validation
const phraseRegex = new RegExp(
  /^([a-zA-Z]+\s){11,}([a-zA-Z]+)$/
)
const aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
)

// data/state
let encryptionPassword
let selected_wallet
let selected_alias
let wallets
let wallet
let phrase

// element
let bodyNav
let dashBalance
let mainApp = document.querySelector('main#app')

// init components
let mainFtr = await setupMainFooter(
  mainApp,
  {}
)
let svgSprite = await setupSVGSprite(
  mainApp,
  {}
)
let inputAmount = setupInputAmount(
  mainApp,
  {}
)

let walletEncrypt = setupDialog(
  mainApp,
  {
    name: 'Encrypt Wallet',
    submitTxt: 'Encrypt',
    submitAlt: 'Encrypt Wallet',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel Form`,
    closeTxt: html`<i class="icon-x"></i>`,
    closeAlt: `Close`,
    footer: state => html`
      <footer class="inline col">
        <sup>Encrypt sensitive wallet data stored in the browser.</sup>
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
        <label for="encryptionPassword">
          Encryption Password
        </label>
        <div>
          <input
            type="password"
            id="encryptionPassword"
            name="pass"
            placeholder="superS3cr3t"
            minlength="1"
            required
            spellcheck="false"
          />
          <label title="Show/Hide Password">
            <input name="show_pass" type="checkbox" />
            <svg class="open-eye" width="24" height="24" viewBox="0 0 32 32">
              <use xlink:href="#icon-eye-open"></use>
            </svg>
            <svg class="closed-eye" width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-eye-closed"></use>
            </svg>
          </label>
        </div>
        <div class="py-3 px-3">
          <label for="rememberPass" class="jc-left">
            <sub>
              Remember password for browser session
            </sub>
          </label>
          <input
            id="rememberPass"
            name="remember"
            type="checkbox"
          />
          <label for="rememberPass" class="switch" title="Remember for session"></label>
        </div>

        <div class="error"></div>
      </fieldset>

      ${state.footer(state)}
    `,
    fields: html``,
    events: {
      handleClose: (
        state,
        resolve = res=>{},
        reject = res=>{},
      ) => async event => {
        event.preventDefault()
        // console.log(
        //   'handle dialog close',
        //   event,
        //   event.target === state.elements.dialog,
        //   state.elements.dialog.returnValue
        // )

        if (state.elements.dialog.returnValue !== 'cancel') {
          resolve(state.elements.dialog.returnValue)
        } else {
          reject()
        }
        // console.log('ENCRYPT CLOSE OVERRIDE!', state, event)

        setTimeout(t => {
          event?.target?.remove()
        }, state.delay)
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()

        event.target.pass.setCustomValidity('')
        event.target.pass.reportValidity()

        // console.log('ENCRYPT OVERRIDE!', state, event)

        let fde = formDataEntries(event)

        if (!fde.pass) {
          event.target.pass.setCustomValidity(
            'An encryption password is required'
          )
          event.target.reportValidity()
          return;
        }

        let initialized
        wallet = state.wallet

        // console.log(
        //   'walletEncrypt state.wallet',
        //   wallet,
        //   state,
        //   fde
        // )

        phrase = wallet.recoveryPhrase
        encryptionPassword = fde.pass

        if (fde.remember) {
          sessionStorage.encryptionPassword = window.btoa(String(encryptionPassword))
        }

        if (!wallets?.[selected_alias]) {
          initialized = await initWallet(
            fde.pass,
            wallet,
            0,
            0,
            {
              preferred_username: selected_alias,
            }
          )
          wallets = initialized.wallets
        }

        // console.log('ENCRYPT wallet!', wallet, selected_alias)

        bodyNav?.render({
          data: {
            alias: selected_alias
          },
        })
        dashBalance?.render({
          wallet,
        })

        onboard?.close()
        walletEncrypt.close()
      },
    },
  }
)

let walletBak = setupDialog(
  mainApp,
  {
    name: 'New Wallet',
    submitTxt: 'Done',
    submitAlt: 'Done',
    cancelTxt: 'Cancel',
    cancelAlt: `Cancel`,
    closeTxt: html`<i class="icon-x"></i>`,
    closeAlt: `Close`,
    footer: state => html`
      <footer class="inline col">
        <sub class="ta-left">
          <i class="icon-warning-circle"></i>
          IMPORTANT
        </sub>
        <sup class="ta-left">Do not lose your recovery phrase. We recommend you write it down or print it out and keep it somewhere safe. THERE ARE NO BACKUPS</sup>
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

        walletEncrypt.render(
          {
            wallet,
          },
          'afterend',
        )
        await walletEncrypt.showModal()

        walletBak.close()
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
    closeTxt: html`<i class="icon-x"></i>`,
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
            pattern="${aliasRegex.source}"
            required
            spellcheck="false"
          />
        </div>

        <div class="error"></div>
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

        phrase = wallet.recoveryPhrase
        selected_wallet = wallet.id
        selected_alias = `${fde.alias}`

        localStorage.selected_wallet = selected_wallet
        localStorage.selected_alias = selected_alias

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
    closeTxt: html`<i class="icon-x"></i>`,
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
        <label for="phrase">
          Recovery Phrase
        </label>
        <div>
          <input
            type="password"
            id="phrase"
            name="pass"
            placeholder="zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"
            pattern="${phraseRegex.source}"
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
      </fieldset>

      <fieldset>
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
            pattern="${aliasRegex.source}"
            required
            spellcheck="false"
          />
        </div>
        <p>Name the wallet (similar to a username), shared when connecting with a contact.</p>

        <div class="error"></div>
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

        phrase = `${fde.pass}`

        wallet = await deriveWalletData(phrase)

        selected_alias = `${fde.alias}`
        selected_wallet = wallet.id

        localStorage.selected_wallet = selected_wallet
        localStorage.selected_alias = selected_alias

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
    closeTxt: html`<i class="icon-x"></i>`,
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
        <label for="to">
          To
        </label>
        <div>
          <input
            type="text"
            id="${state.slugs.form}_to"
            name="to"
            placeholder="enter @alias or dash address"
            spellcheck="false"
          />
        </div>

        ${inputAmount.renderAsHTML()}

        <div class="error"></div>
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

        if (fde.intent === 'send' && !fde.to) {
          event.target.to.setCustomValidity(
            'You must specify a contact or address to send to'
          )
          event.target.to.reportValidity()
          return;
        }

        sendOrRequest.close(fde.intent)
      },
    },
  }
)



async function main() {
  encryptionPassword = window.atob(
    sessionStorage.encryptionPassword || ''
  )
  selected_wallet = localStorage?.selected_wallet || ''
  selected_alias = localStorage?.selected_alias || ''

  svgSprite.render()

  bodyNav = await setupNav(
    mainApp,
    {
      data: {
        alias: selected_alias
      },
    }
  )

  let aliasWallets = await loadWalletsForAlias(selected_alias)
  wallets = aliasWallets?.$wallets

  console.log(
    'load wallet alias',
    aliasWallets
  )

  document.addEventListener('submit', async event => {
    let {
      // @ts-ignore
      name: formName, parentElement, form,
    } = event?.target

    if (formName === 'send_or_request') {
      event.preventDefault()
      event.stopPropagation()

      sendOrRequest.render()
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

  let ks_phrase = wallets?.[selected_wallet]
    ?.keystore?.crypto?.ciphertext || ''
  let ks_iv = wallets?.[selected_wallet]
    ?.keystore?.crypto?.cipherparams?.iv || ''
  let ks_salt = wallets?.[selected_wallet]
    ?.keystore?.crypto?.kdfparams?.salt || ''

  if (encryptionPassword) {
    try {
      phrase = await decryptWallet(
        encryptionPassword,
        ks_iv,
        ks_salt,
        ks_phrase
      )
    } catch(err) {
      console.error('[fail] unable to decrypt recovery phrase', err)
      sessionStorage.removeItem('encryptionPassword')
    }
  }

  if (
    !phrase &&
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

            phrase = decryptedRecoveryPhrase
            encryptionPassword = fde.pass

            if (fde.remember) {
              sessionStorage.encryptionPassword = window.btoa(String(encryptionPassword))
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

  if (!phrase) {
    onboard.render()
    await onboard.show()
  } else {
    wallet = await deriveWalletData(phrase)

    if (store.addresses.length() === 0) {
      let accountIndex = wallets?.[selected_wallet]
        ?.accountIndex || 0
      let addressIndex = 0
      let acctBatch = accountIndex + 5
      let accts = {}

      for (;accountIndex < acctBatch;accountIndex++) {
        accts[`bat__${accountIndex}`] = await batchAddressGenerate(
          wallet,
          accountIndex,
          addressIndex,
          0,
          20
        )
      }
    }
  }

  bodyNav.render({
    data: {
      alias: selected_alias
    },
  })
  mainFtr.render()

  mainApp.insertAdjacentHTML('afterbegin', html`
    <form name="send_or_request" class="inline row">
      <button
        class="rounded outline"
        type="submit"
        name="intent"
        value="send"
        title="Send"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <use xlink:href="#icon-arrow-circle-up"></use>
        </svg>
        <span>
          Send
        </span>
      </button>
      <button
        class="rounded outline"
        type="submit"
        name="intent"
        value="request"
        title="Request"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <use xlink:href="#icon-arrow-circle-down"></use>
        </svg>
        <span>
          Request
        </span>
      </button>
    </form>
  `)
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
}

main()
