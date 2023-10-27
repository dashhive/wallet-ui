import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'
import {
  ALIAS_REGEX,
  PHRASE_REGEX,
} from '../helpers/constants.js'

export let phraseImportRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState,
    mainApp, wallet, deriveWalletData,
  } = globals;

  let phraseImport = setupDialog(
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

          phraseImport.close()

          appDialogs.walletEncrypt.render(
            {
              wallet,
            },
            'afterend',
          )
          await appDialogs.walletEncrypt.showModal()
        },
      },
    }
  )

  // @ts-ignore
  globals.phraseImport = phraseImport;

  return phraseImport
})

export default phraseImportRig