"use strict";

/**
 * @typedef QrOpts
 * @property {String} [background]
 * @property {String} [color]
 * @property {String} [ecl]
 * @property {Number} [height]
 * @property {Number} [indent]
 * @property {Number} [padding]
 * @property {"mini" | "micro"} [size]
 * @property {Number} [width]
 * @property {"svg" | "svg-viewbox" | "g"} [container]
 * @property {Boolean} [join]
 */

/**
 * @param {String} data
 * @param {QrOpts} opts
 */
export function create(data, opts) {
  // @ts-ignore
  return new QRCode({
    ...opts,
    content: data,
    width: opts?.width || 256,
    height: opts?.height || 256,
    color: opts?.color || "#000",
    background: opts?.background || "#fff",
    ecl: opts?.ecl || "M",
  });
}

/**
 * @param {String} data
 * @param {QrOpts} opts
 */
export function qrSvg (data, opts) {
  // console.log('qrSvg', data)
  let qrcode = create(data, opts);
  return qrcode.svg();
}
