import { lit as html } from '../helpers/lit.js'

const initialState = {
  content: state => html`
    <footer>
      <h4>Alpha stage, not production ready. <span>Use at your own risk.</span></h4>
      <h5>Checkout the <a target="_blank" href="https://github.com/dashhive/wallet-ui">Source Code</a></h5>
    </footer>
  `,
  elements: {
    container: document.createElement('template'),
  },
}

export async function setupMainFooter(
  el, state = {}
) {
  state = {
    ...initialState,
    ...state,
  }

  let {
    container,
  } = state.elements

  container.innerHTML = state.content(state)

  return {
    element: container,
    render: (position = 'beforeend') =>
      el.insertAdjacentElement(position, container)
  }
}

export default setupMainFooter
