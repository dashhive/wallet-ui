import { lit as html } from '../utils/generic.js'

import requestQrRig from './request-qr.js'

export async function showQrCode(state = {}) {
  const requestQr = await requestQrRig(state)

  let initState = {
    name: 'Share to receive funds',
    submitTxt: `Edit Amount or Contact`,
    submitAlt: `Change the currently selected contact`,
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
    amount: 0,
    ...state,
  }

  let showRequestQRRender = await requestQr.render(
    initState,
    'afterend',
  )

  await requestQr.showModal()

  return showRequestQRRender
}

export default showQrCode