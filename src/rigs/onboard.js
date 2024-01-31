import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

export let onboardRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs,
  } = globals;

  let onboard = setupDialog(
    mainApp,
    {
      name: 'Onboarding Flow',
      placement: 'fullscreen',
      responsive: false,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          if (fde?.intent === 'generate') {
            appDialogs.phraseGenerate.render()
            appDialogs.phraseGenerate.showModal()
          } else if (fde?.intent === 'import') {
            appDialogs.phraseImport.render()
            appDialogs.phraseImport.showModal()
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
              <p>This option will give you a brand new wallet and seed phrase.</p>

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
              <p>Already have a Dash wallet? Click below to add it using your seed phrase.</p>

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

  // @ts-ignore
  globals.onboard = onboard;

  return onboard
})

export default onboardRig