import { lit as html } from '../helpers/lit.js'
import { envoy, restate, } from '../helpers/utils.js'
// import { updateAllFunds, } from '../helpers/wallet.js'

function getAvatar(profile) {
  let initials = profile?.name?.
    split(' ').map(n => n[0]).join('') || ''
  let avStr = `<div class="avatar" style="`

  if (profile?.picture) {
    avStr += `color:transparent;background-image:url(${profile.picture});`
  }

  // Gravatar
  // if (profile.email) {
  //   avStr += `color:transparent;background-image:url(${profile.email});`
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
  item: c => html`
    <article>
      ${getAvatar(c.profile)}
      <address>
        <h4>@${c.profile?.preferred_username}</h4>
        <h5>${c.profile?.name}</h5>
      </address>
    </article>
  `,
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
      console.log(
        'handle contacts update',
        {newState, oldState}
      )
      // if (
      //   newState?.walletFunds?.balance !==
      //   oldState?.walletFunds?.balance
      // ) {
      //   newState.elements.figure.innerHTML = newState.content(newState)
      // }
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

  async function render (
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
    restate,
  }
}

export default setupContactsList
