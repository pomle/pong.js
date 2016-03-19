'use strict';

let fs = require('fs');
let htmlMinify = require('html-minifier').minify;

const BUILD_DIR = __dirname + '/build';
const SRC_DIR = __dirname + '/src';

let html = fs.readFileSync(SRC_DIR + '/prod.html', 'utf8');
let css = fs.readFileSync(SRC_DIR + '/css/pong.css', 'utf8');
let js = fs.readFileSync(SRC_DIR + '/scripts/pong.js');

html = html.replace('{{CSS}}', css);
html = html.replace('{{JS}}', js);

html = htmlMinify(html, {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
});

try {
  fs.accessSync(BUILD_DIR, fs.F_OK);
} catch (e) {
  fs.mkdirSync(BUILD_DIR);
}

fs.writeFileSync(BUILD_DIR + '/index.html', html);
