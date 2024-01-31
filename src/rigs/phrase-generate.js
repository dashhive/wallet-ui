import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'
import {
  ALIAS_REGEX,
} from '../helpers/constants.js'

export let phraseGenerateRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState,
    mainApp, wallet, store,
    deriveWalletData, generateWalletData,
  } = globals;

  let phraseGenerate = setupDialog(
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
          <sup>Hit next to generate a new wallet and seed phrase.</sup>
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

          wallet = await generateWalletData()

          appState.phrase = wallet.recoveryPhrase
          appState.selectedWallet = wallet.id
          appState.selectedAlias = `${fde.alias}`

          localStorage.selectedWallet = appState.selectedWallet
          localStorage.selectedAlias = appState.selectedAlias

          let newAccount = await store.accounts.setItem(
            wallet.xkeyId,
            {
              createdAt: (new Date()).toISOString(),
              updatedAt: (new Date()).toISOString(),
              accountIndex: wallet.accountIndex,
              addressIndex: wallet.addressIndex,
              walletId: wallet.id,
              xkeyId: wallet.xkeyId,
              addressKeyId: wallet.addressKeyId,
              address: wallet.address,
            }
          )

          appState.account = newAccount

          // console.log('GENERATE wallet!', wallet)

          appDialogs.phraseBackup.render(
            {
              wallet,
            },
            'afterend',
          )
          appDialogs.phraseBackup.showModal()

          phraseGenerate.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.phraseGenerate = phraseGenerate;

  return phraseGenerate
})

export default phraseGenerateRig