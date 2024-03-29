import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  formDataEntries,
  setClipboard,
  openBlobSVG,
  generatePaymentRequestURI,
  fixedDash,
  roundUsing,
} from '../helpers/utils.js'

export let requestQrRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState, userInfo,
  } = globals;

  let requestQr = await setupDialog(
    mainApp,
    {
      name: 'Share to receive funds',
      address: '',
      submitTxt: html`<svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#icon-arrow-circle-down"></use></svg> Receive Payment`,
      submitAlt: 'Receive Payment',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      placement: 'wide',
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      amount: 0,
      footer: state => html`<footer class="center">
        <sub>Share this QR code to receive funds</sub>
      </footer>`,
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
      aliasSelector: state => {
        return html`
          <input
            type="text"
            id="${state.slugs.form}_to"
            name="to"
            placeholder="enter @alias or dash address"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            list="contactAliases"
            value="${state.to || ''}"
          />
        `
      },
      content: state => html`
        ${state.header(state)}

        <fieldset class="share solo">
          <aside>
            ${state.showAmount(state)}
            <span class="qr" title="Open QR Code in new Window">${qrSvg(
              generatePaymentRequestURI(state),
              {
                indent: 0,
                padding: 4,
                size: 'mini',
                container: 'svg-viewbox',
                join: true,
              }
            )}</span>
            <input readonly value="${generatePaymentRequestURI(state)}" />
            <button id="pair-copy" class="pill rounded copy" title="Copy URI (${generatePaymentRequestURI(state)})">
              <i class="icon-copy"></i>
              Copy URI
            </button>
          </aside>
        </fieldset>

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleClick: state => async event => {
          if (event.target === state.elements.dialog) {
            return state.elements.dialog.close('cancel')
          }

          let shareAside = state.elements?.dialog?.querySelector(
            'fieldset.share > aside'
          )
          let qrWrapper = state.elements?.dialog?.querySelector(
            'fieldset.share > aside .qr'
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
              event.target?.nodeName.toLowerCase() === 'svg' &&
              qrWrapper?.contains(event.target)
            ) {
              event.preventDefault()
              event.stopPropagation()

              openBlobSVG(event.target)
            }
            if (
              event.target?.parentElement?.nodeName.toLowerCase() === 'svg' &&
              qrWrapper?.contains(event.target)
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

          let fde = formDataEntries(event)

          if (fde?.intent === 'select_address') {
            // console.log('SELECT AN ADDRESS', {state, event, fde})

            await appDialogs.sendOrReceive.render({
              action: 'receive',
              wallet: state.wallet,
              account: appState.account,
              contacts: appState.contacts,
              userInfo,
              to: null,
            })
            appDialogs.sendOrReceive.showModal()

            return;
          }
          // else {
          //   console.log('Receive Payment', {state, event})
          // }


          requestQr.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.requestQr = requestQr;

  return requestQr
})

export default requestQrRig