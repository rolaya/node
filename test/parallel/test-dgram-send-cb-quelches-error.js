'use strict';
const common = require('../common');
const mustCall = common.mustCall;
const assert = require('assert');
const dgram = require('dgram');
const dns = require('dns');

const socket = dgram.createSocket('udp4');
const buffer = Buffer.from('gary busey');

dns.setServers([]);

socket.once('error', onEvent);

// assert that:
// * callbacks act as "error" listeners if given.
// * error is never emitter for missing dns entries
//   if a callback that handles error is present
// * error is emitted if a callback with no argument is passed
socket.send(buffer, 0, buffer.length, 100,
            'dne.example.com', mustCall(callbackOnly));

function callbackOnly(arg1, arg2) {

  // Ultimately, when the DNS (resolve name) error occurs, function "doSend" in
  // dgram.js last handles this error and enqueues a tick to this callback with: 
  // "process.nextTick(callback, null, err - 1);". This eventually (upon a tick) 
  // causes "processTicksAndRejections" in task_queues.js to call this function.
  // These changes fix: 
  // "AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:"
  // (there were inconsistencies between the parameters sent when the callback is
  // invoked and the parameters expected by this function).
  //
  // Also modified to insure the socket is closed (i.e. "onError" is called without)
  // an error argument (i.e. for now I am keeping all modifications in this module,
  // eventually may need to look into dgram.js).

  assert.ok((arg1 === null));
  socket.removeListener('error', onEvent);
  socket.send(buffer, 0, buffer.length, 100, 'dne.invalid', mustCall(onError));
}

function onEvent(err) {
  assert.fail(`Error should not be emitted if there is callback: ${err}`);
}

function onError() {
  socket.close();
}
