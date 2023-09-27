import { lit as html } from '../helpers/lit.js'
import { fixedDash, envoy, } from '../helpers/utils.js'
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
  render(
    renderState = {},
    position = 'afterbegin',
  ) {},
  restate(
    renderState = {},
  ) {},
  header: state => html`
    <figcaption>${state.name} ${state.id}</figcaption>
  `,
  content: state => {
    let funds = 0
    let balance = `${funds}`

    if (state.walletFunds.balance) {
      funds += state.walletFunds.balance
      balance = fixedDash(funds, state.fract)

      // console.log('balance fixedDash', balance, balance.length)

      let [fundsInt,fundsFract] = balance.split('.')
      state.maxlen -= fundsInt.length

      let fundsFraction = fundsFract?.substring(
        0, Math.min(Math.max(0, state.maxlen), 3)
      )

      let fundsRemainder = fundsFract?.substring(
        fundsFraction.length,
        Math.max(0, state.maxlen)
      )

      balance = html`${
        fundsInt
      }<sub><span>.${
        fundsFraction
      }</span>${
        fundsRemainder
      }</sub>`
    }

    return html`
      ${state.header(state)}

      <div title="${funds}">
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
      console.log(
        'handle balance change',
        [event.target],
      )
    },
    handleClick: state => event => {
      event.preventDefault()
      console.log(
        'handle balance click',
        event,
        event.target === state.elements.balance
      )

      if (state?.wallet) {
        updateAllFunds(state?.wallet)
          .then(balance => {
            console.log(
              'Update Balance',
              balance,
            )
            state.walletFunds = { balance }
          })
      }
    },
    handleBalance: (newState, oldState) => {
      if (
        newState?.walletFunds?.balance !==
        oldState?.walletFunds?.balance
      ) {
        console.log(
          'handle balance proxy change',
          {newState, oldState}
        )

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
