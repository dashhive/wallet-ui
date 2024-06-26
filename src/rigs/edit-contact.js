import { lit as html } from '../helpers/lit.js'
import {
  deriveWalletData,
  formDataEntries,
  parseAddressField,
  getStoreData,
  debounce,
  getAvatar,
  getUniqueAlias,
  isUniqueAlias,
} from '../helpers/utils.js'

import {
  OIDC_CLAIMS,
  ALIAS_REGEX,
} from '../helpers/constants.js'

export let editContactRig = (async function (globals) {
  'use strict';

  let {
    setupDialog, appDialogs, appState, appTools, store,
    mainApp, userInfo, contactsList,
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

    let modifyContact = await appTools.storedData.encryptItem(
      store.contacts,
      state.shareAccount.xkeyId,
      contact,
      false,
    )

    state.contact = modifyContact

    // console.log('debounceField', field, localName, modifyContact)

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

  let editContact = await setupDialog(
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
      requestTxt: 'Receive',
      requestAlt: 'Receive Dash from Contact',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeAlt: `Close`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      placement: 'wide',
      header: state => html`
        <header class="no-brdr">
          <button
            class="pill rounded fs-3"
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
            value="receive"
            title="${state.requestAlt}"
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-down"></use>
            </svg>
            <span>${state.requestTxt}</span>
          </button>
        </footer>
      `,
      content: async state => html`
        <fieldset class="contact">
          <section>
            ${state.header(state)}
            <article>
              ${await getAvatar(state.contact)}
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
                  autocomplete="off"
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
            let ca = event.target?.value
            if (ca && ca.length >= 34) {
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

              let preferredAlias = await getUniqueAlias(
                aliases,
                preferred_username
              )

              let outgoing = {}

              if (!xkey && address) {
                outgoing = {
                  ...(state.contact.outgoing || {}),
                  [address]: {
                    address,
                  },
                }
              }

              if (xkey) {
                let {
                  xkeyId,
                  addressKeyId,
                  addressIndex,
                  address: addr,
                } = await deriveWalletData(
                  xkey,
                )

                // console.log(
                //   'add contact handleChange parsedAddr',
                //   event.target.value,
                //   xkey,
                // )

                outgoing = {
                  ...(state.contact.outgoing || {}),
                  [xkeyId]: {
                    addressIndex,
                    addressKeyId,
                    address: address || addr,
                    xkeyId,
                    xprv,
                    xpub,
                  },
                }
              }

              let modifyContact = await appTools.storedData.encryptItem(
                store.contacts,
                state.shareAccount.xkeyId,
                {
                  ...state.contact,
                  updatedAt: (new Date()).toISOString(),
                  info: {
                    ...OIDC_CLAIMS,
                    ...(state.contact.info || {}),
                    ...info,
                  },
                  outgoing,
                  alias: preferredAlias,
                  uri: event.target.value,
                },
                false,
              )

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
          if (
            event.target?.name === 'contactAlias' &&
            !event?.target?.validity?.patternMismatch
          ) {
            if (
              startAlias !== event.target?.value &&
              !isUniqueAlias(aliases, event.target?.value)
            ) {
              event.target.setCustomValidity(
                'Alias already used. A unique alias is required.'
              )
              event.target.reportValidity()
              return;
            }

            debounceField(['preferred_username', 'alias'], state, event)
          }
          if (
            event.target?.name === 'contactName' &&
            !event?.target?.validity?.patternMismatch
          ) {
            debounceField(['name'], state, event)
          }
        },
        handleClick: state => async event => {
          if (event.target === state.elements.dialog) {
            return state.elements.dialog.close('cancel')
          }

          let storedContact = await appTools.storedData.decryptItem(
            store.contacts,
            state.shareAccount.xkeyId,
          )
          let contactCard = state.elements?.dialog?.querySelector(
            'fieldset.contact > section > article:first-of-type'
          )

          if (
            event.target !== contactCard &&
            contactCard?.contains(event.target)
          ) {
            await appDialogs.pairQr.render(
              {
                name: `Pairing info for @${storedContact.alias}`,
                wallet: state.shareAccount,
                contact: storedContact,
                userInfo: state.userInfo,
                // userInfo,
                footer: state => html`<footer class="center"><sub>Share this QR code or URI with @${storedContact.alias}</sub></footer>`,
              },
              'afterend',
            )

            let showPairQR = await appDialogs.pairQr.showModal()
            return;
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

          // console.log('EDIT CONTACT!', state, event)

          let fde = formDataEntries(event)

          let storedContact = await appTools.storedData.decryptItem(
            store.contacts,
            state.shareAccount.xkeyId,
          )

          // console.log(
          //   'edit contact intent',
          //   fde?.intent,
          //   storedContact,
          // )

          if (['send','receive'].includes(String(fde?.intent))) {
            editContact.close()

            await appDialogs.sendOrReceive.render({
              action: fde.intent,
              wallet: state.wallet,
              account: appState.account,
              userInfo,
              contacts: appState.contacts,
              to: `@${storedContact.alias}`,
            })
            appDialogs.sendOrReceive.showModal()

            return;
          }

          if (fde?.intent === 'delete_contact') {
            await appDialogs.confirmDelete.render({
              shareAccount: state.shareAccount,
              userInfo,
              contacts: appState.contacts,
              contact: storedContact,
            })
            appDialogs.confirmDelete.showModal()

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
            !isUniqueAlias(aliases, currentAlias)
          ) {
            event.target.contactAlias.setCustomValidity(
              'Alias already used. A unique alias is required.'
            )
            event.target.reportValidity()
            return;
          }

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