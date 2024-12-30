import {
  lit as html,
  timeago,
  getAvatar,
} from '../utils/generic.js'
import {
  envoy,
  restate,
} from '../utils/retort.js'
import {
  sortTransactionsByTime,
} from '../utils/dash/local.js'

let _handlers = []

const initialState = {
  id: 'Transactions',
  name: 'List',
  placement: 'transactions',
  rendered: null,
  responsive: true,
  showUnpaired: false,
  delay: 500,
  wallet: {},
  transactions: [],
  restate,
  render(
    renderState = {},
    position = 'beforeend',
  ) {},
  header: state => html`
    <header>
      <h5 class="lh-2">Transactions</h5>
    </header>
  `,
  list: async state => {
    if (state.transactions?.length === 0) {
      return html`<span class="flex flex-fill center">No Transactions found</span>`
    }

    let contact

    return (
      await Promise.all(
        state.transactions
          .sort(sortTransactionsByTime)
          .map(async tx => {
            if (state.contacts?.length > 0) {
              contact = state.contacts.find(
                c => c.alias === tx.alias
              )
            }
            return await state.item(tx, contact)
          }),
      )
    ).join('')
  },
  content: async state => html`
    ${state.header(state)}

    <div>
      ${await state.list(state)}
    </div>
  `,
  item: async (tx, cnt) => {
    if ('string' === typeof tx) {
      return html`
        <article>
          <address>
            <h4>Transaction</h4>
          </address>
        </article>
      `
    }

    let time
    let txDate = new Date(tx.time * 1000)
    let user = cnt?.alias || cnt?.info?.preferred_username || tx?.alias || ''
    let name = cnt?.info?.name
    let addr = tx?.vout?.[0]?.scriptPubKey?.address || tx?.vout?.[0]?.scriptPubKey?.addresses?.[0]
    let itemDir = `To <strong>${name}</strong>`

    if (!['sent', 'outgoing'].includes(tx?.dir)) {
      addr = tx?.vin?.[0]?.address
    }
    if (tx.time) {
      time = timeago(Date.now() - txDate.getTime())
    }

    if (
      !name && user
    ) {
      name = `@${user}`
    } else if (
      !name && !user && addr
    ) {
      name = html`<span title="${addr}">${addr.substring(0,3)}...${addr.substring(addr.length - 3)}</span>`
    } else if (
      !name && !user && !addr
    ) {
      itemDir = html`<span title="${tx.txid}">${'Unknown TX Type'}</span>`
    }

    if (name) {
      itemDir = `To <strong>${name}</strong>`
    }
    let itemAmount = tx.sentAmount || tx.valueOut || 0

    let itemCtrls = html`<aside class="inline row dang" title="-${itemAmount}">
      -${itemAmount}
    </aside>`
    let itemTitle = `Sent on`
    // itemDir = `To <strong>${name}</strong>`

    if (!['sent', 'outgoing'].includes(tx?.dir)) {
      itemTitle = `Received on`
      itemDir = `From <strong>${name}</strong>`
      itemAmount = tx.receivedAmount || tx.valueIn || 0
      itemCtrls = html`<aside class="inline row succ" title="+${itemAmount}">
        +${itemAmount}
      </aside>`
    }

    return html`
      <a href="https://insight.dash.org/insight/tx/${tx?.txid}" target="_blank" rel="noreferrer" title="${itemTitle} ${txDate.toLocaleString()}">
        ${await getAvatar(cnt)}
        <address>
          <h4>${itemDir}</h4>
          <h5>${time}</h5>
        </address>
        ${itemCtrls}
      </a>
    `
  },
  footer: async state => html``,
  slugs: {
  },
  elements: {
  },
  events: {
    handleClick: state => event => {
      event.preventDefault()
      event.stopPropagation()
      console.log(
        'handle transactions click',
        event,
        state,
      )
    },
    handleTransactionsChange: (newState, oldState) => {
      if (newState.transactions !== oldState.transactions) {
        newState.render?.({
          transactions: newState.transactions
        })
      }
    }
  },
}

let state = envoy(
  initialState,
  initialState.events.handleTransactionsChange,
)

export async function setupTransactionsList(
  el, setupState = {}
) {
  restate(state, setupState)

  state.slugs.section = `${state.name}_${state.id}`
    .toLowerCase().replace(' ', '_')

  const section = document.createElement('section')

  section.id = state.slugs.section
  section.classList.add(state.placement || '')
  section.innerHTML = await state.content(state)

  state.elements.section = section

  const list = section.querySelector('& > div')

  state.elements.list = list

  function addListener(
    node,
    event,
    handler,
    capture = false
  ) {
    _handlers.push({ node, event, handler, capture })
    node.addEventListener(event, handler, capture)
  }

  function removeAllListeners(
    targets = [state.elements.section],
  ) {
    _handlers = _handlers
      .filter(({ node, event, handler, capture }) => {
        if (targets.includes(node)) {
          node.removeEventListener(event, handler, capture)
          return false
        }
        return true
      })
  }

  function addListeners() {
    addListener(
      state.elements.section,
      'click',
      state.events.handleClick(state),
    )
  }

  state.removeAllListeners = removeAllListeners
  state.addListeners = addListeners

  async function render(
    renderState = {},
    position = 'beforeend',
  ) {
    await restate(state, renderState)

    state.elements.section.id = state.slugs.section

    state.elements.list.innerHTML = await state.list(state)

    state.removeAllListeners()
    state.addListeners()

    if (!state.rendered) {
      el.insertAdjacentElement(position, section)
      state.rendered = section
    }
  }

  state.render = render

  return {
    element: section,
    render,
    restate: async newState => await restate(state, newState),
  }
}

export default setupTransactionsList
