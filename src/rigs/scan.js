import { lit as html } from '../helpers/lit.js'
// import {
//   formDataEntries,
// } from '../helpers/utils.js'

export let scanContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp,
  } = globals;

  let scanContact = setupDialog(
    mainApp,
    {
      name: 'Scan a Contact',
      submitTxt: html``,
      submitAlt: 'Scan Contact',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
        <use xlink:href="#icon-x"></use>
      </svg>`,
      closeAlt: `Close`,
      footer: state => html``,
      content: state => {

        return html`
          ${state.header(state)}

          <fieldset class="px-6">
            <div class="scanner" id="${state.slugs.form}_reader"></div>
            <sup>Hold the QR in front of your device camera</sup>

            <!-- <div class="updrop">
              <svg class="upload" width="40" height="40" viewBox="0 0 40 40">
                <use xlink:href="#icon-upload"></use>
              </svg>
              <span>Drag and drop the QR image or click to <strong><u>upload</u></strong></span>
            </div> -->
          </fieldset>

          ${state.footer(state)}
        `
      },
      fields: html``,
      events: {
        handleRender: state => {
          // @ts-ignore
          state.qrCodeScanner = new Html5Qrcode(
            `${state.slugs.form}_reader`,
            {
              // formatsToSupport: [
              //   Html5QrcodeSupportedFormats.QR_CODE,
              // ],
              // supportedScanTypes: [
              //   Html5QrcodeScanType.SCAN_TYPE_CAMERA,
              //   Html5QrcodeScanType.SCAN_TYPE_FILE,
              // ],
            },
          )

          console.log(
            'handle scan render',
            state.qrCodeScanner,
          )

          state.qrCodeScanner.start(
            {
              facingMode: "environment"
            },
            {
              fps: 10, qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
              console.log(decodedText, decodedResult)
              if (decodedText.includes('dash:')) {
                state.qrCodeScanner.stop()
                scanContact.close(decodedText)
              }
            },
          )
        },
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          state.removeAllListeners()

          if (state.qrCodeScanner?.isScanning) {
            state.qrCodeScanner.stop()
          }

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            resolve('cancel')
          }

          setTimeout(t => {
            state.rendered = null
            event?.target?.remove()
          }, state.delay)
        },
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          scanContact.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.scanContact = scanContact;

  return scanContact
})

export default scanContactRig