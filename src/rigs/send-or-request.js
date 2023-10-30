import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'
import setupInputAmount from '../components/input-amount.js'

export let sendOrRequestRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs,
    wallet, deriveWalletData,
  } = globals

  let inputAmount = setupInputAmount(mainApp)

  let sendOrRequest = setupDialog(
    mainApp,
    {
      name: 'Send or Request',
      sendTxt: 'Send',
      sendAlt: 'Send Dash',
      requestTxt: 'Request',
      requestAlt: 'Request Dash',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Form`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
      <use xlink:href="#icon-x"></use>
    </svg>`,
      closeAlt: `Close`,
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
        ${state.header(state)}

        <fieldset>
          <article>
            <!-- <label for="to">
              To
            </label> -->
            <div class="input">
              <input
                type="text"
                id="${state.slugs.form}_to"
                name="to"
                placeholder="enter @alias or dash address"
                spellcheck="false"
                list="contactAliases"
              />

              <button
                class="rounded outline"
                type="submit"
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

              <datalist id="contactAliases">
                ${
                  (state.contacts || []).filter(c => c.alias).map(contact => {
                    return html`<option value="@${
                      contact.alias
                    }">${
                      contact.info?.name || contact.alias
                    }</option>`
                  })
                }
              </datalist>
            </div>

            ${inputAmount.renderAsHTML()}

            <div class="error"></div>
          </article>
        </fieldset>

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
        handleFocus: state => event => {
          // event.preventDefault()
          // console.log(
          //   'handle input focus',
          //   event,
          // )
          event.target.setCustomValidity('')
          event.target.reportValidity()
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()
          event.target.to.setCustomValidity('')
          event.target.to.reportValidity()
          event.target.amount.setCustomValidity('')
          event.target.amount.reportValidity()

          let fde = formDataEntries(event)
          console.warn(
            'FORM INTENT',
            fde.intent,
            [event.target],
          )

          if (fde?.intent === 'scan_new_contact') {
            appDialogs.scanContact.render(
              {
                wallet: state.wallet,
              },
              'afterend',
            )

            let showScan = await appDialogs.scanContact.showModal()
            console.log(
              'showScan',
              showScan,
              // scanContact,
              // scanContact?.element?.returnValue
            )
            let [, addr] = showScan?.split('dash://')
            if (addr) {
              // event.target.addr.value = addr
              event.target.to.value = showScan
            }
            return;
          }

          if (fde.intent === 'send' && !fde.to) {
            event.target.to.setCustomValidity(
              'You must specify a contact or address to send to'
            )
            event.target.to.reportValidity()
            return;
          }

          if (fde.intent === 'send' && (!fde.amount || Number(fde.amount) === 0)) {
            event.target.amount.setCustomValidity(
              'You must specify an amount to send'
            )
            event.target.amount.reportValidity()
            return;
          }

          let inWallet, contact, to = String(fde.to)
          let receiveWallet = {}

          if (to.startsWith('@')) {
            contact = state.contacts.find(c => c.alias === to.substring(1))
            inWallet = Object.values(contact?.incoming)?.[0]
          }

          if (fde.intent === 'send') {
            console.log(
              `CONFIRM ${fde.intent} TO`,
              contact,
              `Ð ${fde.amount || 0}`,
            )

            appDialogs.sendConfirm.render(
              {
                wallet: state.wallet,
                contact,
                to,
                amount: Number(fde.amount),
              },
              'afterend',
            )

            let showConfirm = await appDialogs.sendConfirm.showModal()
          }

          if (fde.intent === 'request') {
            receiveWallet = await deriveWalletData(
              inWallet?.xpub,
              0,
              inWallet?.addressIndex + 1,
            )
            //   address = receiveWallet.address
            // } else {
            //   address = state.to
            // }

            console.log(
              `${fde.intent} TO CONTACT`,
              `Ð ${fde.amount || 0}`,
              contact,
              receiveWallet,
              // {
              //   xkeyId: inWallet?.xkeyId,
              //   addressKeyId: inWallet?.addressKeyId,
              //   addressIndex: inWallet?.addressIndex,
              //   address: inWallet?.address,
              // },
              // {
              //   xkeyId,
              //   addressKeyId,
              //   addressIndex,
              //   address: addr,
              // },
            )

            appDialogs.requestQr.render(
              {
                wallet: receiveWallet,
                contact,
                to,
                amount: Number(fde.amount),
              },
              'afterend',
            )

            let showRequestQR = await appDialogs.requestQr.showModal()
          }

          // return;

          // sendOrRequest.close(fde.intent)
        },
      },
    }
  )

  // @ts-ignore
  globals.sendOrRequest = sendOrRequest;

  return sendOrRequest
})

export default sendOrRequestRig