import {
  DIALOG_STATUS,
} from '../utils/constants.js'

import {
  lit as html,
  formDataEntries,
  toSlug,
  // addListener,
  addListeners,
  removeAllListeners,
} from '../utils/generic.js'

import {
  createSignal,
  effect,
} from '../utils/retort.js'

/**
 * Create a new HTML Dialog
 *
 * @param {Object} config
 */
export function DialogContructor (
  config = {}
) {
  const initCfg = {
    state: {},
    slugs: {},
    events: {},
    elements: {},
    templates: {},
  }
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
    status: DIALOG_STATUS.NOT_LOADING,
  }

  config = {
    ...initCfg,
    ...config,
  }

  this.eventHandlers = []

  this.state = createSignal({
    ...initialState,
    ...config.state,
  })

  this.slugs = {
    dialog: toSlug(this.state.value.name, this.state.value.id),
    form: toSlug(this.state.value.id, this.state.value.name),
    ...config.slugs,
  }

  this.appElement = document.body

  this.elements = {
    ...config.elements,
  }

  this.markup = {}

  effect(() => {
    this.markup.header = html`
      <header>
        <strong>${this.state.value.name}</strong>
        ${
          this.state.value.closeTxt && html`<button class="link" type="reset" value="close" title="${this.state.value.closeAlt}"><span>${this.state.value.closeTxt}</span></button>`
        }
      </header>
    `
    this.markup.footer = html`
      <footer class="inline">
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="send"
          title="${this.state.value.cancelAlt}"
        >
          <span>${this.state.value.cancelTxt}</span>
        </button>
        <button
          class="rounded"
          type="submit"
          name="intent"
          value="request"
          title="${this.state.value.submitAlt}"
        >
          <span>${this.state.value.submitTxt}</span>
        </button>
      </footer>
    `
  })

  this.markup.fields = html`
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
  `

  this.markup.content = () => html`
    ${this.markup.header}

    <fieldset>
      ${this.markup.fields}

      <div class="error"></div>
    </fieldset>

    ${this.markup.footer}
  `

  this.markup = {
    ...this.markup,
    ...config.markup,
  }

  this.events = {
    input: event => {
    },
    change: event => {
    },
    blur: event => {
      // event.preventDefault()
      if (
        event?.target?.validity?.patternMismatch &&
        event?.target?.type !== 'checkbox'
      ) {
        event.preventDefault()
        let label = event.target?.previousElementSibling?.textContent?.trim()
        if (label) {
          event.target.setCustomValidity(`Invalid ${label}`)
        }
      } else {
        event.target.setCustomValidity('')
      }
      event.target.reportValidity()
    },
    focusout: event => {
      // event.preventDefault()
    },
    focusin: event => {
      // event.preventDefault()
    },
    drop: event => {
      event.preventDefault()
    },
    dragover: event => {
      event.preventDefault()
    },
    dragend: event => {
      event.preventDefault()
    },
    dragleave: event => {
      event.preventDefault()
    },
    render: (
      state,
    ) => {
    },
    show: (
      state,
    ) => {
      // focus first input
      this.elements.form.querySelector(
        'input'
      )?.focus()
    },
    close: (
      resolve = res=>{},
      reject = res=>{},
    ) => async event => {
      event.preventDefault()
      removeAllListeners.bind(this)

      this.state.value.status = DIALOG_STATUS.NOT_LOADING
      this.elements.dialog?.querySelector('progress')?.remove()

      if (this.elements.dialog.returnValue !== 'cancel') {
        resolve(this.elements.dialog.returnValue)
      } else {
        resolve('cancel')
      }

      setTimeout(t => {
        this.state.value.rendered = null
        event?.target?.remove()
      }, this.state.value.delay)
    },
    submit: event => {
      event.preventDefault()

      let fde = formDataEntries(event)

      this.elements.dialog.returnValue = String(fde.intent)

      this.elements.dialog.close(String(fde.intent))
    },
    reset: event => {
      event.preventDefault()
      this.elements.form?.removeEventListener(
        'close',
        this.events.reset
      )
      this.elements.dialog.close('cancel')
    },
    click: event => {
      if (event.target === this.elements.dialog) {
        this.elements.dialog.close('cancel')
      }
    },
  }

  const dialogElement = document.createElement('dialog')
  const formElement = document.createElement('form')
  const progressElement = document.createElement('progress')

  this.elements.dialog = dialogElement
  this.elements.form = formElement
  this.elements.progress = progressElement

  this.element = this.elements.dialog

  progressElement.classList.add('pending')

  dialogElement.innerHTML = ``
  dialogElement.id = this.slugs.dialog
  if (this.state.value.responsive) {
    dialogElement.classList.add('responsive')
  }
  dialogElement.classList.add(...(this.state.value.placement.split(' ')))

  formElement.name = `${this.slugs.form}`
  formElement.method = 'dialog'
  formElement.innerHTML = this.markup.content()

  dialogElement.insertAdjacentElement(
    'afterbegin',
    formElement
  )

  /**
   * Show the dialog
   * @function
   */
  this.show = (callback, el = this.appElement) => new Promise((resolve, reject) => {
    removeAllListeners.call(this)
    addListeners.call(this, resolve, reject)
    console.log('modal.js dialog show', this.elements.dialog)

    this.render({
      el,
      position: 'afterend'
    })

    this.elements.dialog.show()
    this.events.show?.(this)
    callback?.()
  })

  /**
   * Show the Modal form of the dialog
   * @function
   */
  this.showModal = (callback, el = this.appElement) => new Promise((resolve, reject) => {
    removeAllListeners.call(this)
    addListeners.call(this, resolve, reject)
    console.log('modal.js dialog showModal', this, this.elements.dialog)

    this.render({
      el,
      // cfg: config,
      position: 'afterend'
    })

    this.elements.dialog.showModal()
    this.events.show?.(this)
    callback?.()
  })

  /**
   * Close the dialog
   * @function
   */
  this.close = returnVal => this.elements.dialog.close(returnVal)

  /**
   * Update the config of the dialog
   * @function
   */
  this.updateConfig = (config = {}) => {
    console.log('Dialog updateConfig TOP', config)

    for (let param in config) {
      if ('value' in this[param]) {
        this[param].value = {
          ...this[param].value,
          ...(config[param] || {}),
        }
      } else {
        this[param] = {
          ...this[param],
          ...(config[param] || {}),
        }
      }
    }

    console.log('Dialog updateConfig BOT', this)
  }

  /**
   * Trigger the rendering of the dialog
   * @function
   */
  this.render = ({
    cfg = {},
    position = 'afterend',
    el = this.appElement,
  }) => {
    console.log('dialog render', this)

    if (el !== this.appElement) {
      this.appElement = el
    }

    this.updateConfig(cfg)

    console.log('DIALOG elements', this, this.elements)

    this.elements.dialog.id = this.slugs.dialog
    this.elements.form.name = this.slugs.form
    this.elements.form.innerHTML = this.markup.content()

    console.log('DIALOG RENDER STATE', this.state.value, cfg)

    console.log('DIALOG RENDER', position, this.slugs.dialog)

    if (
      this.state.value.status === DIALOG_STATUS.LOADING
    ) {
      this.elements.form.insertAdjacentElement(
        'beforebegin',
        this.elements.progress,
      )
    }

    if (
      this.state.value.status === DIALOG_STATUS.SUCCESS ||
      this.state.value.status === DIALOG_STATUS.ERROR
    ) {
      this.elements.dialog.querySelector('progress')?.remove()
    }

    if (!this.state.value.rendered) {
      console.log('!this.state.rendered el', el, this.appElement, this.elements.dialog)
      // @ts-ignore
      el?.insertAdjacentElement(position, this.elements.dialog)
      this.state.value.rendered = this.elements.dialog

      this.elements.dialog.addEventListener(
        'close',
        this.events.close
      )
    }

    this.events.render(this.state)

    return this
  }
}

export default DialogContructor
