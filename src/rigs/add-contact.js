import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  deriveWalletData,
  formDataEntries,
  setClipboard,
  openBlobSVG,
  sortContactsByAlias,
  // sortContactsByName,
  parseAddressField,
  generateContactPairingURI,
  loadStore,
  debounce,
  // nobounce,
} from '../helpers/utils.js'

import {
  OIDC_CLAIMS,
  ALIAS_REGEX,
} from '../helpers/constants.js'

export let addContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, userInfo, contactsList,
    updateAllFunds, walletFunds,
  } = globals;

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

    let newContact = await store.contacts.setItem(
      // state.wallet.id,
      state.wallet.xkeyId,
      contact,
    )

    state.contact = newContact

    console.log('debounceField', field, localName, newContact)

    loadStore(
      store.contacts,
      res => {
        if (res) {
          appState.contacts = res

          return contactsList.restate({
            contacts: res?.sort(sortContactsByAlias),
            userInfo,
          })
        }
      }
    )
  }, 1000)

  let addContact = setupDialog(
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
              let {
                address,
                xpub,
                xprv,
                name,
                preferred_username,
                sub,
              } = parseAddressField(event.target.value)

              let xkey = xprv || xpub

              let xkeyOrAddr = xkey || address

              let info = {
                name: name || '',
                sub,
                preferred_username,
              }

              let {
                xkeyId,
                addressKeyId,
                addressIndex,
                address: addr,
              } = await deriveWalletData(
                xkey,
              )

              console.log(
                'add contact handleChange parsedAddr',
                event.target.value,
                xkey,
              )

              let newContact = await store.contacts.setItem(
                // state.wallet.id,
                state.wallet.xkeyId,
                {
                  ...state.contact,
                  info: {
                    ...OIDC_CLAIMS,
                    ...(state.contact.info || {}),
                    ...info,
                  },
                  outgoing: {
                    ...(state.contact.outgoing || {}),
                    [xkeyId]: {
                      addressIndex,
                      addressKeyId,
                      address: address || addr,
                      xkeyId,
                      xprv,
                      xpub,
                    },
                  },
                  alias: preferred_username,
                  uri: event.target.value,
                }
              )

              loadStore(
                store.contacts,
                res => {
                  if (res) {
                    appState.contacts = res

                    return contactsList.restate({
                      contacts: res?.sort(sortContactsByAlias),
                      userInfo,
                    })
                  }
                }
              )

              state.contact = newContact

              if (xkeyOrAddr) {
                event.target.form.contactAddr.value = xkeyOrAddr
              }
              if (name) {
                event.target.form.contactName.value = name
              }
              if (preferred_username) {
                event.target.form.contactAlias.value = preferred_username
              }
            }
          }
          if (
            event.target?.name === 'contactAlias' &&
            !event?.target?.validity?.patternMismatch
          ) {
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
        handleRender: state => {},
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          // event.target.contactAlias.setCustomValidity('')
          // event.target.contactAlias.reportValidity()

          console.log('ADD CONTACT!', state, event)

          let fde = formDataEntries(event)
          let parsedAddr

          console.log('scanContact', appDialogs.scanContact)

          if (fde?.intent === 'scan_new_contact') {
            appDialogs.scanContact.render(
              {
                wallet,
              },
              'afterend',
            )

            let showScan = await appDialogs.scanContact.showModal()

            if (showScan !== 'cancel') {
              parsedAddr = parseAddressField(showScan)
              let {
                address,
                xpub,
                xprv,
                name,
                preferred_username,
                sub,
              } = parsedAddr

              let xkey = xprv || xpub

              let xkeyOrAddr = xkey || address

              if (xkeyOrAddr) {
                event.target.contactAddr.value = xkeyOrAddr
              }
              if (name) {
                event.target.contactName.value = name
              }
              if (preferred_username) {
                event.target.contactAlias.value = preferred_username
              }
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

          if (!String(fde.contactAlias)?.trim()) {
            event.target.contactAlias.setCustomValidity(
              'An alias is required'
            )
            event.target.reportValidity()
            return;
          }

          let storedContact = await store.contacts.getItem(
            state.wallet.xkeyId,
          )

          let pairedContact = await store.contacts.setItem(
            // state.wallet.id,
            state.wallet.xkeyId,
            {
              ...storedContact,
              info: {
                // ...OIDC_CLAIMS,
                ...(storedContact.info || {}),
                // @ts-ignore
                sub: parsedAddr?.sub || '',
                name: event.target.contactName.value,
              },
              uri: event.target.contactAddr.value,
              alias: event.target.contactAlias.value,
            }
          )

          // let contactExists = appState.contacts.findIndex(
          //   c => c.info?.preferred_username === pairedContact.info?.preferred_username
          // )
          // if (contactExists > -1) {
          //   appState.contacts[contactExists] = pairedContact
          // } else {
          //   appState.contacts.push(pairedContact)
          // }

          // appState.contacts.sort(sortContactsByAlias);

          // contactsList.render(appState.contacts)

          loadStore(
            store.contacts,
            res => {
              if (res) {
                appState.contacts = res

                updateAllFunds(state.wallet, walletFunds)
                  .then(funds => {
                    // walletFunds.balance = funds
                    console.log('updateAllFunds then funds', funds)
                  })
                  .catch(err => console.error('catch updateAllFunds', err, state.wallet))

                return contactsList.restate({
                  contacts: res?.sort(sortContactsByAlias),
                  userInfo,
                })
              }
            }
          )

          console.log('pairedContact', pairedContact)

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