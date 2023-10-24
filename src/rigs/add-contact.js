import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  deriveWalletData,
  formDataEntries,
  setClipboard,
  sortContactsByAlias,
  // sortContactsByName,
  parseAddressField,
} from '../helpers/utils.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9_\-\.]{1,}$/
)

export let addContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
    scanContact, contactsList, store, aliasWallets,
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
      content: state => {
        let shareParams = new URLSearchParams([
          ["xpub", state.wallet?.xpub || ''],
          [
            'name',
            aliasWallets?.info?.name || ''
          ],
          [
            'preferred_username',
            appState.selected_alias || ''
          ],
          ["sub", state.wallet?.xkeyId || ''],
          ['scope', 'sub,name,preferred_username,xpub']
        ]);
        let shareURI = new URL(`web+dash://?${shareParams}`)

        return html`
        ${state.header(state)}

        <fieldset class="share">
          <aside>
            <label for="pair-copy" title="${shareURI.toString()}">
              ${qrSvg(
                shareURI.toString(),
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
            </label>
            <input type="hidden" value="${shareURI.toString()}" />
            <button id="pair-copy" class="pill rounded copy" title="Copy URI (${shareURI.toString()})">
              <i class="icon-copy"></i>
              Copy URI
            </button>
            <sub>Share this QR code with your new contact</sub>
          </aside>

          <section>
            <article>
              <label for="contactAddress">
                Contact Address
              </label>
              <div>
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
                  pattern="${aliasRegex.source}"
                  spellcheck="false"
                />
              </div>
              <p>Alias for the contact (similar to a @username)</p>

              <div class="error"></div>
            </article>
          </section>
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
              let parsedAddr = parseAddressField(event.target.value)
              let {
                address,
                xpub,
                xprv,
                name,
                preferred_username,
              } = parsedAddr

              let xkey = xprv || xpub

              let xkeyOrAddr = xkey || address

              let info = {
                name,
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
                parsedAddr,
                xkey,
                // xkeyData,
              )

              let newContact = await store.contacts.setItem(
                // state.wallet.id,
                state.wallet.xkeyId,
                {
                  ...state.contact,
                  info: {
                    ...(state.contact.info || {}),
                    ...info,
                  },
                  wallets: {
                    ...(state.contact.wallets || {}),
                    [xkeyId]: {
                      addressIndex,
                      addressKeyId,
                      address: address || addr,
                      xprv,
                      xpub,
                    },
                  },
                }
              )

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
        },
        handleChange: state => async event => {
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

          // console.log(
          //   '+contact handleChange',
          //   event,
          //   event.target?.name,
          //   event.target?.value
          // )
          if (event.target?.name === 'contactAlias') {
            let newContact = await store.contacts.setItem(
              // state.wallet.id,
              state.wallet.xkeyId,
              {
                ...state.contact,
                info: {
                  ...(state.contact.info || {}),
                  preferred_username: event.target?.value,
                },
              }
            )

            let contactExists = appState.contacts.findIndex(
              c => c.info?.preferred_username === newContact.info?.preferred_username
            )
            if (contactExists > -1) {
              appState.contacts[contactExists] = newContact
            } else {
              appState.contacts.push(newContact)
            }

            contactsList.render(
              appState.contacts.sort(sortContactsByAlias)
            )
            // console.log(
            //   '+contact handleChange newContact',
            //   newContact
            // )
          }
        },
        handleClick: state => async event => {
          if (
            event.target?.classList?.contains('copy') ||
            event.target?.classList?.contains('icon-copy')
          ) {
            event.preventDefault()
            event.stopPropagation()
            setClipboard(event)
          }
        },
        handleRender: state => {
          console.log(
            '+contact app state & wallets',
            appState,
            state,
          )
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          // event.target.contactAlias.setCustomValidity('')
          // event.target.contactAlias.reportValidity()

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
            let scannedUrl = new URL(showScan)

            console.log(
              'showScan',
              showScan,
              scannedUrl,
              // scanContact,
              // scanContact?.element?.returnValue
            )
            let { searchParams, pathname } = scannedUrl
            let addr = pathname.replaceAll('//', '')
            let {
              xpub, name, preferred_username
            } = Object.fromEntries(
              searchParams?.entries()
            )
            let aOrX = addr || xpub

            if (aOrX) {
              // event.target.addr.value = addr
              event.target.contactAddr.value = aOrX
            }
            if (name) {
              // event.target.addr.value = addr
              event.target.contactName.value = name
            }
            if (preferred_username) {
              // event.target.addr.value = addr
              event.target.contactAlias.value = preferred_username
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
          let parsedAddr = parseAddressField(String(fde.contactAddr))
          let {
            address,
            xpub,
            xprv,
            // name,
            // preferred_username,
          } = parsedAddr

          let xkey = xprv || xpub

          // let xkeyOrAddr = xkey || address

          // let info = {
          //   name,
          //   preferred_username,
          // }

          let xkeyData = await deriveWalletData(
            xkey,
          )
          console.log(
            'xkeyData',
            xkeyData
          )

          let pairedContact = await store.contacts.setItem(
            // state.wallet.id,
            state.wallet.xkeyId,
            {
              ...storedContact,
              info: {
                ...(storedContact.info || {}),
                name: event.target.contactName.value,
                preferred_username: event.target.contactAlias.value,
              },
              uri: event.target.contactAddr.value,
            }
          )

          let contactExists = appState.contacts.findIndex(
            c => c.info?.preferred_username === pairedContact.info?.preferred_username
          )
          if (contactExists > -1) {
            appState.contacts[contactExists] = pairedContact
          } else {
            appState.contacts.push(pairedContact)
          }

          appState.contacts.sort(sortContactsByAlias);

          contactsList.render(appState.contacts)

          console.log('pairedContact', pairedContact)

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