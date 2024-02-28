import { lit as html } from '../helpers/lit.js'
import { qrSvg } from '../helpers/qr.js'
import {
  setClipboard,
  openBlobSVG,
  generatePaymentRequestURI,
} from '../helpers/utils.js'

export let txInfoRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog,
  } = globals;

  let txInfo = await setupDialog(
    mainApp,
    {
      name: 'Transaction Sent',
      address: '',
      submitTxt: html`Okay`,
      submitAlt: 'Okay',
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
      footer: state => html`
        <footer class="inline col">
          <button
            class="rounded"
            type="submit"
            name="intent"
            value="okay"
            title="${state.submitAlt}"
          >
            <span>${state.submitTxt}</span>
          </button>
        </footer>
      `,
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
              <figcaption>Estimated Fee</figcaption>
              <div>
                <svg width="32" height="33" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${state.fee}
              </div>
            </figure>
          </article>
        `
      },
      showTransaction: state => {
        if (!state.txRes) {
          return ''
        }

        return html`
          <article>
            <figure>
              <figcaption>Transaction ID</figcaption>
              <div class="txid" title="${state.txRes?.txid}">${state.txRes?.txid}</div>
              <br>
              <a href="https://insight.dash.org/insight/tx/${state.txRes?.txid || ''}" target="_blank" rel="noreferrer">View the Transaction on Dash Insight</a>
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
        ${state.showTransaction(state)}

        ${state.footer(state)}
      `,
      fields: html``,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          txInfo.close()
        },
      },
    }
  )

  // @ts-ignore
  globals.txInfo = txInfo;

  return txInfo
})

export default txInfoRig