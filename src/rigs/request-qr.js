import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  setClipboard,
  openBlobSVG,
  generatePaymentRequestURI,
} from '../helpers/utils.js'

export let requestQrRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog,
  } = globals;

  let requestQr = setupDialog(
    mainApp,
    {
      name: 'Share to receive funds',
      address: '',
      submitTxt: html`<svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#icon-arrow-circle-down"></use></svg> Request Payment`,
      submitAlt: 'Request Payment',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      placement: 'wide',
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      amount: 0,
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
              <figcaption>Request Amount</figcaption>
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

        <fieldset class="share solo">
          <aside>
            <!-- <article>
              <figure>
                <figcaption>To</figcaption>
                <div>${state.getContact(state)}</div>
              </figure>
            </article> -->
            ${state.showAmount(state)}
            <span title="Open QR Code in new Window">${qrSvg(
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

          console.log('Request Payment', state, event)

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