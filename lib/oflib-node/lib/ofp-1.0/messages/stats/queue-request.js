/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

const util = require('util');
const ofp = require('../../ofp.js');

const offsetsHeader = ofp.offsets.ofp_header;
const offsets = ofp.offsets.ofp_queue_stats_request;

module.exports = {
  unpack: function (buffer, offset) {
    let stats = {
      header: {type: 'OFPST_QUEUE'},
      body: {},
    };

    const len = buffer.readUInt16BE(offset + offsetsHeader.length, true);
    if (len !== ofp.sizes.ofp_stats_request + ofp.sizes.ofp_queue_stats_request) {
      throw new Error(util.format('%s stats message at offset %d has invalid length (%d).',
                                  stats.header.type, offset, len));
    }

    const port = buffer.readUInt16BE(offset + ofp.sizes.ofp_stats_request + offsets.port_no, true);
    if (port > ofp.ofp_port.OFPP_MAX) {
      if (port !== ofp.ofp_port.OFPP_ANY) {
        stats.body.port_no = port;
        console.warn('%s stats message at offset %d has invalid port (%d).',
                     stats.header.type, offset, port);
      }
    } else {
      stats.body.port_no = port;
    }

    const queueId = buffer.readUInt32BE(offset + ofp.sizes.ofp_stats_request + offsets.queue_id, true);
    if (queueId !== ofp.OFPQ_ALL) {
      stats.body.queue_id = queueId;
    }

    return {
      stats: stats,
      offset: offset + len,
    };
  },
};
