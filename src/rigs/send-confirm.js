import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  loadStore,
  sortContactsByAlias,
} from '../helpers/utils.js'

export let sendConfirmRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState,
    deriveWalletData, sendTx, store, userInfo, contactsList,
  } = globals

  let sendConfirm = setupDialog(
    mainApp,
    {
      name: 'Confirm Send',
      sendTxt: 'Send',
      sendAlt: 'Send Dash',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Send`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
        <use xlink:href="#icon-x"></use>
      </svg>`,
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
        </footer>
      `,
      getContact: state => {
        let to = state.contact?.info?.name
        if (!to && state.contact?.alias) {
          to = `@${state.contact?.alias}`
        }
        if (!to) {
          to = state.to
        }
        return to
      },
      showAmount: state => {
        if (!state.amount) {
          return ''
        }

        return html`
          <article>
            <figure>
              <figcaption>Amount</figcaption>
              <div class="big">
                <svg width="32" height="33" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${state.amount}
              </div>
            </figure>
          </article>
        `
      },
      content: state => html`
        ${state.header(state)}

        <article>
          <figure>
            <figcaption>To</figcaption>
            <div>${state.getContact(state)}</div>
          </figure>
        </article>

        ${state.showAmount(state)}

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
          // event.target.to.setCustomValidity(
          //   ''
          // )
          // event.target.to.reportValidity()

          let fde = formDataEntries(event)

          // if (fde.intent === 'send' && !fde.to) {
          //   event.target.to.setCustomValidity(
          //     'You must specify a contact or address to send to'
          //   )
          //   event.target.to.reportValidity()
          //   return;
          // }

          let outWallet, inWallet, address, addressIndex, txRes
          let sendWallet = {}

          if (state.contact) {
            outWallet = Object.values(state.contact?.outgoing)?.[0]
            inWallet = Object.values(state.contact?.incoming)?.[0]
          }

          if (fde.intent === 'send') {
            if (outWallet) {
              addressIndex = outWallet?.addressIndex + 1
              sendWallet = await deriveWalletData(
                outWallet?.xpub,
                0,
                addressIndex,
              )
              address = sendWallet.address
            } else {
              address = state.to
            }

            if (state.amount > 0) {
              txRes = await sendTx(
                state.wallet,
                address,
                state.amount,
              )
            }

            if (txRes && addressIndex !== undefined) {
              store.contacts
                .getItem(inWallet.xkeyId)
                .then(async c => {
                  await store.contacts.setItem(
                    inWallet.xkeyId,
                    {
                      ...c,
                      outgoing: {
                        ...c.outgoing,
                        [outWallet.xkeyId]: {
                          ...c.outgoing[outWallet.xkeyId],
                          addressIndex,
                        }
                      }
                    }
                  )

                  loadStore(store.contacts, res => {
                    if (res) {
                      appState.contacts = res

                      return contactsList.restate({
                        contacts: res?.sort(sortContactsByAlias),
                        userInfo,
                      })
                    }
                  })
                })
            }

            console.log(
              `${fde.intent} TO ${address}`,
              `Ð ${state.amount || 0}`,
              state.contact,
              txRes,
              // {
              //   xkeyId: outWallet?.xkeyId,
              //   addressKeyId: outWallet?.addressKeyId,
              //   addressIndex: outWallet?.addressIndex,
              //   address: outWallet?.address,
              // },
              // {
              //   xkeyId: sendWallet?.xkeyId,
              //   addressKeyId: sendWallet?.addressKeyId,
              //   addressIndex: sendWallet?.addressIndex,
              //   address,
              // },
            )
          }

          sendConfirm.close(fde.intent)
          appDialogs.sendOrRequest.close(fde.intent)
        },
      },
    }
  )

  // @ts-ignore
  globals.sendConfirm = sendConfirm;

  return sendConfirm
})

export default sendConfirmRig