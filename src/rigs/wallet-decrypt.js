import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

export let walletDecryptRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, mainApp,
    wallets, decryptWallet, getUserInfo,
  } = globals;

  let walletDecrypt = setupDialog(
    mainApp,
    {
      name: 'Decrypt Wallet',
      submitTxt: 'Decrypt',
      submitAlt: 'Decrypt Wallet',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Form`,
      closeTxt: html`<i class="icon-x"></i>`,
      closeAlt: `Close`,
      footer: state => html`
        <footer class="inline col">
          <sup>Temporarily decrypt wallet data stored in the browser.</sup>
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
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          state.removeAllListeners()

          // console.log(
          //   'handle dialog close',
          //   event,
          //   event.target === state.elements.dialog,
          //   state.elements.dialog.returnValue
          // )

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            resolve('cancel')
          }

          setTimeout(t => {
            state.rendered = null
            event?.target?.remove()
          }, state.delay)
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let ks_phrase = wallets?.[appState.selectedWallet]
            ?.keystore?.crypto?.ciphertext || ''
          let ks_iv = wallets?.[appState.selectedWallet]
            ?.keystore?.crypto?.cipherparams?.iv || ''
          let ks_salt = wallets?.[appState.selectedWallet]
            ?.keystore?.crypto?.kdfparams?.salt || ''

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

          appState.phrase = decryptedRecoveryPhrase
          appState.encryptionPassword = fde.pass

          await getUserInfo()

          if (fde.remember) {
            sessionStorage.encryptionPassword = window.btoa(String(appState.encryptionPassword))
          }

          appDialogs.walletDecrypt.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.walletDecrypt = walletDecrypt;

  return walletDecrypt
})

export default walletDecryptRig