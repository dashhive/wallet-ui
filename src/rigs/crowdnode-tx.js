import {
  DIALOG_STATUS,
} from '../utils/constants.js'

import {
  lit as html,
  formDataEntries,
} from '../utils/generic.js'

import { DialogContructor } from '../components/modal.js'

export const crowdnodeTransactionRig = (() => {
  'use strict';

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
    appElement: document.body,
  }

  let crowdnodeTransaction = new DialogContructor(dialogConfig)

  // console.log('Modal.js Dialog', crowdnodeTransaction)

  dialogConfig.events.submit = async function (event) {
    event.preventDefault()
    event.stopPropagation()

    let fde = formDataEntries(event)

    if (fde?.intent === 'act') {
      let res = await crowdnodeTransaction.state.value.callback?.(
        crowdnodeTransaction.state,
        fde,
      )

      // console.log('crowdnodeTransaction submit res', res)

      if (
        res.state.value.status === DIALOG_STATUS.SUCCESS ||
        res.state.value.status === DIALOG_STATUS.ERROR
      ) {
        crowdnodeTransaction.elements.progress?.remove?.()

        crowdnodeTransaction.elements.dialog.returnValue = String(fde.intent)
        crowdnodeTransaction.elements.dialog?.close(String(fde.intent))
      }
    } else {
      crowdnodeTransaction.elements.progress?.remove?.()

      crowdnodeTransaction.elements.dialog.returnValue = 'cancel'
      crowdnodeTransaction.elements.dialog?.close('cancel')
    }
  }

  dialogConfig.markup.alert = html``
  dialogConfig.markup.submitIcon = ``

  crowdnodeTransaction.updateConfig(dialogConfig)

  return crowdnodeTransaction
})();

export default crowdnodeTransactionRig