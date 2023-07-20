import { lit as html } from './helpers/lit.js'

import {
  generateRecoveryPhrase,
  formDataEntries,
  phraseToEl,
  setClipboard,
} from './helpers/utils.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupDialog from './components/dialog.js'
import setupSVGSprite from './components/svg-sprite.js'

let phrase

let phraseRegex = new RegExp(
  /^([a-zA-Z]+\s){11,}([a-zA-Z]+)$/
)
let aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{2,}$/
)


let bodyNav = await setupNav(
  document.querySelector('main#app'),
  {}
)

let mainFtr = await setupMainFooter(
  document.querySelector('main#app'),
  {}
)

let svgSprite = await setupSVGSprite(
  document.querySelector('main#app'),
  {}
)

let walletBak = setupDialog(
  document.querySelector('main#app'),
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
  document.querySelector('main#app'),
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
          'afterend',
          {
            wallet,
          }
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
  document.querySelector('main#app'),
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
  document.querySelector('main#app'),
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

async function main() {
  phrase = JSON.parse(
    localStorage?.dashRecoveryPhrase ||
    '""'
  )
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
  }

  bodyNav.render()
  mainFtr.render()
  svgSprite.render()

  console.log('init', { phrase: phrase.split(' ')?.length })
}

main()
