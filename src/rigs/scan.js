import { lit as html } from '../helpers/lit.js'
// import {
//   formDataEntries,
// } from '../helpers/utils.js'

const aliasRegex = new RegExp(
  /^[a-zA-Z0-9]{1,}$/
)

export let scanContactRig = (function (globals) {
  'use strict';

  let {
    setupDialog, mainApp, wallet, wallets,
    appState, bodyNav, dashBalance, onboard,
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
            <sup>Hold the QR in front of your device camera</sup>
            <div class="scanner" id="${state.slugs.form}_reader"></div>

            <div class="updrop">
              <svg class="upload" width="40" height="40" viewBox="0 0 40 40">
                <use xlink:href="#icon-upload"></use>
              </svg>
              <span>Drag and drop the QR image or click to <strong><u>upload</u></strong></span>
            </div>
          </fieldset>

          ${state.footer(state)}
        `
      },
      fields: html``,
      events: {
        handleRender: state => {
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
            // (decodedText, decodedResult) => {
            //   // console.error(decodedText, decodedResult)
            // },
          )

          // let testScanFile = state.qrCodeScanner.scanFileV2(
          // )
        },
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          state.removeAllListeners()

          // console.log(
          //   'handle dialog close',
          //   event,
          //   // event.target === state.elements.dialog,
          //   // state.elements.dialog.returnValue,
          //   state.qrCodeScanner,
          // )

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

          // event.target.pass.setCustomValidity('')
          // event.target.pass.reportValidity()

          // console.log('ENCRYPT OVERRIDE!', state, event)

          // let fde = formDataEntries(event)

          // if (!fde.pass) {
          //   event.target.pass.setCustomValidity(
          //     'An encryption password is required'
          //   )
          //   event.target.reportValidity()
          //   return;
          // }

          // let initialized
          // wallet = state.wallet

          // if (!wallets?.[appState.selected_alias]) {
          //   initialized = await initWallet(
          //     appState.encryptionPassword,
          //     wallet,
          //     0,
          //     0,
          //     {
          //       preferred_username: appState.selected_alias,
          //     }
          //   )
          //   wallets = initialized.wallets
          // }

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