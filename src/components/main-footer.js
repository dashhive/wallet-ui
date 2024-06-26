import { lit as html } from '../helpers/lit.js'

const initialState = {
  rendered: null,
  content: state => html`
    <footer>
      <h4>Alpha stage, not production ready. <div>Use at your own risk.</div></h4>
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
    render: (
      renderState = {},
      position = 'beforeend',
    ) => {
      // el.insertAdjacentElement(position, container)
      for (let child of container.content.childNodes) {
        if (child.nodeType !== 3) {
          if (!state.rendered) {
            el.insertAdjacentElement(
              position,
              child,
            )
            state.rendered = child
          }
        }
      }
    }
  }
}

export default setupMainFooter
