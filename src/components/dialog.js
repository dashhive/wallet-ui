import { lit as html } from '../helpers/lit.js'
import { formDataEntries } from '../helpers/utils.js'

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
      // console.log(
      //   'handle dialog change',
      //   event?.target?.validationMessage,
      //   event?.target?.validity,
      //   [event.target],
      //   event?.target?.type
      // )
      if (
        event?.target?.validity?.patternMismatch &&
        event?.target?.type !== 'checkbox'
      ) {
        let label = event.target?.previousElementSibling?.textContent?.trim()
        if (label) {
          event.target.setCustomValidity(`Invalid ${label}`)
        }
      // } else if (event?.target?.validity?.valid) {
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
      // state.elements.dialog?.removeEventListener(
      //   'close',
      //   state.events.handleClose
      // )
      // @ts-ignore
      // event?.target?.remove()
      console.log(
        'handle dialog close',
        event,
        event.target === state.elements.dialog,
        state.elements.dialog.returnValue
      )

      if (state.elements.dialog.returnValue !== 'cancel') {
        // handle submit
        // state.elements.dialog.close('submit')
        resolve(state.elements.dialog.returnValue)
      } else {
        // handle cancel
        // state.elements.dialog.close('cancel')
        reject()
      }

      setTimeout(t => {
        event?.target?.remove()
      }, state.delay)
    },
    handleSubmit: state => event => {
      event.preventDefault()
      state.elements.form?.removeEventListener('submit', state.events.handleSubmit)

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

  function addListeners(
    resolve,
    reject,
  ) {
    // dialog.addEventListener(
    //   'cancel',
    //   state.events.handleClose(state)
    // )
    dialog.addEventListener(
      'close',
      state.events.handleClose(state, resolve, reject)
    )
    dialog.addEventListener(
      'click',
      state.events.handleClick(state)
    )

    dialog.insertAdjacentElement(
      'afterbegin',
      form
    )

    form.addEventListener(
      'change',
      state.events.handleChange(state)
    )
    form.addEventListener(
      'reset',
      state.events.handleReset(state)
    )
    form.addEventListener(
      'submit',
      state.events.handleSubmit(state)
    )
  }

  function removeListeners(
    resolve,
    reject,
  ) {
    dialog.removeEventListener(
      'close',
      state.events.handleClose(state, resolve, reject)
    )
    dialog.removeEventListener(
      'click',
      state.events.handleClick(state)
    )

    form.removeEventListener(
      'change',
      state.events.handleChange(state)
    )
    form.removeEventListener(
      'reset',
      state.events.handleReset(state)
    )
    form.removeEventListener(
      'submit',
      state.events.handleSubmit(state)
    )
  }

  // addListeners()

  return {
    element: dialog,
    // TODO: Remove old event listeners for promises
    // FIX: SEMI-Functional, needs more work
    show: () => new Promise((resolve, reject) => {
      // if (state.rendered) {
      //   removeListeners(state)
      // }
      removeListeners(resolve, reject)
      addListeners(resolve, reject)
      dialog.show()
    }),
    // TODO: Remove old event listeners for promises
    // FIX: SEMI-Functional, needs more work
    showModal: () => new Promise((resolve, reject) => {
      removeListeners(resolve, reject)
      addListeners(resolve, reject)
      dialog.showModal()
    }),
    close: returnVal => dialog.close(returnVal),
    render: async (
      renderState = {},
      position = 'afterend',
    ) => {
      let oldState = state
      // if (state.rendered) {
      //   removeListeners(state)
      // }

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

      console.log('DIALOG RENDER STATE', state, renderState)

      console.log('DIALOG RENDER', position, state.slugs.dialog)

      if (!state.rendered) {
        el.insertAdjacentElement(position, dialog)
        state.rendered = dialog
      }

      // addListeners(state)
    }
  }
}

export default setupDialog
