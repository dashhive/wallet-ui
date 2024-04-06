import { lit as html } from '../helpers/lit.js'
import {
  envoy,
  restate,
  sortContactsByAlias,
  filterPairedContacts,
  filterUnpairedContacts,
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
  showUnpaired: false,
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
      <div class="inline row gap-2">
        <h5 class="lh-2">Contacts</h5>
        <button
          id="paired_contacts"
          class="pill rounded${!state.showUnpaired ? ' active' : ''}"
          title="Paired Contacts"
        >
          Paired <span class="indicator">${state.contacts.filter(filterPairedContacts).length}</span>
        </button>
        <button
          id="unpaired_contacts"
          class="pill rounded${state.showUnpaired ? ' active' : ''}"
          title="Unpaired Contacts"
        >
          Unpaired <span class="indicator">${state.contacts.filter(filterUnpairedContacts).length}</span>
        </button>
      </div>
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
  list: async state => {
    if (state.contacts?.length === 0) {
      return html`<span class="flex flex-fill center">No Contacts found</span>`
    }

    return (
      await Promise.all(
        state.contacts
          .filter(
            state.showUnpaired
              ? filterUnpairedContacts
              : filterPairedContacts
          )
          .sort(sortContactsByAlias)
          .map(async c => await state.item(c)),
      )
    ).join('')
  },
  content: async state => html`
    ${state.header(state)}

    <div>
      ${await state.list(state)}
    </div>

    ${await state.footer(state)}
  `,
  item: async c => {
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
        <!-- <aside class="inline row">
          <button class="pill rounded">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-up"></use>
            </svg>
          </button>
          <button class="pill rounded">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <use xlink:href="#icon-arrow-circle-down"></use>
            </svg>
          </button>
        </aside> -->
      </a>
    `
  },
  datalist: async (state, direction = 'outgoing') => {
    if (state.contacts?.length === 0) {
      return ''
    }

    return (
      await Promise.all(
        state.contacts
          .filter(
            c => c.alias &&
            Object.keys(c[direction] || {}).length > 0
          ).map(contact => {
            return html`<option value="@${
              contact.alias
            }">${
              contact.info?.name || contact.alias
            }</option>`
          })
      )
    ).join('')
  },
  footer: async state => html`
    <datalist id="contactSendAliases">
      ${
        await state.datalist(state, 'outgoing')
      }
    </datalist>
    <datalist id="contactReceiveAliases">
      ${
        await state.datalist(state, 'incoming')
      }
    </datalist>
  `,
  slugs: {
  },
  elements: {
  },
  events: {
    handleClick: state => event => {
      event.preventDefault()
      event.stopPropagation()
      console.log(
        'handle contacts click',
        event,
        state,
      )
    },
    handleContactsChange: (newState, oldState) => {
      if (newState.contacts !== oldState.contacts) {
        newState.render?.({
          contacts: newState.contacts
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
  restate(state, setupState)

  state.slugs.section = `${state.name}_${state.id}`
    .toLowerCase().replace(' ', '_')

  const section = document.createElement('section')

  section.id = state.slugs.section
  section.classList.add(state.placement || '')
  section.innerHTML = await state.content(state)

  state.elements.section = section

  const list = section.querySelector('& > div')
  const sendDataList = section.querySelector('#contactSendAliases')
  const receiveDataList = section.querySelector('#contactReceiveAliases')
  const hdrPaired = section.querySelector('#paired_contacts')
  const hdrUnpaired = section.querySelector('#unpaired_contacts')
  const hdrPairedIndicator = hdrPaired.querySelector('.indicator')
  const hdrUnpairedIndicator = hdrUnpaired.querySelector('.indicator')

  state.elements.list = list
  state.elements.sendDataList = sendDataList
  state.elements.receiveDataList = receiveDataList
  state.elements.hdrPaired = hdrPaired
  state.elements.hdrUnpaired = hdrUnpaired
  state.elements.hdrPairedIndicator = hdrPairedIndicator
  state.elements.hdrUnpairedIndicator = hdrUnpairedIndicator

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
    position = 'afterbegin',
  ) {
    await restate(state, renderState)

    state.elements.section.id = state.slugs.section
    // state.elements.section.innerHTML = await state.content(state)

    state.elements.list.innerHTML = await state.list(state)
    state.elements.sendDataList.innerHTML = await state.datalist(state, 'outgoing')
    state.elements.receiveDataList.innerHTML = await state.datalist(state, 'incoming')

    if (state.showUnpaired) {
      state.elements.hdrPaired.classList.remove('active')
      state.elements.hdrUnpaired.classList.add('active')
    } else {
      state.elements.hdrPaired.classList.add('active')
      state.elements.hdrUnpaired.classList.remove('active')
    }

    state.elements.hdrPairedIndicator.innerText = state.contacts.filter(filterPairedContacts).length
    state.elements.hdrUnpairedIndicator.innerText = state.contacts.filter(filterUnpairedContacts).length

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

export default setupContactsList
