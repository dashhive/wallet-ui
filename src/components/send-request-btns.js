import { lit as html } from '../helpers/lit.js'

const initialState = {
  rendered: null,
  content: state => html`
    <form name="send_or_request" class="inline row">
      <button
        class="rounded outline"
        type="submit"
        name="intent"
        value="send"
        title="Send"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <use xlink:href="#icon-arrow-circle-up"></use>
        </svg>
        <span>
          Send
        </span>
      </button>
      <button
        class="rounded outline"
        type="submit"
        name="intent"
        value="request"
        title="Receive"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <use xlink:href="#icon-arrow-circle-down"></use>
        </svg>
        <span>
          Receive
        </span>
      </button>
    </form>
  `,
  elements: {
    container: document.createElement('template'),
  },
}

export async function setupSendRequestBtns(
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
      position = 'afterbegin',
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

export default setupSendRequestBtns
