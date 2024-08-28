import {
  formDataEntries,
  createSignal,
} from '../helpers/utils.js'

import {
  lit as html,
} from '../helpers/lit.js'

export const CrowdNodeCard = (() => {
  const initCfg = {
    state: {},
    slugs: {},
    events: {},
    elements: {},
    markup: {},
  }
  const initialState = {
    id: 'Card',
    name: 'Card',
    withdrawTxt: 'Withdraw',
    withdrawAlt: 'Withdraw from Crowdnode',
    depositTxt: 'Deposit',
    depositAlt: `Deposit to Crowdnode`,
    signupTxt: 'Signup',
    signupAlt: `Signup for Crowdnode`,
    placement: 'center',
    rendered: null,
    responsive: true,
  }

  const cn = function Crowdnode(
    config = {}
  ) {
    config = {
      ...initCfg,
      ...config,
    }

    this.appElement = document.body

    this.api = createSignal({})

    this.state = {
      ...initialState,
      ...config.state,
    }

    this.slugs = {
      form: this.state.name?.toLowerCase().replaceAll(' ', '_'),
      ...config.slugs,
    }

    this.elements = {
      ...config.elements,
    }

    this.markup = {}
    this.markup.content = () => html`
      <header>
        <a href="https://app.crowdnode.io/" target="_blank" rel="noreferrer">
          <svg class="crowdnode-logo lock" width="26" height="26" viewBox="0 0 240 240">
            <use xlink:href="#icon-crowdnode-logo"></use>
          </svg>
          <span>CrowdNode</span>
        </a>
      </header>

      <section class="flex col jc-between">
          ${!this.api.value?.acceptedToS && html`
            Start earning interest by staking your Dash at CrowdNode
          `}
          ${this.api.value?.acceptedToS && html`
            <p class="my-0"><em>
              Balance: Ð ${this.api.value?.balance}
            </em></p>
          `}
          ${this.api.value?.acceptedToS && html`
            <p class="my-0"><em>
              Earned: Ð ${this.api.value?.earned}
            </em></p>
          `}
      </section>

      <footer class="flex">
        ${!this.api.value?.acceptedToS && html`
          <button
            class="rounded outline flex-fill"
            type="submit"
            name="intent"
            value="signup"
            title="${this.state.signupAlt}"
          >
            ${this.state.signupTxt}
          </button>
        `}
        ${this.api.value?.acceptedToS && html`
          <button
            class="rounded outline flex-fill"
            type="submit"
            name="intent"
            value="deposit"
            title="${this.state.depositAlt}"
          >
            ${this.state.depositTxt}
          </button>
        `}
        ${this.api.value?.acceptedToS && this.api.value?.balance > 0 && html`
          <button
            class="rounded outline flex-fill"
            type="submit"
            name="intent"
            value="withdraw"
            title="${this.state.withdrawAlt}"
          >
            ${this.state.withdrawTxt}
          </button>
        `}
      </footer>
    `
    this.markup = {
      ...this.markup,
      ...config.markup,
    }

    this.events = {
      submit: event => {
        event.preventDefault()
        event.stopPropagation()

        this.elements.form?.removeEventListener('submit', this.events.submit)

        let fde = formDataEntries(event)

        console.log(
          `${this.slugs.form} submit`,
          {event, fde},
        )
      },
      ...config.events,
    }

    const $d = document

    const form = $d.createElement('form')

    this.elements.form = form

    form.name = `${this.slugs.form}`
    form.classList.add('flex', 'col', 'card')
    form.innerHTML = this.markup.content()

    this.api.on((apiChange) => {
      console.log('CN Card API Change', apiChange)
      this.render?.({})
    })

    /**
     * Update the config of the CN Card
     * @function
     */
    this.updateConfig = (config = {}) => {
      console.log('CN Card updateConfig TOP', config)

      for (let param in config) {
        this[param] = {
          ...this[param],
          ...(config[param] || {}),
        }
      }

      console.log('CN Card updateConfig BOT', this)
    }

    /**
     * Trigger the rendering of the CN Card
     * @function
     */
    this.render = ({
      cfg = {},
      position = 'afterend',
      el = this.appElement,
    }) => {
      console.log('crowdnode render', this)

      this.elements.form?.removeEventListener?.(
        'submit',
        this.events.submit,
      )

      if (el !== this.appElement) {
        this.appElement = el
      }

      this.updateConfig(cfg)

      this.elements.form.name = this.slugs.form
      this.elements.form.innerHTML = this.markup.content()

      this.elements.form.addEventListener(
        'submit',
        this.events.submit,
      )

      console.log('CARD RENDER', this, cfg)

      if (!this.state.rendered) {
        el.insertAdjacentElement(position, this.elements.form)
        this.state.rendered = this.elements.form
      }

      this.events?.render?.(this)
    }

    return this
  }

  return cn
})();

export default CrowdNodeCard
