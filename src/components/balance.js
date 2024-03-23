import { lit as html } from '../helpers/lit.js'
import { envoy, formatDash, } from '../helpers/utils.js'
import { updateAllFunds, } from '../helpers/wallet.js'

const initialState = {
  id: 'Balance',
  name: 'Dash',
  placement: 'ta-left',
  rendered: null,
  responsive: true,
  delay: 500,
  wallet: {},
  walletFunds: { balance: 0 },
  addr: null,
  maxlen: 10,
  fract: 8,
  sigsplit: 3,
  render(
    renderState = {},
    position = 'afterbegin',
  ) {},
  restate(renderState = {}) {},
  header: state => html`
    <figcaption>${state.name} ${state.id}</figcaption>
  `,
  content: state => {
    let balance = formatDash(
      state.walletFunds.balance,
      {
        fract: state.fract,
        maxlen: state.maxlen,
        sigsplit: state.sigsplit,
      }
    )

    return html`
      ${state.header(state)}

      <div title="${state.walletFunds.balance}">
        <svg width="32" height="33" viewBox="0 0 32 33">
          <use xlink:href="#icon-dash-mark"></use>
        </svg>
        ${balance}
      </div>

      ${state.footer(state)}
    `
  },
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
      // console.log(
      //   'handle balance click',
      //   event,
      //   event.target === state.elements.balance
      // )

      if (state?.wallet && state.walletFunds) {
        updateAllFunds(state.wallet, state.walletFunds)
          .then(balance => {
            console.log(
              'Update Balance',
              balance,
            )
            state.walletFunds = { balance }
          })
          .catch(err => console.error('catch updateAllFunds', err, state?.wallet))
      }
    },
    handleBalance: (newState, oldState) => {
      if (
        newState?.walletFunds?.balance !==
        oldState?.walletFunds?.balance
      ) {
        // console.log(
        //   'handle balance update',
        //   {newState, oldState}
        // )

        newState.elements.figure.innerHTML = newState.content(newState)
      }
    }
  },
}

export async function setupBalance(
  el, setupState = {}
) {
  let _state = {
    ...initialState,
    ...setupState,
    slugs: {
      ...initialState.slugs,
      ...setupState.slugs,
    },
    events: {
      ...initialState.events,
      ...setupState.events,
    },
    elements: {
      ...initialState.elements,
      ...setupState.elements,
    }
  }
  let state = envoy(
    _state,
    _state.events.handleBalance,
  )

  state.slugs.figure = `${state.name}_${state.id}`
    .toLowerCase().replace(' ', '_')

  const figure = document.createElement('figure')

  state.elements.figure = figure

  figure.id = state.slugs.figure
  figure.classList.add(state.placement || '')
  figure.innerHTML = state.content(state)

  figure.addEventListener(
    'click',
    state.events.handleClick(state)
  )
  figure.addEventListener(
    'change',
    state.events.handleChange(state)
  )

  function render (
    renderState = {},
    position = 'afterbegin',
  ) {
    restate(renderState)

    figure.id = state.slugs.figure
    figure.innerHTML = state.content(state)

    if (!state.rendered) {
      el.insertAdjacentElement(position, figure)
      state.rendered = figure
    }
  }

  state.render = render

  function restate (
    renderState = {},
  ) {
    Object.keys(renderState).forEach(
      prop => {
        state[prop] = renderState[prop]
      }
    )
  }

  return {
    element: figure,
    render,
    restate,
  }
}

export default setupBalance
