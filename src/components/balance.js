import { lit as html } from '../helpers/lit.js'
import { checkWalletFunds } from '../helpers/utils.js'

const initialState = {
  id: 'Balance',
  name: 'Dash',
  placement: 'ta-left',
  responsive: true,
  delay: 500,
  walletFunds: {},
  addr: null,
  header: state => html`
    <figcaption>${state.name} ${state.id}</figcaption>
  `,
  content: state => html`
    ${state.header(state)}

    <div>
      <svg width="32" height="33" viewBox="0 0 32 33">
        <use xlink:href="#icon-dash-mark"></use>
      </svg>
      ${
        parseInt(
          state.walletFunds.balance,
          10
        )
      }<sub>.${
        parseFloat(
          state.walletFunds.balance
        ).toFixed(3).split('.')[1]
      }</sub>
    </div>

    ${state.footer(state)}
  `,
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
    }
  },
}

export async function setupBalance(
  el, setupState = {}
) {
  let state = {
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

  console.log('state?.addr', state?.addr)

  if (state?.addr !== null) {
    state.walletFunds = await checkWalletFunds(state.addr)
  }

  state.slugs.figure = `${state.name}_${state.id}`.toLowerCase().replace(' ', '_')

  const figure = document.createElement('figure')

  state.elements.figure = figure

  figure.id = state.slugs.figure
  figure.classList.add(state.placement)
  figure.innerHTML = state.content(state)

  figure.addEventListener(
    'click',
    state.events.handleClick(state)
  )
  figure.addEventListener(
    'change',
    state.events.handleChange(state)
  )

  return {
    element: figure,
    render: (
      renderState = {},
      position = 'afterbegin',
    ) => {
      state = {
        ...state,
        ...renderState,
        slugs: {
          ...state.slugs,
          ...renderState.slugs,
        },
        events: {
          ...state.events,
          ...renderState.events,
        },
        elements: {
          ...state.elements,
          ...renderState.elements,
        }
      }

      figure.id = state.slugs.figure
      figure.innerHTML = state.content(state)

      console.log('BALANCE RENDER STATE', state, renderState)

      console.log('BALANCE RENDER', position, state.slugs.figure)
      el.insertAdjacentElement(position, figure)
    }
  }
}

export default setupBalance
