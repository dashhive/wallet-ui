/**
 *
 * @param {TemplateStringsArray} s
 * @param  {...any} args
 *
 * @returns {string}
 */
export const lit = (s, ...v) => String.raw({ raw: s }, ...v)
