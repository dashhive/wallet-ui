import {
  OIDC_CLAIMS,
  ALIAS_REGEX,
} from '../utils/constants.js'

import {
  lit as html,
  formDataEntries,
  setClipboard,
  openBlobSVG,
  debounce,
} from '../utils/generic.js'

import {
  getStoreData,
} from '../utils/db.js'

import {
  generateContactPairingURI,
} from '../utils/dash/local.js'

import {
  processURI,
} from '../utils/dash/network.js'

import * as model from '../models/contacts.js'

import { qrSvg } from '../utils/qr.js'

export let addContactRig = (async function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, appTools, store,
    mainApp, wallet, userInfo, contactsList, getAddrsTransactions,
    updateAllFunds, batchXkeyAddressGenerate, dashsight,
  } = globals;

  let aliases = {}
  let startAlias = ''

  let debounceField = debounce(async (
    [field, localName], state, event
  ) => {
    let infoField
    let { info } = state.contact
    if (info) {
      infoField = info[field]
    }
    infoField = infoField || event.target?.value || ''
    let fieldValue = event.target?.value || infoField || ''

    let contact = {
      ...state.contact,
      updatedAt: (new Date()).toISOString(),
      info: {
        ...OIDC_CLAIMS,
        ...(state.contact.info || {}),
        [field]: fieldValue,
      },
    }

    if (!!localName) {
      contact.info[field] = infoField
      contact[localName] = fieldValue
    }

    let newContact = await appTools.storedData.encryptItem(
      store.contacts,
      state.wallet.xkeyId,
      contact,
      false,
    )

    state.contact = newContact

    // console.log('debounceField', field, localName, newContact)

    getStoreData(
      store.contacts,
      res => {
        if (res) {
          appState.contacts = res

          return contactsList.restate({
            contacts: res,
            userInfo,
          })
        }
      },
      res => async v => {
        res.push(await appTools.storedData.decryptData(v))
      }
    )
  }, 1000)

  let addContact = await setupDialog(
    mainApp,
    {
      name: 'Add a New Contact',
      submitTxt: html`<svg class="plus-circle" width="26" height="26" viewBox="0 0 16 16">
        <use xlink:href="#icon-plus-circle"></use>
      </svg> Add Contact`,
      submitAlt: 'Add Contact',
      scanAlt: 'Scan Contact QR Code',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeAlt: `Close`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      placement: 'wide',
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
      generateQr: state => {
        let shareLink = generateContactPairingURI(state)

        return {
          link: shareLink,
          svg: qrSvg(
            shareLink,
            {
              // background: '#0000',
              // color: '#fff',
              indent: 0,
              padding: 4,
              size: 'mini',
              container: 'svg-viewbox',
              join: true,
            }
          )
        }
      },
      content: state => {
        let { link, svg } = state.generateQr(state)
        return html`
        ${state.header(state)}

        <fieldset class="share">
          <section>
            <article>
              <label for="contactAddress">
                Contact Address
              </label>
              <div class="input">
                <input
                  id="contactAddress"
                  name="contactAddr"
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
              <input
                id="contactURI"
                type="hidden"
                name="contactURI"
                value=""
              />
              <p>Paste a Dash Address, Xprv/Xpub, or Link</p>

              <div class="error"></div>
            </article>

            <article>
              <label for="contactName">
                Contact Name
              </label>
              <div>
                <input
                  id="contactName"
                  name="contactName"
                  placeholder="Contact Name"
                  value="${state.contact?.info?.name || ''}"
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
                  name="contactAlias"
                  placeholder="your_alias"
                  pattern="${ALIAS_REGEX.source}"
                  spellcheck="false"
                  autocomplete="off"
                  value="${state.contact?.alias || ''}"
                />
              </div>
              <p>Alias for the contact (similar to a @username)</p>

              <div class="error"></div>
            </article>
          </section>

          <aside>
            <span title="Open QR Code in new Window">${svg}</span>
            <input readonly value="${link}" />
            <button id="pair-copy" class="pill rounded copy" title="Copy URI (${link})">
              <i class="icon-copy"></i>
              Copy URI
            </button>
            <sub>Share this QR code with your new contact</sub>
          </aside>
        </fieldset>

        ${state.footer(state)}
      `},
      fields: html``,
      events: {
        handleInput: state => async event => {
          event.preventDefault()
          if (
            event?.target?.validity?.patternMismatch &&
            event?.target?.type !== 'checkbox'
          ) {
            let label = event.target?.previousElementSibling?.textContent?.trim()
            if (label) {
              event.target.setCustomValidity(`Invalid ${label}`)
            }
          } else {
            event.target.setCustomValidity('')
          }
          event.target.reportValidity()

          if (event.target?.name === 'contactAddr') {
            if (event.target?.value) {
              processURI(
                state,
                event.target.form,
                event.target.value,
              )
            }
          }
          if (
            event.target?.name === 'contactAlias' &&
            !event?.target?.validity?.patternMismatch
          ) {
            // console.log(
            //   'handleInput contactAlias',
            //   aliases,
            //   event.target?.value
            // )
            if (
              startAlias !== event.target?.value &&
              aliases.includes(event.target?.value)
            ) {
              event.target.setCustomValidity(
                'Alias already used. A unique alias is required.'
              )
              event.target.reportValidity()
              return;
            }

            debounceField(
              ['preferred_username', 'alias'],
              state,
              event
            )
          }
          if (
            event.target?.name === 'contactName' &&
            !event?.target?.validity?.patternMismatch
          ) {
            debounceField(
              ['name'],
              state,
              event
            )
          }
        },
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
        handleRender: (state) => {
          startAlias = state.contact.alias

          appState.contacts.forEach(
            ({ alias }) => {
              if (alias) {
                aliases[alias] = true
              }
            }
          )
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          // event.target.contactAlias.setCustomValidity('')
          // event.target.contactAlias.reportValidity()

          // console.log('ADD CONTACT!', state, event)

          let fde = formDataEntries(event)
          let parsedAddr

          // console.log('scanContact', appDialogs.scanContact)

          if (fde?.intent === 'scan_new_contact') {
            await appDialogs.scanContact.render(
              {
                wallet,
              },
              'afterend',
            )

            let showScan = await appDialogs.scanContact.showModal()

            if (showScan !== 'cancel') {
              processURI(
                state,
                event.target,
                showScan,
              )
            }

            return;
          }

          if (!String(fde.contactAddr)?.trim()) {
            event.target.contactAddr.setCustomValidity(
              'An address, Xprv/Xpub or URI is required'
            )
            event.target.reportValidity()
            return;
          }

          let currentAlias = String(fde.contactAlias)?.trim()

          if (!currentAlias) {
            event.target.contactAlias.setCustomValidity(
              'An alias is required'
            )
            event.target.reportValidity()
            return;
          }

          if (
            startAlias !== currentAlias &&
            aliases.includes(currentAlias)
          ) {
            event.target.contactAlias.setCustomValidity(
              'Alias already used. A unique alias is required.'
            )
            event.target.reportValidity()
            return;
          }

          model.putContact({
            info: {
              name: event.target.contactName.value,
            },
            alias: currentAlias || event.target.contactAlias.value,
            uri: event.target.contactURI.value,
          })

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