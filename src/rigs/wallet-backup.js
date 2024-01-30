import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

export let walletBackupRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState,
    wallet, wallets,
    saveJsonToFile, exportWalletData, localForageBaseCfg,
  } = globals;

  let walletBackup = setupDialog(
    mainApp,
    {
      name: 'Backup Wallet',
      submitTxt: 'Done',
      submitAlt: 'Confirm backup',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      fullBackupDecryptedAlt: `Download a copy of all data stored in the browser`,
      fullBackupEncryptedAlt: `Download a copy of all data stored in the browser`,
      keystoreBackupAlt: `Download your keystore as a JSON file`,
      seedPhraseAlt: `Display your seed phrase to write down`,
      footer: state => html`
        <footer class="inline col">
        </footer>
      `,
      content: state => {
        return html`
        ${state.header(state)}

        <fieldset class="flex-none">
          <!-- <article>
            <button
              class="rounded outline"
              type="submit"
              name="intent"
              value="full_backup_decrypted"
              title="${state.fullBackupDecryptedAlt}"
            >
              <span>
                Decrypted Full Backup
              </span>
            </button>
          </article> -->
          <article>
            <button
              class="rounded outline"
              type="submit"
              name="intent"
              value="full_backup_encrypted"
              title="${state.fullBackupEncryptedAlt}"
            >
              <span>
                Encrypted Full Backup
              </span>
            </button>
          </article>
          <article>
            <button
              class="rounded outline"
              type="submit"
              name="intent"
              value="keystore_backup"
              title="${state.keystoreBackupAlt}"
            >
              <span>
                Backup Keystore
              </span>
            </button>
          </article>
          <article>
            <button
              class="rounded outline"
              type="submit"
              name="intent"
              value="display_seed_phrase"
              title="${state.seedPhraseAlt}"
            >
              <span>
                Show Seed Phrase
              </span>
            </button>
          </article>
        </fieldset>

        ${state.footer(state)}
      `
      },
      fields: html``,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let storedWallet = wallets?.[appState.selectedWallet]
          let ks = storedWallet?.keystore
          let fde = formDataEntries(event)

          if (fde.intent === 'full_backup_encrypted') {
            exportWalletData(localForageBaseCfg.name)
            return;
          }

          if (fde.intent === 'keystore_backup' && ks) {
            saveJsonToFile(
              `incubator_keystore.${
                storedWallet.id
              }.${
                (new Date()).toISOString()
              }.json`,
              ks,
            )
            return;
          }

          if (fde.intent === 'display_seed_phrase' && ks) {
            appDialogs.walletDecrypt.render({
              name: `Decrypt Seed Phrase`,
              submitTxt: `Show Decrypted Seed Phrase`,
              keystore: ks,
              showRemember: false,
            })
            let decryptRes = await appDialogs.walletDecrypt.showModal()

            if (decryptRes !== 'cancel') {
              appDialogs.phraseBackup.render(
                {
                  wallet: state.wallet,
                  runEncryption: false,
                },
                'afterend',
              )
              appDialogs.phraseBackup.showModal()
            }
            return;
          }

          walletBackup.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.walletBackup = walletBackup;

  return walletBackup
})

export default walletBackupRig