import { lit as html } from '../helpers/lit.js'
import {
  formDataEntries,
  envoy,
} from '../helpers/utils.js'

let modal = envoy(
  {
    rendered: {},
  },
)

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
  modal,
  rendered: null,
  responsive: true,
  delay: 500,
  async render () {},
  addListener () {},
  addListeners () {},
  removeAllListeners (targets) {},
  header: state => html`
    <header>
      <strong>${state.name}</strong>
      ${
        state.closeTxt && html`<button class="link" type="reset" value="close" title="${state.closeAlt}"><span>${state.closeTxt}</span></button>`
      }
    </header>
  `,
  content: async state => html`
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
      autocomplete="off"
    />

    <p>Some instructions</p>
  `,
  slugs: {
  },
  elements: {
  },
  events: {
    handleInput: state => event => {
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
    handleBlur: state => event => {
      // event.preventDefault()
      // console.log(
      //   'handle input blur',
      //   event,
      // )
    },
    handleFocusOut: state => event => {
      // event.preventDefault()
      // console.log(
      //   'handle input focus out',
      //   event,
      // )
    },
    handleFocusIn: state => event => {
      // event.preventDefault()
      // console.log(
      //   'handle input focus in',
      //   event,
      // )
    },
    handleDrop: state => event => {
      event.preventDefault()
    },
    handleDragOver: state => event => {
      event.preventDefault()
    },
    handleDragEnd: state => event => {
      event.preventDefault()
    },
    handleDragLeave: state => event => {
      event.preventDefault()
    },
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
    handleRender: (
      state,
    ) => {
      // console.log(
      //   'handle dialog render',
      //   state,
      // )
    },
    handleShow: (
      state,
    ) => {
      // console.log(
      //   'handle dialog show',
      //   state,
      // )

      // focus first input
      state.elements.form.querySelector(
        'input'
      )?.focus()
    },
    handleClose: (
      state,
      resolve = res=>{},
      reject = res=>{},
    ) => async event => {
      event.preventDefault()
      state.removeAllListeners()

      // console.log(
      //   'handle dialog close',
      //   event,
      //   event.target === state.elements.dialog,
      //   state.elements.dialog.returnValue
      // )

      if (state.elements.dialog.returnValue !== 'cancel') {
        resolve(state.elements.dialog.returnValue)
      } else {
        resolve('cancel')
      }
      // console.log(
      //   'DIALOG handleClose',
      //   modal.rendered[state.slugs.dialog],
      // )

      setTimeout(t => {
        modal.rendered[state.slugs.dialog] = null
        event?.target?.remove()
        // console.log(
        //   'DIALOG handleClose setTimeout',
        //   state.delay,
        //   // modal.rendered[state.slugs.dialog],
        //   modal.rendered,
        // )
      }, state.delay)
    },
    handleSubmit: state => event => {
      event.preventDefault()

      let fde = formDataEntries(event)

      state.elements.dialog.returnValue = String(fde.intent)

      // console.log(
      //   'handleSubmit',
      //   [event],
      // )

      state.elements.dialog.close(String(fde.intent))
    },
    handleReset: state => event => {
      event.preventDefault()
      state.elements.form?.removeEventListener(
        'close',
        state.events.handleReset
      )
      // console.log(
      //   'handleReset',
      //   [event.target],
      // )
      state.elements.dialog.close('cancel')
    },
    handleClick: state => event => {
      if (event.target === state.elements.dialog) {
        // console.log(
        //   'handle dialog backdrop click',
        //   event,
        //   event.target === state.elements.dialog
        // )
        state.elements.dialog.close('cancel')
      }
    }
  },
}

export async function setupDialog(
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

  state.slugs.dialog = `${state.name}_${state.id}`.toLowerCase()
    .replaceAll(/[^a-zA-Z _]/g, '')
    .replaceAll(' ', '_')
  state.slugs.form = state.name?.toLowerCase()
    .replaceAll(/[^a-zA-Z ]/g, '')
    .replaceAll(' ', '_')

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
  form.innerHTML = await state.content(state)

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
    if (resolve && reject) {
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
    }

    addListener(
      form,
      'blur',
      state.events.handleBlur(state),
    )
    addListener(
      form,
      'focusout',
      state.events.handleFocusOut(state),
    )
    addListener(
      form,
      'focusin',
      state.events.handleFocusIn(state),
    )
    addListener(
      form,
      'change',
      state.events.handleChange(state),
    )
    // let updrop = form.querySelector('.updrop')
    // state.elements.updrop = updrop
    // if (updrop) {
      addListener(
        form,
        'drop',
        state.events.handleDrop(state),
      )
      addListener(
        form,
        'dragover',
        state.events.handleDragOver(state),
      )
      addListener(
        form,
        'dragend',
        state.events.handleDragEnd(state),
      )
      addListener(
        form,
        'dragleave',
        state.events.handleDragLeave(state),
      )
    // }
    addListener(
      form,
      'input',
      state.events.handleInput(state),
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

  state.addListeners = addListeners

  function removeAllListeners(
    targets = [dialog,form],
  ) {
    if (state.elements.updrop) {
      targets.push(state.elements.updrop)
    }
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

  async function render(
    renderState = {},
    position = 'afterend',
  ) {
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
    form.innerHTML = await state.content(state)

    // console.log('DIALOG RENDER', state, position, state.slugs.dialog, modal.rendered)

    if (!modal.rendered[state.slugs.dialog]) {
      el.insertAdjacentElement(position, dialog)
      modal.rendered[state.slugs.dialog] = dialog
    }

    state.events.handleRender(state)
  }

  state.render = render

  return {
    element: dialog,
    show: (callback) => new Promise((resolve, reject) => {
      removeAllListeners()
      addListeners(resolve, reject)
      // console.log('dialog show', dialog)
      dialog.show()
      state.events.handleShow?.(state)
      callback?.()
    }),
    showModal: (callback) => new Promise((resolve, reject) => {
      removeAllListeners()
      addListeners(resolve, reject)
      // console.log('dialog showModal', dialog)
      dialog.showModal()
      state.events.handleShow?.(state)
      callback?.()
    }),
    close: returnVal => dialog.close(returnVal),
    render,
  }
}

export default setupDialog
