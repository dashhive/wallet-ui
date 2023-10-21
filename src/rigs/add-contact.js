import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9_\-\.]{1,}$/
)

export let addContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
    scanContact,
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
      scanAlt: 'Scan Contact QR Code',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
      <use xlink:href="#icon-x"></use>
    </svg>`,
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
              <button
                class="rounded outline"
                name="intent"
                value="scan_new_contact"
                title="${state.scanAlt}"
              >
                <span>
                  <svg class="qr-code" width="24" height="24" viewBox="0 0 24 24">
                    <use xlink:href="#icon-qr-code"></use>
                  </svg>
                </span>
              </button>
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

          // event.target.alias.setCustomValidity('')
          // event.target.alias.reportValidity()

          console.log('ADD CONTACT!', state, event)

          let fde = formDataEntries(event)

          console.log('scanContact', scanContact)

          if (fde?.intent === 'scan_new_contact') {
            scanContact.render(
              {
                wallet,
              },
              'afterend',
            )

            let showScan = await scanContact.showModal()
            console.log(
              'showScan',
              showScan,
              // scanContact,
              // scanContact?.element?.returnValue
            )
            let [, addr] = showScan?.split('dash://')
            if (addr) {
              // event.target.addr.value = addr
              event.target.addr.value = showScan
            }
            return;
          }

          if (!String(fde.alias)?.trim()) {
            event.target.alias.setCustomValidity(
              'An alias is required'
            )
            event.target.reportValidity()
            return;
          }

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