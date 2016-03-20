'use strict';

function mkdir(path) {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (e) {
    fs.mkdirSync(path);
  }
}

let fs = require('fs');
let htmlMinify = require('html-minifier').minify;

const BUILD_DIR = __dirname + '/build';
const SRC_DIR = __dirname + '/src';

let html = fs.readFileSync(SRC_DIR + '/prod.html', 'utf8');
let css = fs.readFileSync(SRC_DIR + '/css/pong.css', 'utf8');
let js = fs.readFileSync(SRC_DIR + '/scripts/pong.js');

let server = fs.readFileSync(SRC_DIR + '/scripts/server.js');

html = html.replace('{{CSS}}', css);
html = html.replace('{{JS}}', js);

mkdir(BUILD_DIR);
mkdir(BUILD_DIR + '/public');

html = htmlMinify(html, {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
});

fs.writeFileSync(BUILD_DIR + '/server.js', server);
fs.writeFileSync(BUILD_DIR + '/public/index.html', html);
