/**
 *
 * @param {TemplateStringsArray} s
 * @param  {...any} v
 *
 * @returns {string}
 */
export const lit = (s, ...v) => String.raw({ raw: s }, ...v)
