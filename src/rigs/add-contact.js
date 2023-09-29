import { lit as html } from '../helpers/lit.js'
// import {
//   formDataEntries,
// } from '../helpers/utils.js'
// import {
//   initWallet,
// } from '../helpers/wallet.js'
// import setupDialog from '../components/dialog.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
)

export let addContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
  } = globals;

  let addContact = setupDialog(
    mainApp,
    {
      name: 'Add a New Contact',
      submitTxt: html`
      <svg class="plus-circle" width="26" height="26" viewBox="0 0 16 16">
        <use xlink:href="#icon-plus-circle"></use>
      </svg> Add Contact`,
      submitAlt: 'Add Contact',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<i class="icon-x"></i>`,
      closeAlt: `Close`,
      footer: state => html`
        <footer class="inline col">
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="new_contact"
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
            <label for="contactAddress">
              Contact Address
            </label>
            <div>
              <input
                id="contactAddress"
                name="addr"
                placeholder="Contact Addr"
              />
            </div>
            <p>Paste a Dash Address, Xpriv/Xpub, or Link</p>

            <div class="error"></div>
          </article>

          <article>
            <label for="contactName">
              Contact Name
            </label>
            <div>
              <input
                id="contactName"
                name="name"
                placeholder="Contact Name"
              />
            </div>
            <p>Optional</p>

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
                pattern="${aliasRegex.source}"
                required
                spellcheck="false"
              />
            </div>
            <p>Alias for the contact (similar to a @username)</p>

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

          // let fde = formDataEntries(event)

          // if (!fde.pass) {
          //   event.target.pass.setCustomValidity(
          //     'An encryption password is required'
          //   )
          //   event.target.reportValidity()
          //   return;
          // }

          // let initialized
          // wallet = state.wallet

          // if (!wallets?.[appState.selected_alias]) {
          //   initialized = await initWallet(
          //     appState.encryptionPassword,
          //     wallet,
          //     0,
          //     0,
          //     {
          //       preferred_username: appState.selected_alias,
          //     }
          //   )
          //   wallets = initialized.wallets
          // }

          addContact.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.addContact = addContact;

  return addContact
})

export default addContactRig