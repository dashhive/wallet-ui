import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
} from '../helpers/utils.js'

export let confirmActionRig = (async function (globals) {
  'use strict';

  let {
    mainApp, setupDialog, appDialogs, appState, appTools,
    store, userInfo, contactsList,
  } = globals

  let confirmAction = await setupDialog(
    mainApp,
    {
      name: 'Confirm',
      actionTxt: 'Do It!',
      actionAlt: 'Yeah, really do this!',
      cancelTxt: 'Cancel',
      cancelAlt: `Cancel`,
      closeTxt: html`<svg class="x" width="26" height="26" viewBox="0 0 26 26"><use xlink:href="#icon-x"></use></svg>`,
      closeAlt: `Cancel & Close`,
      action: 'lock',
      target: '',
      targetFallback: 'this wallet',
      actionType: 'warn',
      actionClasses: {
        info: 'bg-info dark bg-info-hover',
        warn: 'outline brd-warn warn dark-hover bg-warn-hover',
        dang: 'outline brd-dang dang light-hover bg-dang-hover',
      },
      showCancelBtn: true,
      showActBtn: true,
      // submitIcon: state => html`
      //   <svg class="trash-icon" width="16" height="16" viewBox="0 0 16 16">
      //     <use xlink:href="#icon-trash"></use>
      //   </svg>
      // `,
      cancelBtn: state => {
        if (!state.showCancelBtn) {
          return ``
        }

        return html`<button
          class="rounded outline"
          type="reset"
          name="intent"
          value="cancel"
          title="${state.cancelAlt}"
        >
          <span>${state.cancelTxt}</span>
        </button>`
      },
      actionBtn: state => {
        if (!state.showActBtn) {
          return ``
        }

        return html`<button
          class="rounded ${state.actionClasses[state.actionType]}"
          type="submit"
          name="intent"
          value="act"
          title="${state.actionAlt}"
        >
          ${state.submitIcon(state)}
          <span>${state.actionTxt}</span>
        </button>`
      },
      submitIcon: state => `🔒`,
      footer: state => html`
        <footer class="inline col">
          ${state.alert(state)}

          <div class="flex row">
            ${state.cancelBtn(state)}
            ${state.actionBtn(state)}
          </div>
        </footer>
      `,
      alert: state => html``,
      // alert: state => html`
      //   <article class="px-3 col">
      //     <strong>
      //       This is an irreversable action, make sure to backup first.
      //     </strong>
      //   </article>
      // `,
      content: state => html`
        ${state.header(state)}

        <article class="px-3 col">
          <strong>
            Are you sure you want to ${state.action} ${
              state.target || state.targetFallback
            }?
          </strong>
        </article>

        ${state.footer(state)}
      `,
      events: {
        handleSubmit: state => async event => {
          event.preventDefault()
          event.stopPropagation()

          let fde = formDataEntries(event)

          if (fde?.intent === 'act') {
            // state.elements.dialog.returnValue = String(fde.intent)
            state.callback?.(state, fde)
            confirmAction.close(fde.intent)
          }
        },
      },
    }
  )

  // @ts-ignore
  globals.confirmAction = confirmAction;

  return confirmAction
})

export default confirmActionRig