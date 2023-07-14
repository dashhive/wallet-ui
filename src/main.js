import { lit as html } from './helpers/lit.js'

import { generateRecoveryPhrase } from './helpers/utils.js'

import setupDialog from './components/dialog.js'

let onboardingDialog = await setupDialog(
  document.querySelector('main#app'),
  {
    name: 'Onboarding Flow',
    placement: 'fullscreen',
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

  document.querySelector('main#app')
    .insertAdjacentElement('afterend', onboardingDialog)

  if (!phrase) {
    onboardingDialog.show()

    // phrase = wallet.recoveryPhrase
    // localStorage.dashRecoveryPhrase = JSON.stringify(phrase)

    // for animation
    // setTimeout(t => {
    //   onboardingDialog.showModal()
    // }, 50)
  }

  console.log('init', { phrase })
}

main()
