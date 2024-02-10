import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  phraseToEl,
  setClipboard,
} from '../helpers/utils.js'

export let phraseBackupRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs,
  } = globals;

  let phraseBackup = await setupDialog(
    mainApp,
    {
      name: 'New Wallet',
      submitTxt: 'I backed up this Seed Phrase',
      submitAlt: 'Confirm Seed Phrase backup',
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
          <sup class="ta-left">Do not lose this seed phrase. We recommend you write it down or print it out and keep it somewhere safe. THERE ARE NO OTHER BACKUPS.</sup>
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
              Seed Phrase
            </label>

            <section>
              <article>
                <div
                  class="ta-left"
                  spellcheck="false"
                  autocomplete="off"
                >
                  ${phraseToEl(
                    state.wallet?.recoveryPhrase
                  )}
                </div>
                <button id="phrase" class="pill rounded copy" title="Copy Seed Phrase">
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
      runEncryption: true,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let { wallet, runEncryption } = state

          phraseBackup.close()

          if (runEncryption) {
            await appDialogs.walletEncrypt.render(
              {
                wallet,
              },
              'afterend',
            )
            await appDialogs.walletEncrypt.showModal()
          }
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

  // @ts-ignore
  globals.phraseBackup = phraseBackup;

  return phraseBackup
})

export default phraseBackupRig