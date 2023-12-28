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
  getAvatar,
} from '../helpers/utils.js'

import {
  OIDC_CLAIMS,
  ALIAS_REGEX,
} from '../helpers/constants.js'

export let editContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, store,
    mainApp, wallet, userInfo, contactsList,
    updateAllFunds, walletFunds,
  } = globals;

  let debounceField = debounce(async ([field, localName], state, event) => {
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

    let modifyContact = await store.contacts.setItem(
      // state.wallet.id,
      // state.account.xkeyId,
      state.shareAccount.xkeyId,
      contact,
    )

    state.contact = modifyContact

    console.log('debounceField', field, localName, modifyContact)

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

  let editContact = setupDialog(
    mainApp,
    {
      name: 'Edit Contact',
      submitTxt: html`<svg class="plus-circle" width="26" height="26" viewBox="0 0 16 16">
        <use xlink:href="#icon-plus-circle"></use>
      </svg> Add Contact`,
      submitAlt: 'Add Contact',
      trashAlt: 'Remove Contact',
      sendTxt: 'Send',
      sendAlt: 'Send Dash to Contact',
      requestTxt: 'Request',
      requestAlt: 'Request Dash from Contact',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeAlt: `Close`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      placement: 'wide',
      header: state => html`
        <header class="no-brdr">
          <button
            class="rounded link fs-3"
            name="intent"
            value="delete_contact"
            title="${state.trashAlt}"
          >
            <span>
              <svg class="trash-icon" width="16" height="16" viewBox="0 0 16 16">
                <use xlink:href="#icon-trash"></use>
              </svg>
              Delete
            </span>
          </button>
          ${
            state.closeTxt && html`<button class="link" type="reset" value="close" title="${state.closeAlt}"><span>${state.closeTxt}</span></button>`
          }
        </header>
      `,
      footer: state => html`
        <footer class="inline row">
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="send"
            title="${state.sendAlt}"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-up"></use>
            </svg>
            <span>${state.sendTxt}</span>
          </button>
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="request"
            title="${state.requestAlt}"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-down"></use>
            </svg>
            <span>${state.requestTxt}</span>
          </button>
        </footer>
      `,
      content: state => html`
        <fieldset class="contact">
          <section>
            ${state.header(state)}
            <article>
              ${getAvatar(state.contact)}
              <h3>@${state.contact?.alias || state.contact?.info?.preferred_username}</h3>
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
                  value="${state.contact?.info?.name}"
                />
              </div>
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
                  value="${state.contact?.alias}"
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
                name,
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

              let modifyContact = await store.contacts.setItem(
                // state.wallet.id,
                state.shareAccount.xkeyId,
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

              state.contact = modifyContact

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
          if (event.target?.name === 'contactAlias') {
            debounceField(['preferred_username', 'alias'], state, event)
          }
          if (event.target?.name === 'contactName') {
            debounceField(['name'], state, event)
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
          let storedContact = await store.contacts.getItem(
            state.shareAccount.xkeyId,
          )

          console.log('edit contact intent', fde?.intent, storedContact)

          if (['send','request'].includes(String(fde?.intent))) {

            editContact.close()

            appDialogs.sendOrRequest.render({
              wallet: state.wallet,
              account: appState.account,
              userInfo,
              contacts: appState.contacts,
              to: `@${storedContact.alias}`,
            })
            appDialogs.sendOrRequest.showModal()

            return;
          }

          if (fde?.intent === 'delete_contact') {
            let removedContact = await store.contacts.removeItem(
              state.shareAccount.xkeyId,
            )

            console.log('delete contact', storedContact, removedContact)

            loadStore(
              store.contacts,
              res => {
                if (res) {
                  appState.contacts = res

                  updateAllFunds(state.shareAccount, walletFunds)
                    .then(funds => {
                      // walletFunds.balance = funds
                      console.log('updateAllFunds then funds', funds)
                    })
                    .catch(err => console.error('catch updateAllFunds', err, state.shareAccount))

                  return contactsList.restate({
                    contacts: res?.sort(sortContactsByAlias),
                    userInfo,
                  })
                }
              }
            )

            editContact.close()

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

          // let storedContact = await store.contacts.getItem(
          //   state.shareAccount.xkeyId,
          // )

          let pairedContact = await store.contacts.setItem(
            // state.wallet.id,
            state.shareAccount.xkeyId,
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

                updateAllFunds(state.shareAccount, walletFunds)
                  .then(funds => {
                    // walletFunds.balance = funds
                    console.log('updateAllFunds then funds', funds)
                  })
                  .catch(err => console.error('catch updateAllFunds', err, state.shareAccount))

                return contactsList.restate({
                  contacts: res?.sort(sortContactsByAlias),
                  userInfo,
                })
              }
            }
          )

          console.log('pairedContact', pairedContact)

          // let initialized
          // wallet = state.shareAccount

          // if (!wallets?.[appState.selectedAlias]) {
          //   initialized = await initWallet(
          //     appState.encryptionPassword,
          //     wallet,
          //     0,
          //     0,
          //     {
          //       preferred_username: appState.selectedAlias,
          //     }
          //   )
          //   wallets = initialized.wallets
          // }

          editContact.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.editContact = editContact;

  return editContact
})

export default editContactRig