import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  readFile,
  verifyPhrase,
  fileIsSubType,
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
    showErrorDialog,
  } = globals;

  const displayError = (state, event) => ({err, file}) => {
    let title = `failed to parse JSON data from ${file.name}`

    if (!fileIsSubType(file, 'json')) {
      title = `Invalid file type: ${file.type}`
    }

    showErrorDialog({
      title,
      msg: err,
      showActBtn: false,
      cancelCallback: () => {
        clearFile(state)
      },
    })
  }

  const processFile = (state, event) => (res, file) => {
    if (file?.type !== '' && !fileIsSubType(file, 'json')) {
      return displayError(state, event)({
        err: `Invalid file type: ${file.type}`,
        file,
      })
    }

    if (res?.aliases) {
      console.log('backup file', { res, file })
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
      console.log('kestore file', { res, file })
      state.keystoreData = res
    }
  }

  function clearFile(state) {
    let updrField = state.elements.form?.querySelector(
      '.updrop input[type="file"]'
    )
    updrField.value = null
    state.keystoreData = null
    state.walletImportData = null
    state.keystoreFile = ''
    state.render(state)
  }

  function updropContainer(state) {
    return state.keystoreFile ? `div` : `label`
  }

  let phraseImport = await setupDialog(
    mainApp,
    {
      name: 'Existing Wallet',
      submitTxt: 'Add Wallet',
      submitAlt: 'Import Existing Wallet',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Wallet Import`,
      clearAlt: `Clear selected file`,
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
          <button
            class="link clear"
            type="reset"
            name="intent"
            value="clear"
            title="${state.clearAlt}"
          >
            <svg class="x" width="40" height="40" viewBox="0 0 26 26">
              <use xlink:href="#icon-x"></use>
            </svg>
          </button>
          <label for="keystore">
            ${state.keystoreFile}
          </label>
        `
      },
      updrop: state => {
        let el = updropContainer(state)

        return html`
          <label for="keystore">
            Keystore or Backup
          </label>
          <${el} for="keystore" class="updrop">
            ${state.upload(state)}
            ${state.showFileName(state)}
            <input
              type="file"
              id="keystore"
              name="ksfile"
              enctype="multipart/form-data"
            />
          </${el}>
        `
      },
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
                autocapitalize="off"
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
        handleFocusOut: state => event => {
          if (event.target.id === 'keystore') {
            event.target.parentElement.classList.remove('focus')
          }
        },
        handleFocusIn: state => event => {
          if (event.target.id === 'keystore') {
            event.target.parentElement.classList.add('focus')
          }
        },
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
            clearFile(state)
            resolve('cancel')
          }
          // console.log(
          //   'PHRASE IMPORT handleClose',
          //   state.modal.rendered[state.slugs.dialog],
          //   state.elements.dialog.returnValue,
          //   event,
          //   event?.target?.name,
          // )

          setTimeout(t => {
            state.modal.rendered[state.slugs.dialog] = null
            event?.target?.remove()
          }, state.delay)
        },
        handleDragOver: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          if (
            event.target.classList.contains('updrop') &&
            !event.target.classList.contains('disabled')
          ) {
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
            if (event.dataTransfer.items) {
              [...event.dataTransfer.items].forEach((item, i) => {
                if (item.kind === "file") {
                  const file = item.getAsFile();
                  readFile(
                    file,
                    {
                      callback: processFile(state, event),
                      errorCallback: displayError(state, event),
                    },
                  )
                  state.keystoreFile = file.name
                  state.render(state)
                }
              });
            } else {
              [...event.dataTransfer.files].forEach((file, i) => {
                readFile(
                  file,
                  {
                    callback: processFile(state, event),
                    errorCallback: displayError(state, event),
                  },
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
              {
                callback: processFile(state, event),
                errorCallback: displayError(state, event),
              },
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
              let tmpPhrase = await verifyPhrase(
                event.target.value
              )

              state.validPhrase = testPhrase && tmpPhrase

              if (tmpPhrase) {
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
        handleClick: state => event => {
          let clearButton = state.elements?.dialog?.querySelector(
            '.updrop > button[value=clear]'
          )
          if (
            clearButton === event.target ||
            clearButton?.contains(event.target)
          ) {
            clearFile(state)
            return;
          }
          if (event.target === state.elements.dialog) {
            // console.log(
            //   'handle dialog backdrop click',
            //   event,
            //   event.target === state.elements.dialog
            // )
            state.elements.dialog.close('cancel')
          }
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          if (fde.intent === 'clear') {
            clearFile(state)
            return;
          }

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