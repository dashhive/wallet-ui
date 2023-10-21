import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
)

export let shareProfileRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
  } = globals;
  // store.addresses.key(1).then(function(keyName) {
  //     // Name of the key.
  //     console.log('first key', keyName);
  //     let dashSvg = qrSvg(
  //       `dash://${keyName}`,
  //       {
  //         background: '#fff0',
  //         color: 'currentColor',
  //         indent: 1,
  //         padding: 1,
  //         size: 'mini',
  //         container: 'svg-viewbox',
  //         join: true,
  //       }
  //     )
  //     // console.log('first key qr code', dashSvg);
  //     mainApp.insertAdjacentHTML('beforeend', dashSvg)
  // }).catch(function(err) {
  //     // This code runs if there were any errors
  //     console.error('failed to load first key', err);
  // });

  let shareProfile = setupDialog(
    mainApp,
    {
      name: 'Edit & Share Profile',
      address: '',
      submitTxt: html`
      <svg class="user" width="26" height="26" viewBox="0 0 24 24">
        <use xlink:href="#icon-user"></use>
      </svg> Save Profile`,
      submitAlt: 'QR Code',
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

        <fieldset class="profile">
          <aside>
            ${qrSvg(
              `web+dash://${state.wallet?.address || ''}`,
              {
                background: '#0000',
                color: 'currentColor',
                indent: 1,
                padding: 1,
                size: 'mini',
                container: 'svg-viewbox',
                join: true,
              }
            )}
          </aside>

          <section>
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
                  value="${appState.selected_alias}"
                  placeholder="your_alias"
                  pattern="${aliasRegex.source}"
                  required
                  spellcheck="false"
                />
              </div>
              <p>Alias for the contact (similar to a @username)</p>

              <div class="error"></div>
            </article>
          </section>
        </fieldset>

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          // event.target.pass.setCustomValidity('')
          // event.target.pass.reportValidity()

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

          shareProfile.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.shareProfile = shareProfile;

  return shareProfile
})

export default shareProfileRig