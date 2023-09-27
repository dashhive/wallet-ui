import { lit as html } from '../helpers/lit.js'
import { formDataEntries } from '../helpers/utils.js'

let _handlers = []

const initialState = {
  id: 'Dialog',
  name: 'Dialog',
  submitTxt: 'Submit',
  submitAlt: 'Submit Form',
  cancelTxt: 'Cancel',
  cancelAlt: `Cancel Form`,
  closeTxt: 'X',
  closeAlt: `Close`,
  placement: 'center',
  rendered: null,
  responsive: true,
  delay: 500,
  addListener () {},
  addListeners () {},
  removeAllListeners (targets) {},
  header: state => html`
    <header>
      <strong>${state.name}</strong>
      <button class="link" type="reset" value="close" title="${state.closeAlt}">
        <span>${state.closeTxt}</span>
      </button>
    </header>
  `,
  content: state => html`
    ${state.header(state)}

    <fieldset>
      ${state.fields}

      <div class="error"></div>
    </fieldset>

    ${state.footer(state)}
  `,
  footer: state => html`
    <footer class="inline">
      <button
        class="rounded"
        type="submit"
        name="intent"
        value="send"
        title="${state.cancelAlt}"
      >
        <span>${state.cancelTxt}</span>
      </button>
      <button
        class="rounded"
        type="submit"
        name="intent"
        value="request"
        title="${state.submitAlt}"
      >
        <span>${state.submitTxt}</span>
      </button>
    </footer>
  `,
  fields: html`
    <label for="thing">
      Thing
    </label>
    <input
      type="text"
      id="thing"
      name="thing"
      placeholder="Do Something"
      minlength="1"
      spellcheck="false"
    />

    <p>Some instructions</p>
  `,
  slugs: {
  },
  elements: {
  },
  events: {
    handleChange: state => event => {
      event.preventDefault()
      if (
        event?.target?.validity?.patternMismatch &&
        event?.target?.type !== 'checkbox'
      ) {
        let label = event.target?.previousElementSibling?.textContent?.trim()
        if (label) {
          event.target.setCustomValidity(`Invalid ${label}`)
        }
      } else {
        event.target.setCustomValidity('')
      }
      event.target.reportValidity()
    },
    handleClose: (
      state,
      resolve = res=>{},
      reject = res=>{},
    ) => async event => {
      event.preventDefault()
      state.removeAllListeners()

      console.log(
        'handle dialog close',
        event,
        event.target === state.elements.dialog,
        state.elements.dialog.returnValue
      )

      if (state.elements.dialog.returnValue !== 'cancel') {
        resolve(state.elements.dialog.returnValue)
      } else {
        reject()
      }

      setTimeout(t => {
        event?.target?.remove()
      }, state.delay)
    },
    handleSubmit: state => event => {
      event.preventDefault()

      let fde = formDataEntries(event)

      state.elements.dialog.returnValue = String(fde.intent)

      console.log(
        'handleSubmit',
        [event],
      )

      state.elements.dialog.close(String(fde.intent))
    },
    handleReset: state => event => {
      event.preventDefault()
      state.elements.form?.removeEventListener('close', state.events.handleReset)
      console.log(
        'handleReset',
        [event.target],
      )
      state.elements.dialog.close('cancel')
    },
    handleClick: state => event => {
      if (event.target === state.elements.dialog) {
        console.log(
          'handle dialog backdrop click',
          event,
          event.target === state.elements.dialog
        )
        state.elements.dialog.close('cancel')
      }
    }
  },
}

export function setupDialog(
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

  state.slugs.dialog = `${state.name}_${state.id}`.toLowerCase().replace(' ', '_')
  state.slugs.form = state.name?.toLowerCase().replace(' ', '_')

  const dialog = document.createElement('dialog')
  const form = document.createElement('form')
  const progress = document.createElement('progress')

  state.elements.dialog = dialog
  state.elements.form = form
  state.elements.progress = progress

  progress.classList.add('pending')

  dialog.innerHTML = ``
  dialog.id = state.slugs.dialog
  if (state.responsive) {
    dialog.classList.add('responsive')
  }
  dialog.classList.add(state.placement)

  form.name = `${state.slugs.form}`
  form.method = 'dialog'
  form.innerHTML = state.content(state)

  dialog.insertAdjacentElement(
    'afterbegin',
    form
  )

  function addListener(
    node,
    event,
    handler,
    capture = false
  ) {
    _handlers.push({ node, event, handler, capture })
    node.addEventListener(event, handler, capture)
  }

  function addListeners(
    resolve,
    reject,
  ) {
    addListener(
      dialog,
      'close',
      state.events.handleClose(state, resolve, reject),
    )
    addListener(
      dialog,
      'click',
      state.events.handleClick(state),
    )

    addListener(
      form,
      'change',
      state.events.handleChange(state),
    )
    addListener(
      form,
      'reset',
      state.events.handleReset(state),
    )
    addListener(
      form,
      'submit',
      state.events.handleSubmit(state),
    )
  }

  function removeAllListeners(
    targets = [dialog,form],
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

  state.removeAllListeners = removeAllListeners

  return {
    element: dialog,
    show: () => new Promise((resolve, reject) => {
      removeAllListeners()
      addListeners(resolve, reject)
      dialog.show()
    }),
    showModal: () => new Promise((resolve, reject) => {
      removeAllListeners()
      addListeners(resolve, reject)
      dialog.showModal()
    }),
    close: returnVal => dialog.close(returnVal),
    render: async (
      renderState = {},
      position = 'afterend',
    ) => {
      let oldState = state

      state = {
        ...oldState,
        ...renderState,
        slugs: {
          ...oldState.slugs,
          ...renderState.slugs,
        },
        events: {
          ...oldState.events,
          ...renderState.events,
        },
        elements: {
          ...oldState.elements,
          ...renderState.elements,
        }
      }

      dialog.id = state.slugs.dialog
      form.name = `${state.slugs.form}`
      form.innerHTML = state.content(state)

      // console.log('DIALOG RENDER', state, position, state.slugs.dialog)

      if (!state.rendered) {
        el.insertAdjacentElement(position, dialog)
        state.rendered = dialog
      }
    }
  }
}

export default setupDialog
