import { lit as html } from '../helpers/lit.js'

const initialState = {
  id: 'Dialog',
  name: 'Dialog',
  submitTxt: 'Submit',
  submitAlt: 'Submit Form',
  cancelTxt: 'Cancel',
  cancelAlt: `Cancel Form`,
  placement: 'center',
  responsive: true,
  header: state => html`
    <header>
      <strong>${state.name}</strong>
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
      <button class="link" type="reset" value="cancel" title="${state.cancelAlt}">
        <span>${state.cancelTxt}</span>
      </button>
      <button class="link" type="submit" title="${state.submitAlt}">
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
  delay: 500
}

export async function setupDialog(el, state = {}) {
  state = {
    ...initialState,
    ...state,
  }

  let dialogSlug = `${state.name}_${state.id}`.toLowerCase().replace(' ', '_')
  let formSlug = state.name?.toLowerCase().replace(' ', '_')

  const dialog = document.createElement('dialog')
  const form = document.createElement('form')
  const progress = document.createElement('progress')

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

  let handleClose = async event => {
    event.preventDefault()
    dialog?.removeEventListener('close', handleClose)
    // @ts-ignore
    // event?.target?.remove()
    console.log(
      'handle dialog close',
      event,
      event.target === dialog,
      dialog.returnValue
    )

    if (dialog.returnValue !== 'cancel') {
      // handle submit
      // dialog.close('submit')
    } else {
      // handle cancel
      // dialog.close('cancel')
    }

    setTimeout(t => {
      event?.target?.remove()
    }, state.delay)
  }

  let handleSubmit = event => {
    event.preventDefault()
    form?.removeEventListener('submit', handleSubmit)
    dialog.close('submit')
  }

  let handleReset = event => {
    event.preventDefault()
    form?.removeEventListener('close', handleReset)
    dialog.close('cancel')
  }

  let handleClick = event => {
    if (event.target === dialog) {
      console.log(
        'handle dialog backdrop click',
        event,
        event.target === dialog
      )
      form?.removeEventListener('close', handleClick)
      dialog.close('cancel')
    }
  }

  dialog.addEventListener('close', handleClose)
  dialog.addEventListener('click', handleClick)

  form.addEventListener('reset', handleReset)
  form.addEventListener('submit', handleSubmit)

  dialog.insertAdjacentElement('afterbegin', form)

  el.insertAdjacentElement('afterend', dialog)

  return dialog
}

export default setupDialog
