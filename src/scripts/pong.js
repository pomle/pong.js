function Vec2(x, y) {
  this.x = x;
  this.y = y;
}

Vec2.prototype.length = function(l) {
  var cl = Math.sqrt(this.x * this.x + this.y * this.y);
  if (l) {
    var s = l / cl;
    this.x *= s;
    this.y *= s;
    return;
  }
  return cl;
}

function Player() {
  this.score = 0;
  this.pos = new Vec2(0, 0);
  this.size = new Vec2(20, 100);
}

function Ball() {
  this.speed = .5;
  this.pos = new Vec2(0, 0);
  this.size = new Vec2(10, 10);
  this.vel = new Vec2(0, 0);
}

function can2vec(vec2) {
    return new Vec2(vec2.x * scale.x,
                    vec2.y * scale.y);
}

function vec2can(vec2) {
    return new Vec2(vec2.x * scale.x,
                    vec2.y * scale.y);
}

function draw() {
  updateScale();
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  players.forEach(drawSquare);
  drawSquare(ball);
}

function drawSquare(ent) {
  context.fillStyle = '#fff';
  var p = vec2can(ent.pos);
  var s = vec2can(ent.size);
  context.fillRect(p.x, p.y, s.x, s.y);
}

function loop(t) {
  accumulator += t - time;
  while (accumulator >= step) {
    update(step);
    accumulator -= step;
  }
  sendNet();
  draw();
  time = t;
  requestAnimationFrame(loop);
}

function resetBall() {
  ball.pos.x = court.x / 2 - ball.size.x / 2;
  ball.pos.y = court.y / 2 - ball.size.y / 2;
  ball.vel.x = 0;
  ball.vel.y = 0;
  ball.speed = .5;
  sendMessage('ball', ball.pos);
}

function returnBall() {
  ball.vel.x *= -1;
  ball.vel.y += -0.2 + Math.random() * 0.4;
  ball.speed *= 1.02;
  ball.vel.length(ball.speed);
}

function startBall() {
  if (ball.vel.x === 0 && ball.vel.y === 0) {
    ball.vel.x = -1 + Math.random() * 2;
    ball.vel.y = -0.1 + Math.random() * .2;
    ball.vel.length(ball.speed);
  }
}

function sendNet() {
  if (session && player === 0) {
    if (ball.vel.x !== 0 && ball.vel.y !== 0) {
      sendMessage('ball', ball.pos);
    }
  }
}

function update(dt) {
  if (!session) {
    var p = players[1];
    p.pos.y = ball.pos.y - p.size.y / 2;
  }
  updateBall(dt);
}

function updateBall(dt) {
  if (session && player === 1) {
    return;
  }

  if (ball.pos.x + ball.size.x < 0) {
    ++players[1].score;
    resetBall();
    return;
  } else if (ball.pos.x > court.x) {
    ++players[0].score;
    resetBall();
    return;
  }

  if (ball.pos.y < 0 || ball.pos.y + ball.size.y > court.y) {
    ball.vel.y *= -1;
  }

  if (ball.vel.x > 0) {
    var p = players[1];
    if (isBallCaughtY(p, ball) &&
        ball.pos.x + ball.size.x > p.pos.x && ball.pos.x < p.pos.x) {
      returnBall();
    }
  } else if (ball.vel.x < 0) {
    var p = players[0];
    if (isBallCaughtY(p, ball) &&
        ball.pos.x < p.pos.x + p.size.x && ball.pos.x > p.pos.x) {
      returnBall();
    }
  }

  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;
}

function isBallCaughtY(p, b) {
  return b.pos.y + b.size.x > p.pos.y && b.pos.y < p.pos.y + p.size.y;
}

function updateScale() {
  scale.x = canvas.width / court.x;
  scale.y = canvas.height / court.y;
}

function updateCanvas() {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
}

function sendMessage(name, data) {
  if (connection && connection.OPEN) {
    connection.send(JSON.stringify({
      session: session,
      type: name,
      data: data,
    }))
  }
}

var canvas = document.getElementsByTagName('canvas')[0];
var context = canvas.getContext('2d');
var accumulator = 0;
var time = 0;
var step = 4;
var court = new Vec2(600, 340);
var scale = new Vec2(1, 1);
var margin = new Vec2(20, 0);
var players = [
  new Player(),
  new Player(),
];
var ball = new Ball();
var session;
var player = 0;

players[0].pos.x = margin.x;
players[1].pos.x = court.x - (players[1].size.x + margin.x);

resetBall();

var connection = new WebSocket('ws://192.168.1.10:8001');
connection.addEventListener('error', function(e) {
  console.error(e);
});
connection.addEventListener('open', function(e) {
  var s = parseInt(window.location.hash[1], 10);
  if (s) {
    session = s;
    sendMessage('join');
    player = 1;
  } else {
    sendMessage('register');
  }
});
connection.addEventListener('message', function(e) {
  var msg = JSON.parse(e.data);
  console.log('Received message', msg);
  if (msg.type === 'session') {
    session = msg.data;
    history.replaceState(msg, 'Session', '#' + session);
  }
  else if (msg.type === 'pos') {
    players[1-player].pos.y = msg.data;
  }
  else if (msg.type === 'ball') {
    ball.pos = msg.data;
  }
});

document.addEventListener('mousemove', function(e) {
  p = players[player];
  p.pos.y = (e.clientY / scale.y) - p.size.y / 2;
  if (session) {
    sendMessage('pos', p.pos.y);
  }
});

window.addEventListener('resize', updateCanvas);
window.addEventListener('click', startBall);

updateCanvas();
loop(0);
