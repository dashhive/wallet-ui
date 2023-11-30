import { lit as html } from '../helpers/lit.js'
import {
  envoy,
  restate,
  sortContactsByAlias,
  timeago,
} from '../helpers/utils.js'
// import { updateAllFunds, } from '../helpers/wallet.js'

function getAvatar(c) {
  let initials = c.info?.name?.
    split(' ').map(n => n[0]).join('') || ''

  if (!initials) {
    initials = (c.alias || c.info?.preferred_username)?.[0] || ''
  }

  let avStr = `<div class="avatar" style="`

  if (c.info?.picture) {
    avStr += `color:transparent;background-image:url(${c.info.picture});`
  }

  // Gravatar
  // if (c.info.email) {
  //   avStr += `color:transparent;background-image:url(${c.info.email});`
  // }

  return html`${avStr}">${initials}</div>`
}

let _handlers = []

const initialState = {
  id: 'Contacts',
  name: 'List',
  placement: 'contacts',
  rendered: null,
  responsive: true,
  delay: 500,
  wallet: {},
  contacts: [],
  restate,
  render(
    renderState = {},
    position = 'afterbegin',
  ) {},
  header: state => html`
    <header>
      <h6>Contacts (${state.contacts.length})</h6>
      <button
        id="add_contact"
        class="pill rounded"
        title="Add a Contact"
      >
        <svg class="plus-circle" width="26" height="26" viewBox="0 0 16 16">
          <use xlink:href="#icon-plus-circle"></use>
        </svg>
        New Contact
      </button>
    </header>
  `,
  content: state => html`
    ${state.header(state)}

    <div>
      ${
        state.contacts.length > 0
          ? state.contacts.map(c => state.item(c)).join('')
          : ''
      }
      ${
        state.contacts.length === 0 ?
        html`<span class="flex flex-fill center">No Contacts found</span>` : ''
      }
    </div>

    ${state.footer(state)}
  `,
  item: c => {
    let paired = Object.keys(c?.outgoing || {}).length > 0
    let created = c.created_at
      ? timeago(Date.now() - (new Date(c.created_at)).getTime())
      : ''
    let finishPairing = !paired
      ? 'Finish pairing with contact'
      : ''
    let user = c.alias || c.info?.preferred_username
    let name = c.info?.name || created
    let inId = Object.keys(c.incoming)[0].split('/')[1]

    let itemAlias = user
      ? `@${user}${ !paired ? ' - ' : '' }${finishPairing}`
      : finishPairing
    let itemName = name
      ? `${name}`
      : ''
    let itemSub = inId
      ? `data-id="${inId}"`
      : ''

    return html`
      <article ${itemSub}>
        ${getAvatar(c)}
        <address>
          <h4>${itemAlias}</h4>
          <h5>${itemName}</h5>
        </address>
      </article>
    `
  },
  footer: state => html``,
  slugs: {
  },
  elements: {
  },
  events: {
    // handleChange: state => event => {
    //   event.preventDefault()
    //   // console.log(
    //   //   'handle balance change',
    //   //   [event.target],
    //   // )
    // },
    handleClick: state => event => {
      event.preventDefault()
      console.log(
        'handle contacts click',
        event,
        state,
      )
    },
    handleContactsChange: (newState, oldState) => {
      if (newState.contacts !== oldState.contacts) {
        // console.log(
        //   'handle contacts update',
        //   {newState, oldState}
        // )

        newState.render?.({
          contacts: newState.contacts?.sort(sortContactsByAlias),
        })
      }
    }
  },
}

let state = envoy(
  initialState,
  initialState.events.handleContactsChange,
)

export async function setupContactsList(
  el, setupState = {}
) {
  console.log(
    'setupContactsList state.contacts',
    state.contacts
  )
  restate(state, setupState)
  // if (setupState?.events?.handleContactsChange) {
  //   state._listeners = [
  //     setupState?.events?.handleContactsChange
  //   ]
  // }

  state.slugs.section = `${state.name}_${state.id}`
    .toLowerCase().replace(' ', '_')

  const section = document.createElement('section')

  state.elements.section = section

  section.id = state.slugs.section
  section.classList.add(state.placement || '')
  section.innerHTML = state.content(state)

  function addListener(
    node,
    event,
    handler,
    capture = false
  ) {
    _handlers.push({ node, event, handler, capture })
    node.addEventListener(event, handler, capture)
  }

  function addListeners() {
    // addListener(
    //   section,
    //   'close',
    //   state.events.handleChange(state)
    // )
    addListener(
      section,
      'click',
      state.events.handleClick(state),
    )
  }

  function removeAllListeners(
    targets = [section],
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

  state.removeAllListeners = removeAllListeners

  async function render(
    renderState = {},
    position = 'afterbegin',
  ) {
    await restate(state, renderState)

    section.id = state.slugs.section
    section.innerHTML = state.content(state)

    removeAllListeners()
    addListeners()

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

export default setupContactsList
