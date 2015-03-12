#!/usr/bin/env node

var aerial = require('../');
var fs = require('fs');

if (process.argv.length < 4) {
	console.error('Usage: aerial youtube:id out.mp3');
	process.exit(1);
}

var source = process.argv[2].split(':')[0];
var name = process.argv[2].replace(/^.*?:/, '');
var out = process.argv[3];

if (out == '-') {
	out = process.stdout;
} else {
	out = fs.createWriteStream(out);
}

aerial.stream(source, name)
  .on('realtime-end', function () {
  	console.error('track ended.');
  })
  .on('uri', function (uri) {
  	console.error('streaming:', uri);
  })
  .on('error', function (err) {
    console.error(err.stack || err);
  })
  .pipe(out);
