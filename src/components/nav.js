import { lit as html } from '../helpers/lit.js'

const initialState = {
  data: {
    alias: 'alias'
  },
  rendered: null,
  content: state => html`
    <a class="brand" href="/#home">
      <svg viewBox="0 0 101 32">
        <use xlink:href="#icon-logo"></use>
      </svg>
    </a>
    <menu>
      <li>
        <a id="nav-alias" class="alias" href="/#me">
          @${state.data?.alias}
        </a>
        <menu class="user hidden">
          <li><a id="nav-edit-profile" class="profile" href="/#me">
            Edit Profile
          </a></li>
          <li><a id="nav-backup" class="backup" href="/#backup">
            Backup Wallet
          </a></li>
          <li><a id="nav-lock" class="lock" href="/#lock">
            Lock
          </a></li>
          <li><a id="nav-disconnect" class="disconnect" href="/#disconnect">
            Disconnect
          </a></li>
        </menu>
      </li>
    </menu>
  `,
  elements: {
    nav: document.createElement('nav'),
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
    nav,
  } = state.elements

  nav.innerHTML = state.content(state)

  return {
    element: nav,
    render: (
      renderState = {},
      position = 'beforebegin',
    ) => {
      state = {
        ...state,
        ...renderState,
        elements: {
          ...state.elements,
          ...renderState.elements,
        }
      }

      nav.innerHTML = state.content(state)

      if (!state.rendered) {
        el.insertAdjacentElement(position, nav)
        state.rendered = nav
      }

      // for (let child of container.content.childNodes) {
      //   if (child.nodeType !== 3) {
      //     // if (!state.rendered) {
      //       el.insertAdjacentElement(
      //         position,
      //         child,
      //       )
      //       state.rendered = child
      //     // }
      //   }
      // }
    }
  }
}

export default setupNav
