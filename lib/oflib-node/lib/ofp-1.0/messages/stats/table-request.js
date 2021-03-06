/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

const util = require('util');
const ofp = require('../../ofp.js');

const offsetsHeader = ofp.offsets.ofp_header;

module.exports = {
  unpack: function (buffer, offset) {
    let stats = {
      header: {type: 'OFPST_TABLE'},
    };

    const len = buffer.readUInt16BE(offset + offsetsHeader.length, true);
    if (len !== ofp.sizes.ofp_stats_request) {
      throw new Error(util.format('%s stats message at offset %d has invalid length (%d).',
                                  stats.header.type, offset, len));
    }

    return {
      stats: stats,
      offset: offset + len,
    };
  },
};
