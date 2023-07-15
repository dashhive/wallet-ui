import { lit as html } from './helpers/lit.js'

import { generateRecoveryPhrase } from './helpers/utils.js'

import setupNav from './components/nav.js'
import setupMainFooter from './components/main-footer.js'
import setupDialog from './components/dialog.js'

let bodyNav = await setupNav(
  document.querySelector('main#app'),
  {}
)

let mainFtr = await setupMainFooter(
  document.querySelector('main#app'),
  {}
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
        <label for="thing">
          Thing
        </label>
        <input
          type="text"
          id="thing"
          name="thing"
          placeholder="Do Something"
          minlength="1"
          spellcheck="false"
        />
        <p>Some instructions</p>

        <div class="error"></div>
      </fieldset>

      <fieldset>
        <label for="thing">
          Thing
        </label>
        <input
          type="text"
          id="thing"
          name="thing"
          placeholder="Do Something"
          minlength="1"
          spellcheck="false"
        />
        <p>Some instructions</p>

        <div class="error"></div>
      </fieldset>

      ${state.footer(state)}
    `,
    fields: html`
      <label for="thing">
        Thing
      </label>
      <input
        type="text"
        id="thing"
        name="thing"
        placeholder="Do Something"
        minlength="1"
        spellcheck="false"
      />
      <p>Some instructions</p>

      <label for="thing">
        Thing
      </label>
      <input
        type="text"
        id="thing"
        name="thing"
        placeholder="Do Something"
        minlength="1"
        spellcheck="false"
      />
      <p>Some instructions</p>
    `,
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
        console.log('CLOSE OVERRIDE!', state, event)
        // walletGen.render()
        // walletGen.showModal()
      },
      handleSubmit: state => async event => {
        event.preventDefault()
        event.stopPropagation()
        console.log('OVERRIDE!', state, event)
        walletGen.render()
        walletGen.showModal()
      },
    },
    header: () => ``,
    footer: () => ``,
    content: state => html`
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
  let phrase = JSON.parse(
    localStorage?.dashRecoveryPhrase ||
    '""'
  )
  // let wallet = await generateRecoveryPhrase(phrase)

  // document.querySelector('main#app')
  //   .insertAdjacentElement('afterend', onbrdEl)
  // walletGen.render()
  onboard.render()

  if (!phrase) {
    // walletGen.show()
    onboard.show()

    // phrase = wallet.recoveryPhrase
    // localStorage.dashRecoveryPhrase = JSON.stringify(phrase)

    // for animation
    // setTimeout(t => {
    //   onboardingDialog.showModal()
    // }, 50)
  }

  bodyNav.render()
  mainFtr.render()

  console.log('init', { phrase })
}

main()
