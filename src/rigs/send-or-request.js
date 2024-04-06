import { lit as html } from '../helpers/lit.js'
import { AMOUNT_REGEX, USAGE } from '../helpers/constants.js'
import {
  formDataEntries,
  parseAddressField,
  fixedDash,
  toDASH,
  toDash,
  roundUsing,
  getPartialHDPath,
  getAddressIndexFromUsage,
} from '../helpers/utils.js'

export let sendOrReceiveRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState, appTools, store,
    createTx, deriveWalletData, getAddrsWithFunds, batchGenAcctAddrs,
    wallet, wallets, accounts, walletFunds, getUnusedChangeAddress, getAccountWallet, showErrorDialog,
  } = globals

  let sendOrReceive = await setupDialog(
    mainApp,
    {
      name: 'Send or Receive',
      sendName: 'Send Funds',
      sendTxt: 'Send',
      sendAlt: 'Send Dash',
      scanAlt: 'Scan a QR Code',
      receiveName: 'Receive Funds',
      receiveTxt: 'Receive',
      receiveAlt: 'Receive Dash',
      actionTxt: 'Send',
      actionAlt: 'Send Dash',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Form`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Close`,
      action: 'send',
      submitIcon: state => {
        const icon = {
          send: html`
            <svg width="22" height="22" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-up"></use>
            </svg>
          `,
          receive: html`
            <svg width="22" height="22" viewBox="0 0 24 24">
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
        if (state.action === 'receive') {
          state.actionTxt = state.receiveTxt
          state.actionAlt = state.receiveAlt
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
        if (state.action === 'receive') {
          state.name = state.receiveName
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
      qrScanBtn: state => {
        if (state.action !== 'send') {
          return ''
        }

        return html`
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
        `
      },
      fundAmountBtns: state => {
        if (state.action !== 'send') {
          return ''
        }

        return html`
          <!-- <button
            class="rounded outline"
            type="submit"
            name="intent"
            value="amount_25"
            title="${state.scanAlt}"
          >
            <span>
              25%
            </span>
          </button> -->
          <button
            class="rounded outline"
            type="submit"
            name="intent"
            value="amount_50"
            title="${state.scanAlt}"
          >
            <span>
              HALF
            </span>
          </button>
          <!-- <button
            class="rounded outline"
            type="submit"
            name="intent"
            value="amount_75"
            title="${state.scanAlt}"
          >
            <span>
              75%
            </span>
          </button> -->
          <button
            class="rounded outline"
            type="submit"
            name="intent"
            value="amount_100"
            title="${state.scanAlt}"
          >
            <span>
              FULL
            </span>
          </button>
        `
      },
      content: state => html`
        ${state.header(state)}

        <fieldset>
          <article>
            <div class="input">
              <input
                type="text"
                id="${state.slugs.form}_to"
                name="to"
                placeholder="enter @alias or dash address"
                spellcheck="false"
                autocomplete="off"
                autocapitalize="off"
                list="${state.action === 'receive' ? 'contactReceiveAliases' : 'contactSendAliases'}"
                value="${state.to || ''}"
              />

              ${state.qrScanBtn(state)}
            </div>

            <div class="field amount">
              <label for="amount">
                Amount
              </label>
              <div class="row">
                <label for="amount">
                  <svg width="32" height="33" viewBox="0 0 32 33">
                    <use xlink:href="#icon-dash-mark"></use>
                  </svg>
                </label>
                <input
                  id="amount"
                  name="amount"
                  placeholder="0.12345678"
                  spellcheck="false"
                  autocomplete="off"
                  pattern="${AMOUNT_REGEX.source}"
                  title="Enter a valid number for the amount you wish to ${state.action}."
                  value="${state.amount || ''}"
                />
              </div>
            </div>
            <div class="field mt-0">
              <div class="row">
                ${state.fundAmountBtns(state)}
              </div>
            </div>
            <div class="switch py-3 pr-3">
              <label for="cashSendMode" class="jc-end">
                Use CashSend
              </label>
              <input
                id="cashSendMode"
                name="mode"
                type="checkbox"
                value="cash"
              />
              <label for="cashSendMode" class="switch" title="CashSend"></label>
            </div>

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
          state.sendFull = false

          if (state.elements.dialog.returnValue !== 'cancel') {
            resolve(state.elements.dialog.returnValue)
          } else {
            resolve('cancel')
          }

          setTimeout(t => {
            state.modal.rendered[state.slugs.dialog] = null
            event?.target?.remove()
          }, state.delay)
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
            if (event.target.name === 'amount') {
              event.target.setCustomValidity(`Invalid Amount. Value must be a number.`)
            }
          } else {
            event.target.setCustomValidity('')
          }
          event.target.reportValidity()

          if (
            event.target?.name === 'amount' &&
            event.target.value.startsWith('.')
          ) {
            event.target.value = `0${event.target.value}`
          }

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
        handleFocusOut: state => event => {
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
          if (String(fde?.intent).includes('amount')) {
            let [_t, percent] = String(fde.intent).split('_')
            let amountPercent = ((Number(percent) / 100) * walletFunds.balance)
            let prettyAmountPercent = fixedDash(roundUsing(Math.floor, Math.abs(
              amountPercent
            )))
            event.target.amount.value = prettyAmountPercent

            if (percent === '100') {
              state.sendFull = true
            } else {
              state.sendFull = false
            }

            console.log(`Send ${percent}% of ${walletFunds.balance}`, [
              amountPercent,
              prettyAmountPercent,
              state.sendFull,
            ])

            return;
          }

          if (fde?.intent === 'scan_qr_code') {
            await appDialogs.scanContact.render(
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

          let inWallet, outWallet, address, changeAddress, contact
          let to = String(fde.to), amount = Number(fde.amount)
          let fundWallet = {}, receiveWallet = {}, sendWallet = {}

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

          if (!inWallet) {
            // state.wallet.addressIndex = (
            //   state.wallet?.addressIndex ?? -1
            // ) + 1
            // state.wallet.addressIndex = state.wallet?.addressIndex ?? 0
            let mainWallet = await deriveWalletData(appState.phrase)
            let aw = await getAccountWallet(
              mainWallet,
              appState.phrase,
            )
            receiveWallet = aw.wallet
          } else {
            let aw = await getAccountWallet(
              inWallet,
              appState.phrase,
            )
            receiveWallet = aw.wallet

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
                    ...aw.account,
                    address: receiveWallet.address,
                  }
                },
              },
              false,
            )

            // console.log(
            //   'derive change wallet',
            //   {
            //     contact,
            //     tmpAcct,
            //     tmpAcctWallet,
            //     receiveWallet,
            //     changeWallet,
            //     derivedChangeWallet,
            //   }
            // )

            inWallet.address = receiveWallet.address
          }

          if (fde.intent === 'send') {
            console.log(
              `CONFIRM ${fde.intent} TO`,
              contact,
              `Ð ${amount || 0}`,
              {sendFull: state.sendFull},
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

            let leftoverBalance = walletFunds.balance - amount
            let fullTransfer = leftoverBalance <= 0.0010_0200
            // let fullTransfer = leftoverBalance <= 0.0001_0200

            if (
              amount > 0 &&
              walletFunds.balance < amount &&
              !fullTransfer
            ) {
              console.log(
                `INSUFFICIENT FUNDS IN WALLET`,
                [
                  `SEND Ð ${amount || 0}`,
                  `AVAILABLE Ð ${walletFunds?.balance}`,
                ]
              )
              // state.wallet.addressIndex = (
              //   state.wallet?.addressIndex ?? -1
              // ) + 1
              state.wallet.addressIndex = state.wallet?.addressIndex ?? 0
              fundWallet = await deriveWalletData(
                appState.phrase,
                state.wallet.accountIndex,
                state.wallet.addressIndex,
              )
              let amountNeeded = fixedDash(roundUsing(Math.floor, Math.abs(
                walletFunds.balance - Number(fde.amount)
              )))

              await appDialogs.requestQr.render(
                {
                  name: 'Insufficient wallet funds',
                  wallet: fundWallet,
                  selectedWallet: state.wallet,
                  contact,
                  to,
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
              // let changeAddrs = await findInStore()

              let tmpAcct = await store.accounts.getItem(
                state.wallet.xkeyId,
              ) || {}
              let tmpAcctWallet = getAddressIndexFromUsage(
                state.wallet,
                tmpAcct,
                USAGE.CHANGE,
              )

              changeAddress = await getUnusedChangeAddress(tmpAcctWallet)

              console.log(
                'derive change wallet',
                {
                  changeAddress,
                  contact,
                  tmpAcct,
                  tmpAcctWallet,
                  stateWallet: state.wallet,
                  // derivedChangeWallet,
                }
              )

              let fundingAddrs = await getAddrsWithFunds(
                state.wallet,
              )
              fundingAddrs = Object.values(
                fundingAddrs || {}
              )

              let createdTx = {}

              try {
                createdTx = await createTx(
                  state.wallet,
                  fundingAddrs,
                  [changeAddress],
                  address,
                  amount,
                  fullTransfer,
                  fde.mode,
                )
              } catch(err) {
                return await showErrorDialog({
                  type: 'dang',
                  title: 'Failed to create transaction',
                  msg: err,
                  // showActBtn: false,
                  confirmAction: appDialogs.confirmAction,
                })
              }

              let { tx, changeAddr, fee } = createdTx

              let fullAmount = 0

              tx.outputs
                .filter(o => ![changeAddr].includes(o.address))
                .forEach(o => {
                  fullAmount += o.satoshis
                  console.log('tx output loop', o, fullAmount)
                })

              let estimatedSatFee = fee * tx.outputs.length
              let estimatedDashFee = toDash(fee)

              console.log(
                `TX TO ${address} for Ð ${amount || 0}`,
              )
              console.log([
                `Actual Amount: Ð ${toDash(fullAmount)}`,
                `SATS Fee: ${fee}`,
                `Fee: ${estimatedDashFee}`,
              ])
              console.log({
                contact,
                tx,
              })
              console.log(
                `TX HEX`,
                tx.transaction,
              )

              await appDialogs.sendConfirm.render(
                {
                  wallet: state.wallet,
                  // wallet: sendWallet,
                  contact,
                  to,
                  amount,
                  fullAmount: toDash(fullAmount),
                  tx,
                  fee: {
                    sat: fee,
                    dash: estimatedDashFee
                  }
                },
                'afterend',
              )

              let showConfirm = await appDialogs.sendConfirm.showModal()
            }
          }

          if (fde.intent === 'receive') {
            console.log(
              fde.intent,
              state.wallet,
              state.selectedWallet,
              receiveWallet,
            )
            if (!inWallet && !state.wallet?.xpub) {
              return;
            }

            if (receiveWallet?.xkeyId) {
              let tmpAcct = await store.accounts.getItem(
                receiveWallet.xkeyId,
              ) || {}
              let tmpAcctWallet = getAddressIndexFromUsage(state.wallet, tmpAcct)

              let storedPath = getPartialHDPath(tmpAcctWallet)
              let oldPath = getPartialHDPath(receiveWallet)

              if (receiveWallet.xkeyId === state.wallet.xkeyId) {
                state.wallet = await deriveWalletData(
                  appState.phrase,
                  tmpAcctWallet.accountIndex,
                  (tmpAcctWallet?.addressIndex ?? 0),
                  tmpAcctWallet.usageIndex,
                )
              }

              tmpAcct.usage = tmpAcct?.usage // || [0,0]
              tmpAcct.usage[
                receiveWallet.usageIndex
              ] = receiveWallet.addressIndex

              let newPath = getPartialHDPath(receiveWallet)

              batchGenAcctAddrs(
                receiveWallet,
                tmpAcct,
                receiveWallet.usageIndex,
              )
                .then(a => {
                  console.log(
                    `${fde.intent} BATCH GEN ADDRS`,
                    a
                  )
                })

              // state.wallet =
              // let tmpAcct = await store.accounts.setItem(
              //   receiveWallet.xkeyId,
              //   {
              //     ...tmpWallet,
              //     updatedAt: (new Date()).toISOString(),
              //     address: receiveWallet.address,
              //   }
              // )

              // batchGenAcctAddrs(receiveWallet, tmpAcct)
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
                  to,
                  contact,
                  stateWallet: state.wallet,
                  inWallet,
                  receiveWallet,
                  amount,
                },
                [
                  storedPath,
                  oldPath,
                  newPath,
                ],
              )

              sendOrReceive.close(fde.intent)

              await appDialogs.requestQr.render(
                {
                  name: 'Share to receive funds',
                  submitTxt: `Edit Amount or Contact`,
                  submitAlt: `Change the currently selected contact`,
                  // footer: state => html`<footer class="center">
                  //   <sub>Share this QR code to receive funds</sub>
                  // </footer>`,
                  footer: state => html`
                    <footer class="inline col">
                      <button
                        class="rounded"
                        type="submit"
                        name="intent"
                        value="select_address"
                        title="${state.submitAlt}"
                      >
                        <span>${state.submitTxt}</span>
                      </button>
                    </footer>
                  `,
                  wallet: receiveWallet,
                  selectedWallet: state.wallet,
                  contact,
                  to,
                  amount: Number(fde.amount),
                },
                'afterend',
              )

              let showRequestQR = await appDialogs.requestQr.showModal()
            }
          }
        },
      },
    }
  )

  // @ts-ignore
  globals.sendOrReceive = sendOrReceive;

  return sendOrReceive
})

export default sendOrReceiveRig