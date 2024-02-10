import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  readFile,
  verifyPhrase,
} from '../helpers/utils.js'
import {
  ALIAS_REGEX,
  PHRASE_REGEX,
} from '../helpers/constants.js'

export let phraseImportRig = (async function (globals) {
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

  let phraseImport = await setupDialog(
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
        <label for="keystore">
          Keystore or Backup
        </label>
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
          <section class="group">
            <article class="${state.keystoreFile ? 'dropped' : ''}">
              ${state.updrop(state)}

              <div class="error"></div>
            </article>

            <div>OR</div>

            <article class="">
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
                  ${state.keystoreFile ? 'disabled' : ''}
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
          </section>
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
                title="Enter a string with one or more characters, that starts & ends with a letter or number and may contain underscores (_), periods (.) & hyphens (-) in between. (E.g. john.doe, jane_doe, 1.dash_fan)"
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
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          state.removeAllListeners()

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            state.keystoreFile = ''
            state.keystoreData = null
            state.render(state)
            resolve('cancel')
          }
          // console.log(
          //   'DIALOG handleClose',
          //   state.modal.rendered[state.slugs.dialog],
          // )

          setTimeout(t => {
            state.modal.rendered[state.slugs.dialog] = null
            event?.target?.remove()
            // console.log(
            //   'DIALOG handleClose setTimeout',
            //   state.delay,
            //   // modal.rendered[state.slugs.dialog],
            //   state.modal.rendered,
            // )
          }, state.delay)
        },
        handleDragOver: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (
            event.target.classList.contains('updrop') &&
            !event.target.classList.contains('disabled')
          ) {
            console.log(
              'PHRASE IMPORT DRAG OVER',
              // state,
              event.target,
              // event?.dataTransfer?.items,
              // event.target.files,
            )

            event.target.classList.add('drag-over')
          }
        },
        handleDragLeave: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (
            event.target.classList.contains('updrop') &&
            !event.target.classList.contains('disabled')
          ) {
            console.log(
              'PHRASE IMPORT DRAG LEAVE',
              // state,
              event.target,
              // event?.dataTransfer?.items,
              // event.target.files,
            )

            event.target.classList.remove('drag-over')
          }
        },
        handleDragEnd: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (
            event.target.classList.contains('updrop') &&
            !event.target.classList.contains('disabled')
          ) {
            console.log(
              'PHRASE IMPORT DRAG END',
              // state,
              event.target,
              // event?.dataTransfer?.items,
              // event.target.files,
            )

            event.target.classList.add('dropped')
          }
        },
        handleDrop: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (
            event.target.classList.contains('updrop') &&
            !event.target.classList.contains('disabled')
          ) {
            console.log(
              'PHRASE IMPORT DROP',
              state, event.target,
              event?.dataTransfer?.items,
              event.target.files
            )

            if (event.dataTransfer.items) {
              [...event.dataTransfer.items].forEach((item, i) => {
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
              [...event.dataTransfer.files].forEach((file, i) => {
                readFile(
                  file,
                  processFile(state, event),
                )
                state.keystoreFile = file.name
                state.render(state)
              });
            }
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
        handleInput: state => async event => {
          if (
            event.target.name === 'pass'
          ) {
            event.preventDefault()
            event.stopPropagation()

            let testPhrase = PHRASE_REGEX.test(event.target.value)
            let updr = state.elements.form.querySelector('.updrop')
            let updrField = updr?.querySelector('input[type="file"]')

            // console.log('phrase import handleInput', testPhrase)

            if (testPhrase) {
              let tmpWallet = await verifyPhrase(event.target.value)

              state.validPhrase = testPhrase && tmpWallet

              // console.log('phrase import handleInput wallet', tmpWallet)

              if (tmpWallet) {
                updr?.classList.add('disabled')
                updrField.disabled = true
              } else {
                updr?.classList.remove('disabled')
                updrField.disabled = false
              }
            }
            if (state.validPhrase && !testPhrase) {
              updr?.classList.remove('disabled')
              updrField.disabled = false
              state.validPhrase = testPhrase
            }
          }
        },
        // PHRASE_REGEX
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          if (state.walletImportData) {
            await appDialogs.walletDecrypt.render({
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
            await appDialogs.walletDecrypt.render({
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

          await appDialogs.walletEncrypt.render(
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