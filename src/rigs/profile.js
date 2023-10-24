import { lit as html } from '../helpers/lit.js'
// import { qrSvg } from '../helpers/qr.js'
import {
  formDataEntries,
  // setClipboard,
  // sortContactsByAlias,
  // sortContactsByName,
  // parseAddressField,
} from '../helpers/utils.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
)

export let editProfileRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
    store, aliasWallets,
  } = globals;

  let editProfile = setupDialog(
    mainApp,
    {
      name: 'Edit Profile',
      address: '',
      submitTxt: html`
      <svg class="user" width="26" height="26" viewBox="0 0 24 24">
        <use xlink:href="#icon-user"></use>
      </svg> Save Profile`,
      submitAlt: 'QR Code',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      placement: 'wide',
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
            <label for="profileName">
              Your Name
            </label>
            <div>
              <input
                id="profileName"
                name="profileName"
                placeholder="John Doe"
                value="${
                  aliasWallets?.info?.name || ''
                }"
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
                name="profileAlias"
                value="${appState.selected_alias}"
                placeholder="your_alias"
                pattern="${aliasRegex.source}"
                required
                spellcheck="false"
              />
            </div>
            <p>Alias others can call you (similar to a @username)</p>

            <div class="error"></div>
          </article>
        </fieldset>

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleRender: state => {
          console.log(
            'edit profile render',
            aliasWallets,
          )
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          console.log('Edit Profile!', state, event)

          let fde = formDataEntries(event)

          // if (!String(fde.profileName)?.trim()) {
          //   event.target.profileName.setCustomValidity(
          //     'Name must be Alphanumeric'
          //   )
          //   event.target.reportValidity()
          //   return;
          // }

          if (!String(fde.profileAlias)?.trim()) {
            event.target.profileAlias.setCustomValidity(
              'An alias is required'
            )
            event.target.reportValidity()
            return;
          }

          let storedAlias = await store.aliases.getItem(
            appState.selected_alias,
          )
          let removedAlias

          if (appState.selected_alias !== fde.profileAlias) {
            removedAlias = await store.aliases.removeItem(
              appState.selected_alias,
            )
            appState.selected_alias = fde.profileAlias
            localStorage.selected_alias = fde.profileAlias
          }

          let updatedAlias = await store.aliases.setItem(
            // state.wallet.id,
            appState.selected_alias,
            {
              ...storedAlias,
              info: {
                ...(storedAlias.info || {}),
                name: String(fde.profileName),
                preferred_username: String(fde.profileAlias),
              },
            }
          )

          let storedWallet = await store.wallets.getItem(
            appState.selected_wallet,
          )

          let updatedWallet = await store.wallets.setItem(
            // state.wallet.id,
            appState.selected_wallet,
            {
              ...storedWallet,
              alias: String(fde.profileAlias),
            }
          )
          bodyNav.render({
            data: {
              alias: appState.selected_alias
            },
          })

          console.log('Edit Profile Updated!', removedAlias, updatedAlias, updatedWallet)

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

          editProfile.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.editProfile = editProfile;

  return editProfile
})

export default editProfileRig