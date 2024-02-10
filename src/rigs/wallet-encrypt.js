import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'
import {
  initWallet,
} from '../helpers/wallet.js'

export let walletEncryptRig = (async function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, mainApp,
    wallet, wallets, bodyNav, dashBalance,
  } = globals;

  let walletEncrypt = await setupDialog(
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
          <article>
            <label for="encryptionPassword">
              Encryption Password
            </label>
            <div class="password">
              <input
                type="password"
                id="encryptionPassword"
                name="pass"
                placeholder="superS3cr3t"
                minlength="1"
                required
                spellcheck="false"
                autocomplete="off"
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
          </article>
          <article>
            <div class="switch py-3 pr-3">
              <label for="rememberPass" class="jc-left">
                <sub>
                  Remember password for browser session
                </sub>
              </label>
              <input
                id="rememberPass"
                name="remember"
                type="checkbox"
                checked
              />
              <label for="rememberPass" class="switch" title="Remember for session"></label>
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

          appState.phrase = wallet.recoveryPhrase
          appState.encryptionPassword = fde.pass

          if (fde.remember) {
            sessionStorage.encryptionPassword = window.btoa(String(appState.encryptionPassword))
          }

          if (!wallets?.[appState.selectedAlias]) {
            initialized = await initWallet(
              fde.pass,
              wallet,
              false,
              0,
              0,
              {
                preferred_username: appState.selectedAlias,
              }
            )
            wallets = initialized.wallets
          }

          // console.log('ENCRYPT wallet!', wallet, appState.selectedAlias)

          bodyNav?.render({
            data: {
              alias: appState.selectedAlias
            },
          })
          dashBalance?.render({
            wallet,
          })

          appDialogs.onboard?.close()
          walletEncrypt.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.walletEncrypt = walletEncrypt;

  return walletEncrypt
})

export default walletEncryptRig