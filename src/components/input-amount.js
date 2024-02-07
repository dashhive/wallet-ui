import { lit as html } from '../helpers/lit.js'

const initialState = {
  id: 'Input',
  name: 'Amount',
  placement: 'field',
  rendered: null,
  responsive: true,
  delay: 500,
  content: state => html`
    <label for="amount">
      ${state.name}
    </label>
    <div class="row">
      <label for="amount">
        <svg width="32" height="33" viewBox="0 0 32 33">
          <use xlink:href="#icon-dash-mark"></use>
        </svg>
      </label>
      <input
        type="number"
        id="amount"
        name="amount"
        placeholder="0.12345"
        min="0"
        step=".00001"
        spellcheck="false"
        autocomplete="off"
      />
    </div>

    <div class="error"></div>
  `,
  slugs: {
  },
  elements: {
  },
  events: {
    handleChange: state => event => {
      event.preventDefault()
      console.log(
        'handle amount change',
        event?.target?.validationMessage,
        event?.target?.validity,
        [event.target],
        event?.target?.type
      )
      // if (
      //   event?.target?.validity?.patternMismatch &&
      //   event?.target?.type !== 'checkbox'
      // ) {
      //   console.log(
      //     'handle funds change',
      //     event?.target?.validationMessage,
      //     event?.target?.validity,
      //     [event.target],
      //     event?.target?.type
      //   )
      //   let label = event.target?.previousElementSibling?.textContent?.trim()
      //   if (label) {
      //     event.target.setCustomValidity(`Invalid ${label}`)
      //   }
      //   // event.target.reportValidity()
      // } else if (event?.target?.validity?.valid) {
      //   event.target.setCustomValidity('')
      // }
      // event.target.reportValidity()
    },
    handleClick: state => event => {
      if (event.target === state.elements.funds) {
        console.log(
          'handle funds backdrop click',
          event,
          event.target === state.elements.funds
        )
      }
    }
  },
}

export function setupInputAmount(
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

  state.slugs.fieldset = `${state.name}_${state.id}`.toLowerCase().replace(' ', '_')

  const fieldset = document.createElement('div')

  state.elements.fieldset = fieldset

  fieldset.id = state.slugs.fieldset
  fieldset.classList.add(state.placement)
  fieldset.innerHTML = state.content(state)

  fieldset.addEventListener(
    'click',
    state.events.handleClick(state)
  )
  fieldset.addEventListener(
    'change',
    state.events.handleChange(state)
  )

  return {
    element: fieldset,
    renderAsHTML: (
      renderState = {},
      position = 'beforebegin'
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

      fieldset.id = state.slugs.fieldset
      // fieldset.name = `${state.slugs.fieldset}`
      fieldset.innerHTML = state.content(state)

      return fieldset.outerHTML
    },
    render: (
      renderState = {},
      position = 'afterend',
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

      fieldset.id = state.slugs.fieldset
      // fieldset.name = `${state.slugs.fieldset}`
      fieldset.innerHTML = state.content(state)

      if (!state.rendered) {
        el.insertAdjacentElement(position, fieldset)
        state.rendered = fieldset
      }
    }
  }
}

export default setupInputAmount
