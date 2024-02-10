import { lit as html } from '../helpers/lit.js'
import {
  envoy,
  restate,
  sortContactsByAlias,
  timeago,
  getAvatar,
} from '../helpers/utils.js'

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
  content: async state => html`
    ${state.header(state)}

    <div>
      ${
        state.contacts.length > 0
          ? (await Promise.all(state.contacts.map(async c => await state.item(c)))).join('')
          : ''
      }
      ${
        state.contacts.length === 0 ?
        html`<span class="flex flex-fill center">No Contacts found</span>` : ''
      }
    </div>

    ${state.footer(state)}
  `,
  item: async c => {
    // console.warn('contact list item', c)
    if ('string' === typeof c) {
      return html`
        <article>
          <address>
            <h4>Encrypted Contact</h4>
          </address>
        </article>
      `
    }
    let outgoing = Object.values(c?.outgoing || {})
    let paired = outgoing.length > 0
    let out = outgoing?.[0]
    let created = c.createdAt
      ? timeago(Date.now() - (new Date(c.createdAt)).getTime())
      : ''
    let user = c.alias || c.info?.preferred_username
    let finishPairing = !paired
      ? 'Finish pairing with contact'
      : ''
    let enterContactInfo = !paired || !user
      ? `Enter contact information for`
      : ''
    let name = c.info?.name

    if (
      !name &&
      !user &&
      !out?.xkeyId &&
      out?.address
    ) {
      name = out?.address
    } else if (!name) {
      name = created
    }

    let inId = Object.keys(c?.incoming || {})?.[0]?.split('/')[1]

    let atUser = user
      ? `@${user}`
      : ''
    let itemAlias = user
      ? `${atUser}${ !paired ? ' - ' : '' }${finishPairing}`
      : finishPairing || enterContactInfo
    let itemName = name
      ? `${name}`
      : ''
    let itemSub = inId
      ? `href="/#!/contact/${atUser || inId}" data-id="${inId}"`
      : ''

    return html`
      <a ${itemSub}>
        ${await getAvatar(c)}
        <address>
          <h4>${itemAlias}</h4>
          <h5>${itemName}</h5>
        </address>
      </a>
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
      // console.log(
      //   'handle contacts click',
      //   event,
      //   state,
      // )
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
  section.innerHTML = await state.content(state)

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
    section.innerHTML = await state.content(state)

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
