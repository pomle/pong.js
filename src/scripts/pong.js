'use strict';

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

const text = {
  size: 15,
  chars: {
    '0': '111101101101111',
    '1': '010010010010010',
    '2': '111001111100111',
    '3': '111001111001111',
    '4': '101101111001001',
    '5': '111100111001111',
    '6': '111100111101111',
    '7': '111001001001001',
    '8': '111101111101111',
    '9': '111101111001111',
  },
};

function drawChar(m, p) {
  let s = 8;
  context.fillStyle = '#fff';
  let c = {
    pos: new Vec2(0, 0),
    size: new Vec2(s, s),
  };
  for (let i = 0, l = m.length; i !== l; ++i) {
    if (m[i] === '1') {
      c.pos.x = p.x + (i % 3) * s;
      c.pos.y = p.y + Math.floor(i / 3) * s;
      drawSquare(c);
    }
  }
}

function draw() {
  updateScale();
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawScore();
  players.forEach(drawSquare);
  drawSquare(ball);
}

function drawScore() {
  let x = court.x / 3 - text.size / 2;
  let d = text.size * 4;
  players.forEach((p, i) => {
    p.score.toString().split('').forEach((c, j) => {
      drawChar(text.chars[c], {x: d * j + x + x * i, y: 10});
    });
  });
}

function drawSquare(ent) {
  context.fillStyle = '#fff';
  var p = vec2can(ent.pos);
  var s = vec2can(ent.size);
  context.fillRect(Math.floor(p.x),
                   Math.floor(p.y),
                   Math.ceil(s.x),
                   Math.ceil(s.y));
}

function loop(t) {
  accumulator += t - time;
  while (accumulator >= step) {
    update(step);
    accumulator -= step;
  }
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

function update(dt) {
  var p = players[1];
  p.pos.y = ball.pos.y - p.size.y / 2;
  updateBall(dt);
}

function updateBall(dt) {
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
  canvas.height = canvas.width * (court.y / court.x);
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

players[0].pos.x = margin.x;
players[1].pos.x = court.x - (players[1].size.x + margin.x);

resetBall();

document.addEventListener('mousemove', function(e) {
  players[0].pos.y = (e.clientY / scale.y) - players[0].size.y / 2;
});

window.addEventListener('resize', updateCanvas);
window.addEventListener('click', startBall);

updateCanvas();
loop(0);
