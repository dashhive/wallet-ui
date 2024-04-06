import { lit as html } from '../helpers/lit.js'

export async function showErrorDialog(options) {
  let opts = {
    type: 'warn',
    title: '⚠️ Error',
    msg: '',
    showCancelBtn: true,
    showActBtn: true,
    cancelCallback: () => {},
    // timeout: null,
    ...options,
  }

  opts.callback = opts.callback || (() => {
    let firstLineFromError = ''
    let { msg } = opts

    if (typeof msg !== 'string' && msg.toString) {
      msg = msg.toString()
    }
    if (typeof msg === 'string') {
      firstLineFromError = msg.match(/[^\r\n]+/g)?.[0]
    }

    // console.log('firstLineFromError', firstLineFromError)

    window.open(
      `https://github.com/dashhive/wallet-ui/issues?q=${firstLineFromError}`,
      '_blank',
    )
  })

  if (opts.type === 'dang') {
    console.error('showErrorDialog', opts)
  } else {
    console.log('showErrorDialog', opts)
  }

  let outputMsg = opts.msg?.response || opts.msg?.stack || opts.msg

  await opts.confirmAction?.render({
    name: opts.title,
    actionTxt: 'Report Issue',
    actionAlt: 'Report the error at GitHub',
    action: 'lock',
    cancelTxt: 'Close',
    cancelAlt: `Close`,
    // target: '',
    // targetFallback: 'this wallet',
    actionType: opts.type,
    // action: 'disconnect',
    // target: '',
    // targetFallback: 'this wallet',
    // actionType: 'dang',
    showCancelBtn: opts.showCancelBtn,
    showActBtn: opts.showActBtn,
    submitIcon: state => `⚠️`,
    alert: state => html``,
    content: state => html`
      ${state.header(state)}

      <article class="px-3 col flex-fill ta-left mh-75">
        <!-- <strong>
          Looks like we encountered an error.
        </strong> -->
        <pre class="of-auto flex-fill">${outputMsg}</pre>
      </article>

      ${state.footer(state)}
    `,
    cancelCallback: opts.cancelCallback,
    callback: opts.callback,
  })

  return opts.confirmAction?.showModal()
}

export default showErrorDialog
