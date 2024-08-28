/**
 * Code Highlighting for String Literals.
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#raw_strings MDN Reference}
 *
 * @example
 *    import { lit as html, lit as css } from './utils.js'
 *    let h = html`<div><span>${example}</span></div>`
 *    let c = css`div > span { color: #bad; }`
 *
 *    // falsey values now default to empty string
 *    let falsey = html`<div>${doesNotExist && html`<img src="a.png">`}</div>`

 *    // falsey === '<div></div>'
 *    // instead of
 *    // falsey === '<div>undefined</div>'
 *
 * @param {TemplateStringsArray} s
 * @param  {...any} v
 *
 * @returns {string}
 */
export const lit = (s, ...v) => String.raw({ raw: s }, ...(v.map(x => x || '')))
// export const lit = (s, ...v) => String.raw({ raw: s }, ...v)
