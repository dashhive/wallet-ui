import {
  DEFAULT_ENTRYPOINT,
} from '../utils/constants.js'

import {
  lit as html,
  formDataEntries,
  setClipboard,
  openBlobSVG,
} from '../utils/generic.js'

import {
  store,
  batchGenAcctAddrs,
  deriveWalletData,
  generatePaymentRequestURI,
  getPartialHDPath,
  getAddressIndexFromUsage,
} from '../utils/dash/local.js'

import { qrSvg } from '../utils/qr.js'

import {
  appState,
  appTools,
  appDialogs,
} from '../store/index.js'

import {
  userInfo,
} from '../state/index.js'

import setupDialog from '../components/dialog.js'

export let requestQrRig = (async function (globals) {
  'use strict';

  console.log('requestQrRig', {globals})

  let requestQr = await setupDialog(
    DEFAULT_ENTRYPOINT,
    {
      name: 'Share to receive funds',
      address: '',
      submitTxt: html`<svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#icon-arrow-circle-down"></use></svg> Receive Payment`,
      submitAlt: 'Receive Payment',
      generateAddrTxt: 'Generate New Address',
      generateAddrAlt: 'Generate new address',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      placement: 'wide',
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      amount: 0,
      footer: state => html`<footer class="center">
        <sub>Share this QR code to receive funds</sub>
      </footer>`,
      getContact: state => {
        let to = state.contact?.info?.name
        if (!to && state.contact?.alias) {
          to = `@${state.contact?.alias}`
        }
        if (!to) {
          to = state.to || ''
        }
        return to
      },
      showFrom: state => {
        let contact = state.getContact(state)

        if (contact) {
          return html`From <span>${contact}</span>`
        }

        if (state.amount) {
          return html`Amount`
        }

        return html``
      },
      showAmount: state => {
        let output = html``

        if (state.amount) {
          output = html`
            <div class="big">
              <svg width="26" height="27" viewBox="0 0 32 33">
                <use xlink:href="#icon-dash-mark"></use>
              </svg>
              ${state.amount}
            </div>
          `
        }

        return output
      },
      showContactAndAmount: state => {
        return html`
          <article>
            <figure>
              <figcaption class="txt-small">
                ${state.showFrom(state)}
              </figcaption>
              ${state.showAmount(state)}
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
      fieldsetHeader: state => {
        return html`
          <div class="">
            <button
              class="pill rounded"
              type="submit"
              name="intent"
              value="generate_address"
              title="${state.generateAddrAlt}"
            >
              <span>
                <i class="icon-plus-circle"></i>
                ${state.generateAddrTxt}
              </span>
            </button>
          </div>
        `
      },
      content: state => html`
        ${state.header(state)}

        <fieldset class="share solo">
          <aside>
            ${state.fieldsetHeader(state)}
            ${state.showContactAndAmount(state)}
            <span class="qr" title="Open QR Code in new Window">
              ${qrSvg(
                generatePaymentRequestURI(state),
                {
                  indent: 0,
                  padding: 4,
                  size: 'mini',
                  container: 'svg-viewbox',
                  join: true,
                }
              )}
            </span>
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
        handleClose: (
          state,
          resolve = res=>{},
          reject = res=>{},
        ) => async event => {
          event.preventDefault()
          // event.stopPropagation()
          state.removeAllListeners()

          state.contact = null
          state.amount = 0
          state.to = null

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            resolve('cancel')
          }

          await requestQr.render(
            {
              wallet: state.wallet,
              selectedWallet: state.wallet,
              amount: state.amount,
              contact: state.contact,
              to: state.to,
            },
            'afterend',
          )

          setTimeout(t => {
            state.modal.rendered[state.slugs.dialog] = null
            event?.target?.remove()
          }, state.delay)
        },
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
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          let tmpAcct = await store.accounts.getItem(
            state.wallet.xkeyId,
          ) || {}
          let tmpAcctWallet = getAddressIndexFromUsage(state.wallet, tmpAcct)

          let storedPath = getPartialHDPath(tmpAcctWallet)
          let oldPath = getPartialHDPath(state.wallet)

          let nextAddrIndex = (tmpAcctWallet?.addressIndex ?? -1)

          if (nextAddrIndex < state.wallet.addressIndex) {
            nextAddrIndex = state.wallet.addressIndex
          }

          if (fde?.intent === 'generate_address') {
            nextAddrIndex = nextAddrIndex + 1
          }

          state.wallet = await deriveWalletData(
            appState.phrase,
            tmpAcctWallet.accountIndex,
            nextAddrIndex,
            tmpAcctWallet.usageIndex,
          )
          state.selectedWallet = state.wallet

          tmpAcct.usage[
            state.wallet.usageIndex
          ] = state.wallet.addressIndex

          let newPath = getPartialHDPath(state.wallet)

          if (fde?.intent === 'generate_address') {
            tmpAcct = await store.accounts.setItem(
              state.wallet.xkeyId,
              {
                ...tmpAcct,
                updatedAt: (new Date()).toISOString(),
                address: state.wallet.address,
              }
            )

            batchGenAcctAddrs(
              state.wallet,
              tmpAcct,
              state.wallet.usageIndex,
            )
              .then(a => {
                console.log(
                  `${fde.intent} BATCH GEN ADDRS`,
                  a
                )
              })

            let contact, inWallet

            if (state.to?.startsWith('@')) {
              contact = appState.contacts.find(
                c => c.alias === state.to.substring(1)
              )
              inWallet = Object.values(contact?.incoming || {})?.[0]
            }

            if (contact) {
              await appTools.storedData.encryptItem(
                store.contacts,
                tmpAcct.xkeyId,
                {
                  ...contact,
                  updatedAt: (new Date()).toISOString(),
                  incoming: {
                    ...contact.incoming,
                    [`${inWallet.walletId}/${inWallet.xkeyId}`]: {
                      ...inWallet,
                      ...tmpAcct,
                    }
                  },
                },
                false,
              )
            }

            console.log(
              'GENERATE NEW ADDRESS',
              {state, event, fde, tmpAcct},
              [
                storedPath,
                oldPath,
                newPath,
              ],
            )

            await requestQr.render(
              {
                wallet: state.wallet,
                selectedWallet: state.wallet,
                amount: state.amount,
                contact: state.contact,
                to: state.to,
              },
              'afterend',
            )

            return;
          }
          if (fde?.intent === 'select_address') {
            console.log(
              'SELECT AN ADDRESS',
              {state, event, fde, tmpAcct},
              [
                storedPath,
                oldPath,
                newPath,
              ]
            )

            await appDialogs.sendOrReceive.render({
              action: 'receive',
              amount: state.amount || 0,
              wallet: state.selectedWallet || state.wallet,
              account: appState.account,
              contacts: appState.contacts,
              userInfo,
              to: state.to || null,
              contact: state.contact,
            })
            appDialogs.sendOrReceive.showModal()

            return;
          }

          requestQr.close()
        },
      },
    }
  )

  return requestQr
})

export default requestQrRig