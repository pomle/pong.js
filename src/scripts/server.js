'use strict';

const ws = require("nodejs-websocket")

const server = ws.createServer(function (conn) {
  console.log("New connection");
  conn.on("text", function(str) {
    console.log('Received message', str);
    messageHandler(conn, JSON.parse(str));
  });
  conn.on('error', function(err) {
    console.log('conmection error', err);
  });
  conn.on("close", function (code, reason) {
    console.log("Connection closed")
  });
}).listen(8001);

const sessions = {};
let count = 0;

function Session() {
  this.active = undefined;
  this.players = [
    new Player(),
    new Player(),
  ];
  this.ball = new Ball();
}

Session.prototype.touch = function() {
  this.active = Date.now();
}

function Ball() {
  this.pos = {
    x: 0,
    y: 0,
  };
}

function Player() {
  this.pos = {
    x: 0,
    y: 0,
  };
  this.conn = undefined;
}

function messageHandler(conn, msg) {
  if (msg.type === 'register') {
    count++;
    let session = new Session();
    session.touch();
    session.players[0].conn = conn;
    sessions[count] = session;
    console.log('Player %s hosting session %s', 1, count);
    sendMessage(conn, 'session', count);
  }
  else {
    let session = sessions[msg.session];
    if (!session) {
      return;
    }
    session.touch();
    if (session === undefined) {
      console.info('Unknown session %d', msg.session);
      return;
    }
    if (msg.type === 'join') {
      session.players[1].conn = conn;
      console.log('Player %s joined session %s', 2, msg.session);
    }
    else if (msg.type === 'pos') {
      let p;
      session.players.forEach(function(player, i) {
        if (player.conn === conn) {
          player.pos.y = msg.data;
          p = i;
        }
      });
      if (p !== undefined) {
        sendMessage(session.players[1-p].conn, 'pos', msg.data);
      }
    }
    else if (msg.type === 'ball') {
      if (session.players[0].conn === conn) {
        session.ball.pos = msg.data;
        sendMessage(session.players[1].conn, 'ball', msg.data);
      }
    }
  }
}

function sendMessage(conn, type, data) {
  if (!conn) {
    console.info('Ignoring sendMessage to undefined conn');
    return;
  }
  if (conn.readyState !== conn.OPEN) {
    console.info('Ignoring non-open connection');
    return;
  }
  var msg = JSON.stringify({
    type: type,
    data: data,
  });
  console.log('Sending message', msg);
  conn.sendText(msg);
}
