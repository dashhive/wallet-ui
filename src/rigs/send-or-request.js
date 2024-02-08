import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  parseAddressField,
  fixedDash,
  roundUsing,
} from '../helpers/utils.js'
import setupInputAmount from '../components/input-amount.js'

export let sendOrRequestRig = (function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState, appTools, store,
    createTx, deriveWalletData, getAddrsWithFunds, batchGenAcctAddrs,
    wallet, wallets, accounts, walletFunds,
  } = globals

  let inputAmount = setupInputAmount(mainApp)

  let sendOrRequest = setupDialog(
    mainApp,
    {
      name: 'Send or Receive',
      sendName: 'Send Funds',
      sendTxt: 'Send',
      sendAlt: 'Send Dash',
      scanAlt: 'Scan a QR Code',
      requestName: 'Receive Funds',
      requestTxt: 'Receive',
      requestAlt: 'Receive Dash',
      actionTxt: 'Send',
      actionAlt: 'Send Dash',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Form`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
      <use xlink:href="#icon-x"></use>
    </svg>`,
      closeAlt: `Close`,
      action: 'send',
      submitIcon: state => {
        const icon = {
          send: html`
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-up"></use>
            </svg>
          `,
          request: html`
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-down"></use>
            </svg>
          `,
        }
        return icon[state.action]
      },
      actionBtn: state => {
        if (state.action === 'send') {
          state.actionTxt = state.sendTxt
          state.actionAlt = state.sendAlt
        }
        if (state.action === 'request') {
          state.actionTxt = state.requestTxt
          state.actionAlt = state.requestAlt
        }

        return html`
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="${state.action}"
            title="${state.actionAlt}"
          >
            ${state.submitIcon(state)}
            <span>${state.actionTxt}</span>
          </button>
        `
      },
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
          ${state.actionBtn(state)}
        </footer>
      `,
      header: state => {
        if (state.action === 'send') {
          state.name = state.sendName
        }
        if (state.action === 'request') {
          state.name = state.requestName
        }

        return html`
          <header>
            <strong>${state.name}</strong>
            ${
              state.closeTxt && html`<button class="link" type="reset" value="close" title="${state.closeAlt}"><span>${state.closeTxt}</span></button>`
            }
          </header>
        `
      },
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
                autocomplete="off"
                list="contactAliases"
                value="${state.to || ''}"
              />

              <button
                class="rounded outline"
                type="submit"
                name="intent"
                value="scan_qr_code"
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
                  (state.contacts || [])
                    .filter(
                      c => c.alias &&
                      Object.keys(c.outgoing || {}).length > 0
                    ).map(contact => {
                      return html`<option value="@${
                        contact.alias
                      }">${
                        contact.info?.name || contact.alias
                      }</option>`
                    })
                    // Adds multiple entries for
                    // outgoing wallets per contact
                    //
                    // ).map(contact =>
                    //   Object.values(contact.outgoing).map(co => {
                    //     return html`<option value="@${
                    //       contact.alias
                    //     }#${co?.xkeyId}">${
                    //       contact.info?.name || contact.alias
                    //     }</option>`
                    // }))
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
        handleInput: state => async event => {
          event.preventDefault()
          if (
            event?.target?.validity?.patternMismatch &&
            event?.target?.type !== 'checkbox'
          ) {
            let label = event.target?.previousElementSibling?.textContent?.trim()
            if (label) {
              event.target.setCustomValidity(`Invalid ${label}`)
            }
          } else {
            event.target.setCustomValidity('')
          }
          event.target.reportValidity()

          if (event.target?.name === 'to') {
            if (
              event.target.value &&
              !event.target.value.startsWith('@')
            ) {
              let {
                address,
                xpub,
                xprv,
                name,
                preferred_username,
                amount,
              } = parseAddressField(event.target.value)

              let xkey = xprv || xpub

              let xkeyOrAddr = xkey || address

              // let info = {
              //   name,
              //   preferred_username,
              // }

              console.log(
                'handleInput parsedAddr',
                event.target.value,
                xkeyOrAddr,
              )

              if (address) {
                event.target.form.to.value = address
              }

              if (amount) {
                event.target.form.amount.value = amount
              }
            }
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
          // console.warn(
          //   'FORM INTENT',
          //   fde.intent,
          //   [event.target],
          // )

          if (fde?.intent === 'scan_qr_code') {
            appDialogs.scanContact.render(
              {
                wallet: state.wallet,
              },
              'afterend',
            )

            let showScan = await appDialogs.scanContact.showModal()
            if (showScan !== 'cancel') {
              let parsedScan = parseAddressField(showScan)

              console.log(
                'showScan',
                showScan,
                parsedScan,
              )
              let {
                address,
                amount,
              } = parsedScan

              if (address) {
                event.target.to.value = address
              }

              if (amount) {
                event.target.amount.value = amount
              }
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

          let inWallet, outWallet, address, tx, contact
          let to = String(fde.to), amount = Number(fde.amount)
          let receiveWallet = {}, sendWallet = {}

          if (
            fde.intent === 'send' &&
            (
              !fde.amount ||
              amount === 0
            )
          ) {
            event.target.amount.setCustomValidity(
              'You must specify an amount to send'
            )
            event.target.amount.reportValidity()
            return;
          }

          if (to.startsWith('@')) {
            contact = state.contacts.find(c => c.alias === to.substring(1))
            outWallet = Object.values(contact?.outgoing)?.[0]
            inWallet = Object.values(contact?.incoming)?.[0]
          }

          if (fde.intent === 'send') {
            console.log(
              `CONFIRM ${fde.intent} TO`,
              contact,
              `Ð ${amount || 0}`,
            )

            if (outWallet?.addressIndex !== undefined) {
              outWallet.addressIndex = outWallet.addressIndex + 1
              sendWallet = await deriveWalletData(
                outWallet?.xpub,
                outWallet.accountIndex,
                outWallet.addressIndex,
              )
              address = sendWallet.address
            } else if(outWallet?.address) {
              address = outWallet.address
            } else {
              address = to
            }

            if (amount > 0 && walletFunds.balance < amount) {
              console.log(
                `INSUFFICIENT FUNDS IN WALLET`,
                [
                  `SEND Ð ${amount || 0}`,
                  `AVAILABLE Ð ${walletFunds?.balance}`,
                ]
              )
              state.wallet.addressIndex = (
                state.wallet?.addressIndex || 0
              ) + 1
              receiveWallet = await deriveWalletData(
                appState.phrase,
                state.wallet.accountIndex,
                state.wallet.addressIndex,
              )
              let amountNeeded = fixedDash(roundUsing(Math.ceil, Math.abs(
                walletFunds.balance - Number(fde.amount)
              )))

              appDialogs.requestQr.render(
                {
                  name: 'Insufficient wallet funds',
                  wallet: receiveWallet,
                  // contact,
                  // to,
                  amount: amountNeeded,
                  // footer: state => html`<footer class="center">
                  //   <sub>Fund this wallet with at least Ð ${fixedDash(state.amount)} to complete this transaction</sub>
                  // </footer>`,
                  footer: state => html`<footer class="center">
                    <sub>Fund this wallet with at least Ð ${state.amount} to complete this transaction</sub>
                  </footer>`,
                },
                'afterend',
              )

              let showRequestQR = await appDialogs.requestQr.showModal()
              return
            }

            if (amount > 0) {
              let fundingAddrs = await getAddrsWithFunds(
                state.wallet,
              )
              fundingAddrs = Object.values(
                fundingAddrs || {}
              )
              tx = await createTx(
                state.wallet,
                fundingAddrs,
                address,
                amount,
              )

              console.log(
                `TX TO ${address}`,
                `Ð ${amount || 0}`,
                contact,
                tx,
              )
              console.log(
                `TX HEX`,
                tx.transaction,
              )
            }

            appDialogs.sendConfirm.render(
              {
                wallet: state.wallet,
                // wallet: sendWallet,
                contact,
                to,
                amount,
                tx,
              },
              'afterend',
            )

            let showConfirm = await appDialogs.sendConfirm.showModal()
          }

          if (fde.intent === 'request') {
            if (!inWallet && !state.wallet?.xpub) {
              return;
            }

            if (!inWallet) {
              state.wallet.addressIndex = (
                state.wallet?.addressIndex || 0
              ) + 1
              receiveWallet = await deriveWalletData(
                appState.phrase,
                state.wallet.accountIndex,
                state.wallet.addressIndex,
              )
            } else {
              inWallet.addressIndex = inWallet.addressIndex + 1
              receiveWallet = await deriveWalletData(
                appState.phrase,
                inWallet.accountIndex,
                inWallet.addressIndex,
              )

              await appTools.storedData.encryptItem(
                store.contacts,
                inWallet.xkeyId,
                {
                  ...contact,
                  updatedAt: (new Date()).toISOString(),
                  incoming: {
                    ...contact.incoming,
                    [`${inWallet.walletId}/${inWallet.xkeyId}`]: {
                      ...inWallet,
                      address: receiveWallet.address,
                      addressIndex: receiveWallet.addressIndex,
                    }
                  },
                },
                false,
              )

              inWallet.address = receiveWallet.address
            }

            if (receiveWallet?.xkeyId) {
              let tmpWallet = await store.accounts.getItem(
                receiveWallet.xkeyId,
              )

              // state.wallet =
              let tmpAcct = await store.accounts.setItem(
                receiveWallet.xkeyId,
                {
                  ...tmpWallet,
                  updatedAt: (new Date()).toISOString(),
                  address: receiveWallet.address,
                  addressIndex: receiveWallet.addressIndex,
                }
              )

              batchGenAcctAddrs(receiveWallet, tmpAcct)
                // .then(a => {
                //   console.log(
                //     `${fde.intent} TO CONTACT BATCH GEN ADDRS`,
                //     a
                //   )
                // })

              console.log(
                `${fde.intent} FROM CONTACT`,
                `Ð ${fde.amount || 0}`,
                {
                  contact,
                  stateWallet: state.wallet,
                  inWallet,
                  receiveWallet,
                  amount,
                }
              )

              appDialogs.requestQr.render(
                {
                  name: 'Share to receive funds',
                  footer: state => html`<footer class="center">
                    <sub>Share this QR code to receive funds</sub>
                  </footer>`,
                  wallet: receiveWallet,
                  contact,
                  to,
                  amount: Number(fde.amount),
                },
                'afterend',
              )

              let showRequestQR = await appDialogs.requestQr.showModal()
            }
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