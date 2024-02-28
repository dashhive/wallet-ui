import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  getStoreData,
  sortContactsByAlias,
} from '../helpers/utils.js'

export let sendConfirmRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState, appTools,
    sendTx, store, userInfo, contactsList,
  } = globals

  let sendConfirm = await setupDialog(
    mainApp,
    {
      name: 'Confirm Send',
      sendTxt: 'Send',
      sendAlt: 'Send Dash',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel Send`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26">
        <use xlink:href="#icon-x"></use>
      </svg>`,
      closeAlt: `Cancel & Close`,
      amount: 0,
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
        </footer>
      `,
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
          <article>
            <figure>
              <figcaption>Full Amount</figcaption>
              <div class="big">
                <svg width="32" height="33" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${state.fullAmount}
              </div>
            </figure>
          </article>
          <article>
            <figure>
              <figcaption>Estimated Fee</figcaption>
              <div>
                <svg width="32" height="33" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${state.fee?.dash}
              </div>
            </figure>
          </article>
        `
      },
      content: state => html`
        ${state.header(state)}

        <article>
          <figure>
            <figcaption>To</figcaption>
            <div>${state.getContact(state)}</div>
          </figure>
        </article>

        ${state.showAmount(state)}

        ${state.footer(state)}
      `,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          let outWallet, inWallet, address, addressIndex, txRes
          let sendWallet = {}

          if (state.contact) {
            outWallet = Object.values(state.contact?.outgoing)?.[0]
            inWallet = Object.values(state.contact?.incoming)?.[0]
          }

          if (fde.intent === 'send') {
            if (outWallet?.addressIndex !== undefined) {
              addressIndex = (outWallet?.addressIndex || 0) + 1
            }

            if (state.tx) {
              txRes = await sendTx(
                state.tx,
              )
            }

            if (txRes && addressIndex !== undefined) {
              appTools.storedData.decryptItem(
                store.contacts,
                inWallet.xkeyId,
              ).then(async c => {
                await appTools.storedData.encryptItem(
                  store.contacts,
                  inWallet.xkeyId,
                  {
                    ...c,
                    updatedAt: (new Date()).toISOString(),
                    outgoing: {
                      ...c.outgoing,
                      [outWallet.xkeyId]: {
                        ...c.outgoing[outWallet.xkeyId],
                        addressIndex,
                      }
                    }
                  },
                  false,
                )

                getStoreData(
                  store.contacts,
                  res => {
                    if (res) {
                      appState.contacts = res

                      return contactsList.restate({
                        contacts: res?.sort(sortContactsByAlias),
                        userInfo,
                      })
                    }
                  },
                  res => async v => {
                    res.push(await appTools.storedData.decryptData(v))
                  }
                )
              })
            }

            appState.sentTransactions = {
              ...appState.sentTransactions,
              [txRes.txid]: state.tx,
            }
            console.log(
              '===sentTransactions===',
              appState?.sentTransactions
            )

            console.log(
              `${fde.intent} TO ${state.to}`,
              `Ð ${state.amount || 0}`,
              state.contact,
              txRes,
            )

            await appDialogs.txInfo.render(
              {
                contact: state.contact,
                amount: state.fullAmount,
                fee: state.fee?.dash,
                txRes,
              },
              'afterend',
            )

            let showTxInfo = appDialogs.txInfo.showModal()
          }

          sendConfirm.close(fde.intent)
          appDialogs.sendOrReceive.close(fde.intent)
        },
      },
    }
  )

  // @ts-ignore
  globals.sendConfirm = sendConfirm;

  return sendConfirm
})

export default sendConfirmRig