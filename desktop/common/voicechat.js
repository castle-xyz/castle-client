import * as Actions from '~/common/actions';
import * as mediasoup from 'mediasoup-client';
import * as uuid from 'uuid/v4';
import io from 'socket.io-client';

const USE_LOCAL_SERVER = false;

const $ = document.querySelector.bind(document);

let host;
let myPeerId;
let device;
let joined;
let localCam;
let sendTransport;
let camAudioProducer;
let currentActiveSpeaker = {};
let lastPollSyncData = {};
let recvTransport;
let socket;

let consumers = [];

function getMicPausedState() {
  return false;
}

export const startVoiceChatAsync = async (roomId) => {
  myPeerId = `${uuid()}`;

  if (USE_LOCAL_SERVER) {
    host = 'http://localhost:3011';
  } else {
    let mediaService = await Actions.getMediaServiceAsync({
      roomId,
    });
    if (!mediaService) {
      console.error('no media service');
      return;
    }

    host = mediaService.address;
  }

  socket = io(host, {
    query: {
      peerId: myPeerId,
      roomId,
    },
  });

  let bodyTag = document.getElementsByTagName('body')[0];
  let remoteAudioTag = document.createElement('div');
  remoteAudioTag.setAttribute('id', 'remote-audio');
  bodyTag.appendChild(remoteAudioTag);

  try {
    device = new mediasoup.Device();
  } catch (e) {
    if (e.name === 'UnsupportedError') {
      console.error('browser not supported for voice calls');
      return;
    } else {
      console.error(e);
    }
  }

  await joinRoomAsync();
  await startMic();
  await sendMicStream();
};

export const stopVoiceChatAsync = async () => {
  leaveRoom();
};

async function joinRoomAsync() {
  if (joined) {
    return;
  }

  try {
    // signal that we're a new peer and initialize our
    // mediasoup-client device, if this is our first time connecting
    let { routerRtpCapabilities } = await sigSocket('join-as-new-peer');
    if (!device.loaded) {
      await device.load({ routerRtpCapabilities });
    }
    joined = true;
  } catch (e) {
    console.error(e);
    return;
  }

  socket.on('sync', (data) => {
    if (joined) {
      pollAndUpdate(data);
    }
  });
}

async function startMic() {
  if (localCam) {
    return;
  }
  try {
    localCam = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
  } catch (e) {
    console.error('start mic error', e);
  }
}

async function sendMicStream() {
  // create a transport for outgoing media, if we don't already have one
  if (!sendTransport) {
    sendTransport = await createTransport('send');
  }

  // start sending audio. the transport logic will initiate a
  // signaling conversation with the server to set up an outbound rtp
  // stream for the audio track. our createTransport() function
  // includes logic to tell the server to start the stream in a paused
  // state, if the checkbox in our UI is unchecked. so as soon as we
  // have a client-side camAudioProducer object, we need to set it to
  // paused as appropriate, too.

  // same thing for audio, but we can use our already-created
  camAudioProducer = await sendTransport.produce({
    track: localCam.getAudioTracks()[0],
    appData: { mediaTag: 'cam-audio' },
  });
  if (getMicPausedState()) {
    try {
      camAudioProducer.pause();
    } catch (e) {
      console.error(e);
    }
  }
}

async function createTransport(direction) {
  // ask the server to create a server-side transport object and send
  // us back the info we need to create a client-side transport
  let transport,
    { transportOptions } = await sigSocket('create-transport', { direction });

  if (direction === 'recv') {
    transport = await device.createRecvTransport(transportOptions);
  } else if (direction === 'send') {
    transport = await device.createSendTransport(transportOptions);
  } else {
    throw new Error(`bad transport 'direction': ${direction}`);
  }

  // mediasoup-client will emit a connect event when media needs to
  // start flowing for the first time. send dtlsParameters to the
  // server, then call callback() on success or errback() on failure.
  transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    let { error } = await sigSocket('connect-transport', {
      transportId: transportOptions.id,
      dtlsParameters,
    });
    if (error) {
      console.error('error connecting transport', direction, error);
      errback();
      return;
    }
    callback();
  });

  if (direction === 'send') {
    // sending transports will emit a produce event when a new track
    // needs to be set up to start sending. the producer's appData is
    // passed as a parameter
    transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      // we may want to start out paused (if the checkboxes in the ui
      // aren't checked, for each media type. not very clean code, here
      // but, you know, this isn't a real application.)
      let paused = false;
      if (appData.mediaTag === 'cam-audio') {
        paused = getMicPausedState();
      }
      // tell the server what it needs to know from us in order to set
      // up a server-side producer object, and get back a
      // producer.id. call callback() on success or errback() on
      // failure.
      let { error, id } = await sigSocket('send-track', {
        transportId: transportOptions.id,
        kind,
        rtpParameters,
        paused,
        appData,
      });
      if (error) {
        console.error('error setting up server-side producer', error);
        errback();
        return;
      }
      callback({ id });
    });
  }

  // for this simple demo, any time a transport transitions to closed,
  // failed, or disconnected, leave the room and reset
  //
  transport.on('connectionstatechange', async (state) => {
    console.log(`transport ${transport.id} connectionstatechange ${state}`);
    // for this simple sample code, assume that transports being
    // closed is an error (we never close these transports except when
    // we leave the room)
    if (state === 'closed' || state === 'failed' || state === 'disconnected') {
      console.log('transport closed ... leaving the room and resetting');
      leaveRoom();
    }
  });

  return transport;
}

