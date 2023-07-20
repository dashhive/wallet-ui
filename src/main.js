import { lit as html } from './helpers/lit.js'

import {
  generateRecoveryPhrase,
  formDataEntries,
  phraseToEl,
  setClipboard,
} from './helpers/utils.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupSVGSprite from './components/svg-sprite.js'
import setupDialog from './components/dialog.js'
import setupInputAmount from './components/input-amount.js'

let alias
let phrase
let wallet

let phraseRegex = new RegExp(
  /^([a-zA-Z]+\s){11,}([a-zA-Z]+)$/
)
let aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{2,}$/
)

let mainApp = document.querySelector('main#app')


let mainFtr = await setupMainFooter(
  mainApp,
  {}
)

let svgSprite = await setupSVGSprite(
  mainApp,
  {}
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
      handleClose: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('BACKUP CLOSE OVERRIDE!', state, event)
        walletBak.close()
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('BACKUP OVERRIDE!', state, event)

        let fde = formDataEntries(event)

        walletBak.close()
        onboard.close()

        console.log(
          'BACKUP OVERRIDE DIALOG!',
          [fde]
        )
      },
      handleClick: state => async event => {
        if (event.target?.classList?.contains('copy')) {
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
        <label for="alias">
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
      handleClose: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('GENERATE CLOSE OVERRIDE!', state, event)
        // walletGen.render()
        // walletGen.showModal()
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('GENERATE OVERRIDE!', state, event)

        let fde = formDataEntries(event)

        if (!fde.alias) {
          event.target.alias.setCustomValidity(
            'An alias is required'
          )
          event.target.alias.reportValidity()
          return;
        }

        // let wallet = { recoveryPhrase: 'aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll' }
        let wallet = await generateRecoveryPhrase()

        console.log('GENERATE wallet!', wallet)

        phrase = wallet.recoveryPhrase
        localStorage.dashRecoveryPhrase = JSON.stringify(phrase)
        localStorage.dashAlias = JSON.stringify(fde.alias)

        walletBak.render(
          {
            wallet,
          },
          'afterend',
        )
        walletBak.showModal()

        walletGen.close()

        // if (fde?.intent === 'generate') {
        //   walletGen.render()
        //   walletGen.showModal()
        // } else if (fde?.intent === 'import') {
        //   walletImp.render()
        //   walletImp.showModal()
        // }

        console.log(
          'GENERATE OVERRIDE DIALOG!',
          [fde]
        )
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
            name="phrase"
            placeholder="zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"
            pattern="${phraseRegex.source}"
            required
            spellcheck="false"
          />
          <label title="Show/Hide Phrase">
            <input name="show_pass" type="checkbox" />
            <!-- <i class="icon-eye-closed"></i> -->
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
        <label for="alias">
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
      handleClose: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('IMPORT CLOSE OVERRIDE!', state, event)
        walletImp.close()
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('IMPORT OVERRIDE!', state, event)

        let fde = formDataEntries(event)

        console.log('IMPORT FDE', fde)

        if (!fde.phrase) {
          event.target.phrase.setCustomValidity(
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

        let wallet = await generateRecoveryPhrase(fde.phrase)

        console.log('IMPORT wallet!', wallet)

        phrase = wallet.recoveryPhrase
        localStorage.dashRecoveryPhrase = JSON.stringify(phrase)
        localStorage.dashAlias = JSON.stringify(fde.alias)

        walletImp.close()
        onboard.close()

        console.log(
          'IMPORT OVERRIDE DIALOG!',
          [fde]
        )
      },
    },
  }
)

let onboard = setupDialog(
  mainApp,
  {
    name: 'Onboarding Flow',
    placement: 'fullscreen',
    // elements: {
    //   dialog: document.querySelector('dialog'),
    // },
    events: {
      handleClose: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('ONBOARDING CLOSE OVERRIDE!', state, event)
        // walletGen.render()
        // walletGen.showModal()
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('ONBOARDING OVERRIDE!', state, event)

        let fde = formDataEntries(event)

        if (fde?.intent === 'generate') {
          walletGen.render()
          walletGen.showModal()
        } else if (fde?.intent === 'import') {
          walletImp.render()
          walletImp.showModal()
        }

        console.log(
          'ONBOARDING OVERRIDE DIALOG!',
          [fde.intent]
        )
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

let inputAmount = setupInputAmount(
  mainApp,
  {
    // name: 'Send or Request',
    // sendTxt: 'Send',
    // sendAlt: 'Send Dash',
    // requestTxt: 'Request',
    // requestAlt: 'Request Dash',
    // cancelTxt: 'Cancel',
    // cancelAlt: `Cancel Form`,
    // closeTxt: html`<i class="icon-x"></i>`,
    // closeAlt: `Close`,
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
      handleClose: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('SEND OR REQUEST CLOSE OVERRIDE!', state, event)
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        event.target.to.setCustomValidity(
          ''
        )
        event.target.to.reportValidity()

        let fde = formDataEntries(event)

        console.log('SEND OR REQUEST OVERRIDE!', state, event, fde)

        if (fde.intent === 'send' && !fde.to) {
          event.target.to.setCustomValidity(
            'You must specify a contact or address to send to'
          )
          event.target.to.reportValidity()
          return;
        }

        sendOrRequest.close()

        console.log(
          'SEND OR REQUEST OVERRIDE DIALOG!',
          [fde]
        )
      },
    },
  }
)





async function main() {
  alias = JSON.parse(
    localStorage?.dashAlias ||
    '""'
  )
  phrase = JSON.parse(
    localStorage?.dashRecoveryPhrase ||
    '""'
  )

  // document.querySelector('main#app')
  //   .insertAdjacentElement('afterend', onbrdEl)
  // walletGen.render()
  onboard.render()

  if (!phrase) {
    // walletGen.show()
    onboard.show()

    // for animation
    // setTimeout(t => {
    //   onboardingDialog.showModal()
    // }, 50)
  } else {
    wallet = await generateRecoveryPhrase(phrase)
  }

  let bodyNav = await setupNav(
    mainApp,
    {
      data: {
        alias
      },
    }
  )

  bodyNav.render()
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
      let dashBalance = await setupBalance(
        mainApp.querySelector('& > header'),
        {
          wallet,
          // addr: wallet?.address,
        }
      )
      dashBalance.render()
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

      let fde = formDataEntries(event)

      console.log(
        'global form submit',
        formName,
        form,
        fde,
        // parentElement,
      )

      sendOrRequest.render()
      sendOrRequest.showModal()
    }
  })
  document.addEventListener('change', async event => {
    // @ts-ignore
    let { name: fieldName, parentElement, form } = event?.target
    // let output

    if (
      fieldName === 'show_pass'
    ) {
      event.stopPropagation()
      event.preventDefault()

      let { phrase, show_pass, } = form

      if (show_pass?.checked) {
        phrase.type = 'text'
      } else {
        phrase.type = 'password'
      }
    }
  })

  console.log('init', {
    phrase: phrase.split(' ')?.length,
    wallet,
  })
}

main()
