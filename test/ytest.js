var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var mpg123 = require('./src/mpg123');
var songsources = require('./songsources');


function playMp3Stream (song, offset) {
	var s;
	mpg123.play(song, offset);
	song.on('end', function () {
		console.log('youtube ends')
	});
	song.on('error', function (err) {
		// skip
		console.log('song err', err)
	})
	return mpg123;
}



var player = null;

console.log('play');
player = playMp3Stream(songsources.youtube('VTy7LfyE334'), 0)

setTimeout(function () {
	console.log('stop');
	player.stop();
	var p2 = playMp3Stream(songsources.youtube('mS5rugyj5mI'), 0)
}, 10000)