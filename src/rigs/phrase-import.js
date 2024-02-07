import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  readFile,
} from '../helpers/utils.js'
import {
  ALIAS_REGEX,
  PHRASE_REGEX,
} from '../helpers/constants.js'

export let phraseImportRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, wallets, deriveWalletData,
  } = globals;

  const processFile = (state, event) => res => {
    if (res?.aliases) {
      console.log('backup file', res)
      state.walletImportData = res

      appState.selectedAlias = Object.keys(
        res.aliases
      )?.[0]
      localStorage.selectedAlias = appState.selectedAlias

      state.elements.form.alias.value = appState.selectedAlias

      appState.selectedWallet = Object.keys(
        res.wallets
      )?.[0]
      localStorage.selectedWallet = appState.selectedWallet
    } else {
      console.log('kestore file', res)
      state.keystoreData = res
    }
  }

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
      upload: state => {
        if (state.keystoreFile) {
          return ''
        }
        // <span>Drag and drop a Keystore file <br/> or Incubator Wallet backup file <br/> or click to <strong><u>upload</u></strong></span>
        return html`
          <svg class="upload" width="40" height="40" viewBox="0 0 40 40">
            <use xlink:href="#icon-upload"></use>
          </svg>
          <span>
            Select a <br/>
            <strong>Keystore</strong>
            or
            <strong>Backup</strong><br/>
            file
          </span>
        `
      },
      showFileName: state => {
        if (!state.keystoreFile) {
          return ''
        }
        return html`
          ${state.keystoreFile}
        `
      },
      updrop: state => html`
        <label for="keystore" class="updrop">
          <input
            type="file"
            id="keystore"
            name="ksfile"
            enctype="multipart/form-data"
          />
          ${state.showFileName(state)}
          ${state.upload(state)}
        </label>
      `,
      content: state => html`
        ${state.header(state)}

        <fieldset>
          <article>
            ${state.updrop(state)}

            <div class="error"></div>
          </article>
          <article>
            <label for="phrase">
              Seed Phrase
            </label>
            <div class="password">
              <input
                type="password"
                id="phrase"
                name="pass"
                placeholder="zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"
                pattern="${PHRASE_REGEX.source}"
                spellcheck="false"
                autocomplete="off"
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
            <p>Import an existing wallet by pasting a 12 word seed phrase.</p>

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
                autocomplete="off"
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
        handleDragOver: state => async event => {
          event.preventDefault()
          event.stopPropagation()
          // console.log(
          //   'PHRASE IMPORT DRAG OVER',
          //   state, event.target,
          //   event?.dataTransfer?.items,
          //   event.target.files
          // )
        },
        handleDrop: state => async event => {
          event.preventDefault()
          event.stopPropagation()
          console.log(
            'PHRASE IMPORT DROP',
            state, event.target,
            event?.dataTransfer?.items,
            event.target.files
          )

          if (event.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            [...event.dataTransfer.items].forEach((item, i) => {
              // If dropped items aren't files, reject them
              if (item.kind === "file") {
                const file = item.getAsFile();
                // console.log(`ITEMS file[${i}].name = ${file.name}`, file);
                readFile(
                  file,
                  processFile(state, event),
                )
                state.keystoreFile = file.name
                state.render(state)
              }
            });
          } else {
            // Use DataTransfer interface to access the file(s)
            [...event.dataTransfer.files].forEach((file, i) => {
              // console.log(`FILES file[${i}].name = ${file.name}`, file);
              readFile(
                file,
                processFile(state, event),
              )
              state.keystoreFile = file.name
              state.render(state)
            });
          }
        },
        handleChange: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (event.target.files?.length > 0) {
            readFile(
              event.target.files[0],
              processFile(state, event),
            )
            state.keystoreFile = event.target.files[0].name
            state.render(state)
          }
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          if (state.walletImportData) {
            appDialogs.walletDecrypt.render({
              walletImportData: state.walletImportData
            })
            await appDialogs.walletDecrypt.showModal()
            return;
          }

          if (
            !fde.pass && (
              !fde.ksfile ||
              !state.keystoreData
            )
          ) {
            event.target.pass.setCustomValidity(
              'A seed phrase or keystore is required'
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

          appState.selectedAlias = `${fde.alias}`
          localStorage.selectedAlias = appState.selectedAlias

          if (state.keystoreData) {
            appDialogs.walletDecrypt.render({
              keystore: state.keystoreData
            })
            await appDialogs.walletDecrypt.showModal()
            return;
          }

          appState.phrase = `${fde.pass}`

          wallet = await deriveWalletData(appState.phrase)

          appState.selectedWallet = wallet.id
          localStorage.selectedWallet = appState.selectedWallet

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