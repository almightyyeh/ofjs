/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

const util = require('util');
const ofp = require('../ofp.js');
const ofputil = require('../../util.js');
const action = require('../action.js');

const offsetsHeader = ofp.offsets.ofp_header;
const offsets = ofp.offsets.ofp_packet_out;

module.exports = {
  unpack: function (buffer, offset) {
    let message = {
      header: {"type" : 'OFPT_PACKET_OUT'},
      body: {},
    };

    const len = buffer.readUInt16BE(offset + offsetsHeader.length, true);
    if (len < ofp.sizes.ofp_packet_out) {
      throw new Error(util.format('%s message at offset %d has invalid length (%d).',
                                  message.header.type, offset, len));
    }

    ofputil.setIfNotEq(message.body, 'buffer_id', buffer.readUInt32BE(offset + offsets.buffer_id, true), 0xffffffff);

    const in_port = buffer.readUInt16BE(offset + offsets.in_port, true);
    if (in_port > ofp.ofp_port.OFPP_MAX) {
      if (in_port === ofp.ofp_port.OFPP_CONTROLLER) {
        message.body.in_port = 'OFPP_CONTROLLER';
      } else {
        message.body.in_port = in_port;
        console.warn('%s message at offset %d has invalid in_port (%d).',
                     message.header.type, offset, in_port);
      }
    } else {
      message.body.in_port = in_port;
    }

    message.body.actions = [];

    const actionsLen = buffer.readUInt16BE(offset + offsets.actions_len, true);
    const actionsEnd = offset + ofp.sizes.ofp_packet_out + actionsLen;

    var pos = offset + offsets.actions;

    while (pos < actionsEnd) {
      var unpack = action.unpack(buffer, pos);
      message.body.actions.push(unpack.action);
      pos = unpack.offset;
    }

    if (pos !== actionsEnd) {
      throw new Error(util.format('%s message at offset %d has extra bytes (%d).',
                                  message.header.type, offset, (pos - len)));
    }

    var dataLen = len - actionsLen - ofp.sizes.ofp_packet_out;

    if (dataLen > 0) {
      if ('buffer_id' in message.body) {
        console.warn('%s message at offset %d has both buffer_id and data.',
                     message.header.type, offset);
      } else {
        message.body.data = new Buffer(dataLen);
        buffer.copy(message.body.data, 0, actionsEnd, actionsEnd + dataLen);
      }
    }

    return {
      message: message,
      offset: offset + len,
    }
  },
  pack: function (message, buffer, offset) {
    //TODO: Clear Buffer check?
    buffer.fill(0, 0 , buffer.length);

    if (buffer.length < offset + ofp.sizes.ofp_packet_out) {
        throw new Error(util.format('%s message at offset %d does not fit the buffer.',
  							      message.header.type, offset));
    }

    buffer.writeUInt8(ofp.ofp_type.OFPT_PACKET_OUT, offset + offsetsHeader.type, true);

    //TODO: validate
    if ('buffer_id' in message.body) {
      var buffer_id = message.body.buffer_id;
    } else {
      var buffer_id = 0xffffffff;
    }
    buffer.writeUInt32BE(buffer_id, offset + offsets.buffer_id, true);

    //TODO: validate
    buffer.writeUInt16BE(message.body.in_port, offset + offsets.in_port, true);

    // buffer.fill(0, offset + offsets.pad, offset + offsets.pad + 6);

    let pos = offset + offsets.actions;
    message.body.actions.forEach((act) => {
      var pack = action.pack(act, buffer, pos);
      pos = pack.offset;
    });

    const actionsLen = pos - (offset + offsets.actions);
    buffer.writeUInt16BE(actionsLen, offset + offsets.actions_len, true);

    if ('data' in message.body) {
      message.body.data.copy(buffer, pos);
      pos += message.body.data.length;
    }

    buffer.writeUInt16BE(pos, offset + offsetsHeader.length, true);

    return {
      offset: pos,
    };
  },
};
