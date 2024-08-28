import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

import {
  DIALOG_STATUS,
} from '../helpers/constants.js'

import { DialogContructor } from '../components/modal.js'

export const crowdnodeTransactionRig = (() => {
  'use strict';

  // let {
  //   mainApp, setupDialog,
  // } = globals

  let dialogConfig = {
    state: {
      name: 'CrowdNode Deposit / Withdraw',
      actionTxt: 'Do It!',
      actionAlt: 'Yeah, really do this!',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Cancel & Close`,
      action: '',
      target: '',
      targetFallback: 'this wallet',
      actionType: 'warn',
      actionClasses: {
        info: 'bg-info dark bg-info-hover',
        infoo: 'outline brd-info info dark light-hover bg-info-hover',
        warn: 'outline brd-warn warn dark-hover bg-warn-hover',
        dang: 'outline brd-dang dang light-hover bg-dang-hover',
      },
      showCancelBtn: true,
      showActBtn: true,
    },
    markup: {},
    events: {},
    // appElement: mainApp,
    appElement: document.body,
  }

  let crowdnodeTransaction = new DialogContructor(dialogConfig)

  console.log('Modal.js Dialog', crowdnodeTransaction)

  dialogConfig.events.submit = async function (event) {
    event.preventDefault()
    event.stopPropagation()

    let fde = formDataEntries(event)

    if (fde?.intent === 'act') {
      // state.elements.dialog.returnValue = String(fde.intent)
      let res = await this.state.value.callback?.(this.state.value, fde)

      if (
        res.state.value.status === DIALOG_STATUS.SUCCESS ||
        res.state.value.status === DIALOG_STATUS.ERROR
      ) {
        // this.elements.dialog?.querySelector('progress')?.remove()
        this.elements.progress?.remove?.()

        this.elements.dialog?.close(fde.intent)
      }
    }
  }

  dialogConfig.markup.alert = html``
  dialogConfig.markup.submitIcon = ``
  // dialogConfig.markup.submitIcon = html`
  //   <svg class="trash-icon" width="16" height="16" viewBox="0 0 16 16">
  //     <use xlink:href="#icon-trash"></use>
  //   </svg>
  // `
  // dialogConfig.markup.cancelBtn = html`
  //   <button
  //     class="rounded outline"
  //     type="reset"
  //     name="intent"
  //     value="cancel"
  //     title="${crowdnodeTransaction.state.value.cancelAlt}"
  //   >
  //     <span>${crowdnodeTransaction.state.value.cancelTxt}</span>
  //   </button>
  // `
  // dialogConfig.markup.actionBtn = html`
  //   <button
  //     class="rounded ${crowdnodeTransaction.state.value.actionClasses[crowdnodeTransaction.state.value.actionType]}"
  //     type="submit"
  //     name="intent"
  //     value="act"
  //     title="${crowdnodeTransaction.state.value.actionAlt}"
  //   >
  //     ${crowdnodeTransaction.markup.submitIcon}
  //     <span>${crowdnodeTransaction.state.value.actionTxt}</span>
  //   </button>
  // `
  // dialogConfig.markup.footer = html`
  //   <footer class="inline col">
  //     ${crowdnodeTransaction.markup.alert}

  //     <div class="flex row">
  //       ${crowdnodeTransaction.markup.cancelBtn}
  //       ${crowdnodeTransaction.markup.actionBtn}
  //     </div>
  //   </footer>
  // `
  // dialogConfig.markup.fields = html`
  //   <article class="px-3 col">
  //     <strong>
  //       Are you sure you want to ${crowdnodeTransaction.state.value.action} ${
  //         crowdnodeTransaction.state.value.target || crowdnodeTransaction.state.value.targetFallback
  //       }?
  //     </strong>
  //   </article>
  // `
  // dialogConfig.markup.content = () => html`
  //   ${crowdnodeTransaction.markup.header}

  //   ${crowdnodeTransaction.markup.fields}

  //   ${crowdnodeTransaction.markup.footer}
  // `

  crowdnodeTransaction.updateConfig(dialogConfig)

  return crowdnodeTransaction
})();

export default crowdnodeTransactionRig