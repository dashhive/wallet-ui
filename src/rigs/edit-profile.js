import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  formDataEntries,
  setClipboard,
  openBlobSVG,
  // sortContactsByAlias,
  // sortContactsByName,
  // parseAddressField,
} from '../helpers/utils.js'

import {
  ALIAS_REGEX,
} from '../helpers/constants.js'

export let editProfileRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, store,
    appState, bodyNav,
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
      getLink: state => `dash:${state.wallet?.address || ''}?label=funding`,
      content: state => html`
        ${state.header(state)}

        <fieldset class="share">
          <aside>
            <span title="Open QR Code in new Window">${qrSvg(
              state.getLink(state),
              {
                indent: 0,
                padding: 4,
                size: 'mini',
                container: 'svg-viewbox',
                join: true,
              }
            )}</span>
            <input readonly value="${state.getLink(state)}" />
            <button id="pair-copy" class="pill rounded copy" title="Copy URI (${state.getLink(state)})">
              <i class="icon-copy"></i>
              Copy URI
            </button>
            <sub>Use this QR code to fund your wallet</sub>
          </aside>

          <section>
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
                    state.userInfo?.name || ''
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
                  value="${appState.selectedAlias}"
                  placeholder="your_alias"
                  pattern="${ALIAS_REGEX.source}"
                  required
                  spellcheck="false"
                />
              </div>
              <p>Alias others can call you (similar to a @username)</p>

              <div class="error"></div>
            </article>
          </section>
        </fieldset>

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleClick: state => async event => {
          let shareAside = state.elements?.dialog?.querySelector(
            'fieldset.share > aside'
          )
          if (
            shareAside?.contains(event.target)
          ) {
            if (
              event.target?.nodeName.toLowerCase() === 'input' &&
              event.target?.readOnly
            ) {
              event.preventDefault()
              event.stopPropagation()

              event.target.select()
            }
            if (
              event.target?.classList?.contains('copy') ||
              event.target?.classList?.contains('icon-copy')
            ) {
              event.preventDefault()
              event.stopPropagation()

              setClipboard(event)
            }
            if (
              event.target?.nodeName.toLowerCase() === 'svg'
            ) {
              event.preventDefault()
              event.stopPropagation()

              openBlobSVG(event.target)
            }
            if (
              event.target?.parentElement?.nodeName.toLowerCase() === 'svg'
            ) {
              event.preventDefault()
              event.stopPropagation()

              openBlobSVG(event.target?.parentElement)
            }
          }
        },
        handleRender: state => {
          // console.log(
          //   'edit profile render',
          //   state.userInfo,
          // )
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
            appState.selectedAlias,
          )
          let removedAlias

          if (appState.selectedAlias !== fde.profileAlias) {
            removedAlias = await store.aliases.removeItem(
              appState.selectedAlias,
            )
            appState.selectedAlias = fde.profileAlias
            localStorage.selectedAlias = fde.profileAlias
          }

          let updatedAlias = await store.aliases.setItem(
            // state.wallet.id,
            appState.selectedAlias,
            {
              ...storedAlias,
              info: {
                ...(storedAlias.info || {}),
                name: String(fde.profileName),
                preferred_username: String(fde.profileAlias),
              },
            }
          )

          state.userInfo.name = String(fde.profileName)
          state.userInfo.preferred_username = String(fde.profileAlias)

          let storedWallet = await store.wallets.getItem(
            appState.selectedWallet,
          )

          let updatedWallet = await store.wallets.setItem(
            appState.selectedWallet,
            {
              ...storedWallet,
              alias: String(fde.profileAlias),
            }
          )
          bodyNav.render({
            data: {
              alias: appState.selectedAlias
            },
          })

          console.log(
            'Edit Profile Updated!',
            removedAlias, updatedAlias, updatedWallet
          )

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