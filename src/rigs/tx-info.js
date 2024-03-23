import { lit as html } from '../helpers/lit.js'
import {
  formatDash,
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
        let output = html``
        if (state.amount) {
          let amount = formatDash(
            state.amount,
          )
          output = html`
            ${output}
            <article>
              <figure>
                <figcaption class="txt-small">To <span>${state.getContact(state)}</span></figcaption>
                <div class="big">
                  <svg width="26" height="27" viewBox="0 0 32 33">
                    <use xlink:href="#icon-dash-mark"></use>
                  </svg>
                  ${amount}
                </div>
              </figure>
            </article>
          `
        }
        return output
      },
      showFeeAndTotal: state => {
        if (!state.fee || !state.amount) {
          return ''
        }
        let dashFee = formatDash(
          state.fee,
        )
        let totalAmount = formatDash(
          Number(state.amount) + Number(state.fee),
        )

        return html`
          <article class="col rg-3">
            <figure>
              <figcaption>Dash Network Fee</figcaption>
              <div class="mid">
                <svg width="22" height="23" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${dashFee}
              </div>
            </figure>
            <figure>
              <figcaption>Total</figcaption>
              <div class="big">
                <svg width="32" height="33" viewBox="0 0 32 33">
                  <use xlink:href="#icon-dash-mark"></use>
                </svg>
                ${totalAmount}
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

        ${state.showAmount(state)}
        ${state.showFeeAndTotal(state)}
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