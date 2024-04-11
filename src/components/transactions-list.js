import { lit as html } from '../helpers/lit.js'
import {
  envoy,
  restate,
  // sortContactsByAlias,
  // filterPairedContacts,
  // filterUnpairedContacts,
  // timeago,
  // getAvatar,
} from '../helpers/utils.js'

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

    return (
      await Promise.all(
        state.transactions
          // .filter(
          //   state.showUnpaired
          //     ? filterUnpairedContacts
          //     : filterPairedContacts
          // )
          // .sort(sortContactsByAlias)
          .map(async c => await state.item(c)),
      )
    ).join('')
  },
  content: async state => html`
    ${state.header(state)}

    <div>
      ${await state.list(state)}
    </div>
  `,
  item: async c => {
    // if ('string' === typeof c) {
      return html`
        <article>
          <address>
            <h4><!-- Encrypted --> Transaction</h4>
          </address>
        </article>
      `
    // }

    // let outgoing = Object.values(c?.outgoing || {})
    // let paired = outgoing.length > 0
    // let out = outgoing?.[0]
    // let created = c.createdAt
    //   ? timeago(Date.now() - (new Date(c.createdAt)).getTime())
    //   : ''
    // let user = c.alias || c.info?.preferred_username
    // let finishPairing = !paired
    //   ? 'Finish pairing with contact'
    //   : ''
    // let enterContactInfo = !paired || !user
    //   ? `Enter contact information for`
    //   : ''
    // let name = c.info?.name

    // if (
    //   !name &&
    //   !user &&
    //   !out?.xkeyId &&
    //   out?.address
    // ) {
    //   name = out?.address
    // } else if (!name) {
    //   name = created
    // }

    // let inId = Object.keys(c?.incoming || {})?.[0]?.split('/')[1]

    // let atUser = user
    //   ? `@${user}`
    //   : ''
    // let itemAlias = user
    //   ? `${atUser}${ !paired ? ' - ' : '' }${finishPairing}`
    //   : finishPairing || enterContactInfo
    // let itemName = name
    //   ? `${name}`
    //   : ''
    // let itemSub = inId
    //   ? `href="/#!/contact/${atUser || inId}" data-id="${inId}"`
    //   : ''
    // let itemCtrls = paired
    //   ? html`<aside class="inline row">
    //     <button class="pill rounded">
    //       <svg width="24" height="24" viewBox="0 0 24 24">
    //         <use xlink:href="#icon-arrow-circle-up"></use>
    //       </svg>
    //     </button>
    //     <button class="pill rounded">
    //       <svg width="24" height="24" viewBox="0 0 24 24">
    //         <use xlink:href="#icon-arrow-circle-down"></use>
    //       </svg>
    //     </button>
    //   </aside>`
    //   : ''

    // itemCtrls = '' // temp override

    // return html`
    //   <a ${itemSub}>
    //     ${await getAvatar(c)}
    //     <address>
    //       <h4>${itemAlias}</h4>
    //       <h5>${itemName}</h5>
    //     </address>
    //     ${itemCtrls}
    //   </a>
    // `
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
