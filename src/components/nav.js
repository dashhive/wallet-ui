import { lit as html } from '../helpers/lit.js'

const initialState = {
  data: {
    alias: 'alias'
  },
  content: state => html`
    <nav>
      <a class="brand" href="#home">
        <svg viewBox="0 0 101 32">
          <use xlink:href="#icon-logo"></use>
        </svg>
      </a>
      <a class="alias" href="#me">@${state.data?.alias}</a>
    </nav>
  `,
  elements: {
    container: document.createElement('template'),
  },
}

export async function setupNav(
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
    render: (position = 'beforebegin') => {
      // el.insertAdjacentHTML(position, html`
      //   <nav>
      //     <a class="brand" href="#home">Incubator Wallet</a>
      //     <a class="alias" href="#me">@${state.data?.alias}</a>
      //   </nav>
      // `)
      // for some reason `container.content.children`
      // only gets the first element, not all elements
      for (let child of container.content.childNodes) {
        if (child.nodeType !== 3) {
          el.insertAdjacentElement(
            position,
            child,
          )
        }
      }
    }
  }
}

export default setupNav
