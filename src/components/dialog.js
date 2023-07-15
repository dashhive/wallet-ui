import { lit as html } from '../helpers/lit.js'

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
  elements: {
    // dialog: (() => document.createElement('dialog'))(),
    // form: (() => document.createElement('form'))(),
    // progress: (() => document.createElement('progress'))(),
  },
  events: {
    handleClose: state => async event => {
      event.preventDefault()
      state.elements.dialog?.removeEventListener(
        'close',
        state.events.handleClose
      )
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
      } else {
        // handle cancel
        // state.elements.dialog.close('cancel')
      }

      setTimeout(t => {
        event?.target?.remove()
      }, state.delay)
    },
    handleSubmit: state => event => {
      event.preventDefault()
      state.elements.form?.removeEventListener('submit', state.events.handleSubmit)

      let fd = new FormData(event.target, event.submitter
        )
      let fde = Object.fromEntries(fd.entries())

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
        // form?.removeEventListener('close', handleClick)
        state.elements.dialog.close('cancel')
      }
    }
  },
}

export function setupDialog(
  el, stateB = {}
) {
  let state = {
    ...initialState,
    ...stateB,
    events: {
      ...initialState.events,
      ...stateB.events,
    },
    elements: {
      ...initialState.elements,
      ...stateB.elements,
    }
  }

  // state = Object.assign({}, initialState, state)

  let dialogSlug = `${state.name}_${state.id}`.toLowerCase().replace(' ', '_')
  let formSlug = state.name?.toLowerCase().replace(' ', '_')
  // let {
  //   progress,
  //   dialog,
  //   form,
  // } = state.elements

  const dialog = document.createElement('dialog')
  const form = document.createElement('form')
  const progress = document.createElement('progress')

  state.elements.dialog = dialog
  state.elements.form = form
  state.elements.progress = progress

  progress.classList.add('pending')

  dialog.innerHTML = ``
  dialog.id = dialogSlug
  if (state.responsive) {
    dialog.classList.add('responsive')
  }
  dialog.classList.add(state.placement)

  form.name = `${formSlug}`
  form.method = 'dialog'
  form.innerHTML = state.content(state)

  // dialog.addEventListener(
  //   'cancel',
  //   state.events.handleClose(state)
  // )
  dialog.addEventListener(
    'close',
    state.events.handleClose(state)
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
    'reset',
    state.events.handleReset(state)
  )
  form.addEventListener(
    'submit',
    state.events.handleSubmit(state)
  )

  return {
    element: dialog,
    show: () => dialog.show(),
    showModal: () => dialog.showModal(),
    close: returnVal => dialog.close(returnVal),
    render: (position = 'afterend') => {
      console.log('DIALOG RENDER', position, dialogSlug)
      el.insertAdjacentElement(position, dialog)
    }
  }
}

export default setupDialog
