import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  setClipboard,
  openBlobSVG,
  // generatePaymentRequestURI,
  generateContactPairingURI,
} from '../helpers/utils.js'

export let pairQrRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog,
  } = globals;

  let pairQr = setupDialog(
    mainApp,
    {
      name: 'Pairing info',
      address: '',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      placement: 'wide',
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      footer: state => html`<footer class="center">
        <sub>Share this QR code with your contact</sub>
      </footer>`,
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

          <fieldset class="share solo">
            <aside>
              <span title="Open QR Code in new Window">${svg}</span>
              <input readonly value="${link}" />
              <button id="pair-copy" class="pill rounded copy" title="Copy URI (${link})">
                <i class="icon-copy"></i>
                Copy URI
              </button>
            </aside>
          </fieldset>

          ${state.footer(state)}
        `
      },
      fields: html``,
      events: {
        handleClick: state => async event => {
          if (event.target === state.elements.dialog) {
            return state.elements.dialog.close('cancel')
          }

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

          console.log('Show Pairing info', state, event)

          pairQr.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.pairQr = pairQr;

  return pairQr
})

export default pairQrRig