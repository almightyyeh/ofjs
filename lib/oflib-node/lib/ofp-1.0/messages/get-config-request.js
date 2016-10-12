/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

(function () {
  const util = require('util');
  const ofp = require('../ofp.js');

  let offsets = ofp.offsets.ofp_header;

  module.exports = {
    unpack: function (buffer, offset) {
      let message = {
        header: {type: 'OFPT_GET_CONFIG_REQUEST'}
      };

      let len = buffer.readUInt16BE(offset + offsets.length, true);
      if (len !== ofp.sizes.ofp_header) {
        throw new Error(util.format('%s message at offset %d has invalid length (%d).',
                                    message.header.type, offset, len));
      }

      return {
        message: message,
        offset: offset + len
      };
    }
  };
})();