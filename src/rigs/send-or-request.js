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
  } = globals;

  let inputAmount = setupInputAmount(
    mainApp,
    {}
  )

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
            <div>
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
                  (state.contacts || []).map(contact => {
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
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()
          event.target.to.setCustomValidity(
            ''
          )
          event.target.to.reportValidity()

          let fde = formDataEntries(event)

          if (fde?.intent === 'scan_new_contact') {
            appDialogs.scanContact.render(
              {
                wallet,
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

          if (String(fde.to).startsWith('@')) {
            let cAlias = String(fde.to).substring(1)
            let contact = state.contacts.find(c => c.alias === cAlias)
            let inWallet = Object.values(contact?.incoming)?.[0]
            let outWallet = Object.values(contact?.outgoing)?.[0]

            if (fde.intent === 'send') {
              let {
                xkeyId,
                addressKeyId,
                addressIndex,
                address: addr,
              } = await deriveWalletData(
                outWallet?.xpub,
                0,
                outWallet?.addressIndex + 1,
              )

              console.log(
                `${fde.intent} TO CONTACT`,
                contact,
                {
                  xkeyId: outWallet?.xkeyId,
                  addressKeyId: outWallet?.addressKeyId,
                  addressIndex: outWallet?.addressIndex,
                  address: outWallet?.address,
                },
                {
                  xkeyId,
                  addressKeyId,
                  addressIndex,
                  address: addr,
                },
              )
            }
            if (fde.intent === 'request') {
              let {
                xkeyId,
                addressKeyId,
                addressIndex,
                address: addr,
              } = await deriveWalletData(
                inWallet?.xpub,
                0,
                inWallet?.addressIndex + 1,
              )

              console.log(
                `${fde.intent} TO CONTACT`,
                contact,
                {
                  xkeyId: inWallet?.xkeyId,
                  addressKeyId: inWallet?.addressKeyId,
                  addressIndex: inWallet?.addressIndex,
                  address: inWallet?.address,
                },
                {
                  xkeyId,
                  addressKeyId,
                  addressIndex,
                  address: addr,
                },
              )
            }

            return;
          }

          sendOrRequest.close(fde.intent)
        },
      },
    }
  )

  // @ts-ignore
  globals.sendOrRequest = sendOrRequest;

  return sendOrRequest
})

export default sendOrRequestRig