async function leaveRoom() {
  if (!joined) {
    return;
  }

  // close everything on the server-side (transports, producers, consumers)
  let { error } = await sigSocket('leave');
  if (error) {
    console.error(error);
  }

  // closing the transports closes all producers and consumers. we
  // don't need to do anything beyond closing the transports, except
  // to set all our local variables to their initial states
  try {
    recvTransport && (await recvTransport.close());
    sendTransport && (await sendTransport.close());
  } catch (e) {
    console.error(e);
  }
  recvTransport = null;
  sendTransport = null;
  camAudioProducer = null;
  localCam = null;
  lastPollSyncData = {};
  consumers = [];
  joined = false;

  $('#remote-audio').innerHTML = '';
}

async function subscribeToTrack(peerId, mediaTag) {
  console.log('subscribe to track', peerId, mediaTag);

  // create a receive transport if we don't already have one
  if (!recvTransport) {
    recvTransport = await createTransport('recv');
  }

  // if we do already have a consumer, we shouldn't have called this
  // method
  let consumer = findConsumerForTrack(peerId, mediaTag);
  if (consumer) {
    console.error('already have consumer for track', peerId, mediaTag);
    return;
  }

  // ask the server to create a server-side consumer object and send
  // us back the info we need to create a client-side consumer
  let consumerParameters = await sigSocket('recv-track', {
    mediaTag,
    mediaPeerId: peerId,
    rtpCapabilities: device.rtpCapabilities,
  });
  console.log('consumer parameters', consumerParameters);
  consumer = await recvTransport.consume({
    ...consumerParameters,
    appData: { peerId, mediaTag },
  });
  console.log('created new consumer', consumer.id);

  // the server-side consumer will be started in paused state. wait
  // until we're connected, then send a resume request to the server
  // to get our first keyframe and start playing audio
  while (recvTransport.connectionState !== 'connected') {
    console.log('  transport connstate', recvTransport.connectionState);
    await sleep(100);
  }
  // okay, we're ready. let's ask the peer to send us media
  await resumeConsumer(consumer);

  // keep track of all our consumers
  consumers.push(consumer);

  // ui
  await addAudioElement(consumer);
}

function addAudioElement(consumer) {
  if (!(consumer && consumer.track)) {
    return;
  }
  let el = document.createElement(consumer.kind);
  // set some attributes to make mobile Safari happy. note
  // that for audio to play you need to be capturing from the
  // mic/camera
  el.setAttribute('playsinline', true);
  el.setAttribute('autoplay', true);

  $(`#remote-audio`).appendChild(el);
  el.srcObject = new MediaStream([consumer.track.clone()]);
  el.consumer = consumer;
  // let's "yield" and return before playing, rather than awaiting on
  // play() succeeding. play() will not succeed on a producer-paused
  // track until the producer unpauses.
  el.play()
    .then(() => {})
    .catch((e) => {
      err(e);
    });
}

function removeAudioElement(consumer) {
  document.querySelectorAll(consumer.kind).forEach((v) => {
    if (v.consumer === consumer) {
      v.parentNode.removeChild(v);
    }
  });
}

function findConsumerForTrack(peerId, mediaTag) {
  return consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

async function resumeConsumer(consumer) {
  if (consumer) {
    console.log('resume consumer', consumer.appData.peerId, consumer.appData.mediaTag);
    try {
      await sigSocket('resume-consumer', { consumerId: consumer.id });
      await consumer.resume();
    } catch (e) {
      console.error(e);
    }
  }
}

//
// polling/update logic
//

function pollAndUpdate(data) {
  let { peers, activeSpeaker, error } = data;
  if (error) {
    return { error };
  }

  // always update bandwidth stats and active speaker display
  currentActiveSpeaker = activeSpeaker;

  // if a peer has gone away, we need to close all consumers we have
  // for that peer and remove audio elements
  for (let id in lastPollSyncData) {
    if (!peers[id]) {
      console.log(`peer ${id} has exited`);
      consumers.forEach((consumer) => {
        if (consumer.appData.peerId === id) {
          closeConsumer(consumer);
        }
      });
    }
  }

  // if a peer has stopped sending media that we are consuming, we
  // need to close the consumer and remove audio elements
  consumers.forEach((consumer) => {
    let { peerId, mediaTag } = consumer.appData;
    if (!peers[peerId] || !peers[peerId].media || !peers[peerId].media[mediaTag]) {
      console.log(`peer ${peerId} has stopped transmitting ${mediaTag}`);
      closeConsumer(consumer);
    }
  });

  // subscribe to new peers
  for (let id in peers) {
    if (id === myPeerId) {
      continue;
    }

    let existingConsumer = consumers.find((c) => c.appData.peerId === id);
    if (existingConsumer) {
      continue;
    }

    for (let [mediaTag, info] of Object.entries(peers[id].media)) {
      console.log('subscribing to ' + id + ' ' + mediaTag);
      subscribeToTrack(id, mediaTag);
    }
  }

  lastPollSyncData = peers;
  return {}; // return an empty object if there isn't an error
}

async function closeConsumer(consumer) {
  if (!consumer) {
    return;
  }
  console.log('closing consumer', consumer.appData.peerId, consumer.appData.mediaTag);
  try {
    // tell the server we're closing this consumer. (the server-side
    // consumer may have been closed already, but that's okay.)
    await sigSocket('close-consumer', { consumerId: consumer.id });
    await consumer.close();

    consumers = consumers.filter((c) => c !== consumer);
    removeAudioElement(consumer);
  } catch (e) {
    console.error(e);
  }
}

//
// our "signaling" function -- just an http fetch
//

function sigSocket(endpoint, data) {
  return new Promise((resolve) => {
    try {
      socket.emit(endpoint, { ...data, peerId: myPeerId }, (response) => {
        resolve(response);
      });
    } catch (e) {
      console.error(e);
      resolve({ error: e });
    }
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(() => r(), ms));
}
