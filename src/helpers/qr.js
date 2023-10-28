"use strict";

import { toDash } from './utils.js'

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
};

/**
 * @param {String} data
 * @param {QrOpts} opts
 */
export function qrSvg (data, opts) {
  console.log('qrSvg', data)
  let qrcode = create(data, opts);
  return qrcode.svg();
};

/**
 * @param {String} addr - Base58Check pubKeyHash address
 * @param {Number} duffs - 1/100000000 of a DASH
 */
export function showQr(addr, duffs = 0) {
  let dashAmount = toDash(duffs);
  let dashUri = `dash://${addr}`;
  if (duffs) {
    dashUri += `?amount=${dashAmount}`;
  }

  return qrSvg(dashUri, { indent: 4, size: "mini" });
}
