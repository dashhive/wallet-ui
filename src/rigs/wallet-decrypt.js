import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'
import {
  initWallet,
} from '../helpers/wallet.js'

export let walletDecryptRig = (async function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, mainApp,
    wallets, decryptKeystore, getUserInfo,
    store, deriveWalletData, importFromJson,
    // showErrorDialog,
  } = globals;

  let walletDecrypt = await setupDialog(
    mainApp,
    {
      name: 'Decrypt Wallet',
      submitTxt: 'Decrypt',
      submitAlt: 'Decrypt Wallet',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Form`,
      closeTxt: html`<i class="icon-x"></i>`,
      closeAlt: `Close`,
      showRemember: true,
      footer: state => html`
        <footer class="inline col">
          <sup>Temporarily decrypt wallet data stored in the browser.</sup>
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="load_wallet"
            title="${state.submitAlt}"
          >
            <span>${state.submitTxt}</span>
          </button>
        </footer>
      `,
      rememberField: state => {
        if (!state.showRemember) {
          return ``
        }

        return html`
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
        `
      },
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
          ${state.rememberField(state)}
        </fieldset>

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let ks

          if (state.walletImportData) {
            ks = Object.values(
              state.walletImportData.wallets
            )?.[0]?.keystore
          }

          let decryptedRecoveryPhrase
          ks = ks || wallets?.[
            appState.selectedWallet
          ]?.keystore || state.keystore
          let fde = formDataEntries(event)

          if (!fde.pass) {
            event.target.pass.setCustomValidity(
              'A decryption password is required'
            )
            event.target.reportValidity()
            return;
          }
          if (!ks) {
            console.error('no keystore found')
            return;
          }

          let wallet, initialized

          try {
            decryptedRecoveryPhrase = await decryptKeystore(
              fde.pass,
              ks,
            )

            if (state.walletImportData) {
              await importFromJson(store, state.walletImportData)
            }

            appState.phrase = decryptedRecoveryPhrase
            appState.encryptionPassword = fde.pass

            if (await store.accounts.length() === 0) {
              wallet = await deriveWalletData(appState.phrase)

              appState.selectedWallet = wallet.id

              localStorage.selectedWallet = appState.selectedWallet

              initialized = await initWallet(
                fde.pass,
                wallet,
                ks,
                0,
                0,
                {
                  preferred_username: appState.selectedAlias,
                }
              )

              wallets = initialized.wallets

              let usage = [0,0]
              // usage[wallet.usageIndex] = wallet.addressIndex

              let newAccount = await store.accounts.setItem(
                wallet.xkeyId,
                {
                  createdAt: (new Date()).toISOString(),
                  updatedAt: (new Date()).toISOString(),
                  accountIndex: wallet.accountIndex,
                  usage,
                  walletId: wallet.id,
                  xkeyId: wallet.xkeyId,
                  addressKeyId: wallet.addressKeyId,
                  address: wallet.address,
                }
              )

              appState.account = newAccount
            }

            state.elements.dialog.returnValue = String(fde.intent)
          } catch(err) {
            console.warn('[fail] unable to decrypt seed phrase', err)
            // await showErrorDialog({
            //   title: 'Unable to decrypt seed phrase',
            //   msg: err,
            //   showActBtn: false,
            //   confirmAction: appDialogs.confirmAction,
            // })
            event.target.pass.setCustomValidity(
              'Unable to decrypt seed phrase. Did you type the correct encryption password?'
            )
            event.target.reportValidity()
            return;
          }

          await getUserInfo()

          if (fde.remember) {
            sessionStorage.encryptionPassword = window.btoa(String(appState.encryptionPassword))
          }

          appDialogs.phraseImport?.close()
          appDialogs.onboard?.close()
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