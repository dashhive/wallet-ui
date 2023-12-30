import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  loadStore,
  sortContactsByAlias,
} from '../helpers/utils.js'

export let confirmDeleteRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState,
    store, userInfo, contactsList,
  } = globals

  let confirmDelete = setupDialog(
    mainApp,
    {
      name: 'Confirm Remove',
      removeTxt: 'Remove',
      removeAlt: 'Remove',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Cancel & Close`,
      amount: 0,
      footer: state => html`
        <footer class="inline row">
          <button
            class="rounded outline"
            type="reset"
            name="intent"
            value="cancel"
            title="${state.cancelAlt}"
          >
            <span>${state.cancelTxt}</span>
          </button>
          <button
            class="rounded bg-warn dark bg-dang-hover"
            type="submit"
            name="intent"
            value="delete"
            title="${state.removeAlt}"
          >
            <svg class="trash-icon" width="16" height="16" viewBox="0 0 16 16">
              <use xlink:href="#icon-trash"></use>
            </svg>
            <span>${state.removeTxt}</span>
          </button>
        </footer>
      `,
      getContact: state => {
        let name = state.contact?.info?.name
        let alias = state.contact?.alias

        return `<h4>@${alias}</h4>`
      },
      content: state => html`
        ${state.header(state)}

        <article class="px-0 col">
          <strong>
            Are you sure you want to delete ${state.contact?.info?.name || 'this contact'}?
          </strong>
          <div>${state.getContact(state)}</div>
        </article>

        ${state.footer(state)}
      `,
      events: {
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          // event.stopPropagation()
          state.removeAllListeners()

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            resolve('cancel')
          }
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          // let storedContact = await store.contacts.getItem(
          //   state.shareAccount.xkeyId,
          // )

          if (fde?.intent === 'delete') {
            let removedContact = await store.contacts.removeItem(
              state.shareAccount.xkeyId,
            )

            console.log('delete contact', removedContact)

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

            appDialogs.editContact.close()
            confirmDelete.close(fde.intent)
          }
        },
      },
    }
  )

  // @ts-ignore
  globals.confirmDelete = confirmDelete;

  return confirmDelete
})

export default confirmDeleteRig