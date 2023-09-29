import { lit as html } from '../helpers/lit.js'
import { envoy, restate, } from '../helpers/utils.js'
// import { updateAllFunds, } from '../helpers/wallet.js'

function getAvatar(profile) {
  if (profile.picture) {
    return html`<div
      class="avatar"
      style="background-image:url(${profile.picture});"
    ></div>`
  }

  // Gravatar
  // if (profile.email) {
  //   return html`<div
  //     class="avatar"
  //     style="background-image:url(${profile.email});"
  //   ></div>`
  // }

  return html`<div class="avatar" >${
    profile?.name?.
      split(' ').map(n => n[0]).join('')
  }</div>`
}

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
        id="phrase"
        class="pill rounded copy"
        title="Add a Contact"
      >
        <i class="icon-plus-circle"></i>
        New Contact
      </button>
    </header>
  `,
  content: state => html`
    ${state.header(state)}

    <div>
      ${
        state.contacts.map(c => state.item(c)).join('')
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
    handleChange: state => event => {
      event.preventDefault()
      // console.log(
      //   'handle balance change',
      //   [event.target],
      // )
    },
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

  section.addEventListener(
    'click',
    state.events.handleClick(state)
  )
  section.addEventListener(
    'change',
    state.events.handleChange(state)
  )

  function render (
    renderState = {},
    position = 'afterbegin',
  ) {
    restate(state, renderState)

    section.id = state.slugs.section
    section.innerHTML = state.content(state)

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
