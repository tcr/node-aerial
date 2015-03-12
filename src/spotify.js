var sp = require('libspotify');
var fs = require('fs');
var spawn = require('child_process').spawn;
var async = require('async');
var streamify = require('streamify');
var through = require('through');
var ffmpeg   = require('fluent-ffmpeg');

var env = require('../env');

function getStream (id) {
  var stream = through();

  var session = new sp.Session({
    applicationKey: env.SPOTIFY_APPKEY,
  });
  session.login(env.SPOTIFY_USERNAME, env.SPOTIFY_PASSWORD);
  session.once('login', function (err) {
    if (err) return console.error('Error:', err);
    var player = session.getPlayer();

    var uri = 'spotify:' + id;
    var track = sp.Track.getFromUrl(uri);
    rip(session, player, track, uri, stream)
  });

  return stream;
}

function rip (session, player, track, uri, stream) {
  // if (fs.existsSync(outpath.replace('~', ''))) {
  //   console.log('--> Already downloaded.');
  //   next(null, {});
  //   return;
  // }
  //   console.log('--> NOT AVAILABLE.');
  //   next(null, {});
  //   return;
  // }

  // var track = sp.Track.getFromUrl(uri);
  track.on('error', function (err) {
  	console.log('why', err)
  })
  track.on('ready', function() {
	  if (track.availability != 'AVAILABLE') {
	  	return stream.emit('error', new Error('Track not available.'));
	  }

    player.load(track);

    setImmediate(function () {
      stream.emit('uri', uri);
    })

    var play = spawn('sox', ['-r', 44100, '-b', 16, '-L', '-c', 2, '-e', 'signed-integer', '-t', 'raw', '-', '-t', 'mp3', '-']);
    // player.pipe(play.stdin);
    play.stderr.pipe(process.stderr);
    play.on('exit', function (code) {
    	// console.log('exit');
    	session.close();
      play.stdin.end();
      stream.end()
      stream.emit('session-end');
    });
    play.on('error', function (err) {
      stream.emit('error', err);
    })
    play.stdin.on('error', function (err) {
    	stream.emit('error', err);
    })
    play.stdout.pipe(stream);

    // Emit data duration.
    play.stdout.once('data', function () {
      stream.emit('duration', track.duration);
    })

    // var out = fs.createWriteStream(outpath.replace('.mp3', '.raw'));
    /*
	  var outstream = through();

	  var registry = require('fluent-ffmpeg/lib/registry.js');

	  fluent = new ffmpeg({
	    source: outstream
	  })
	  .on('error', function(err) {
      // The 'error' event is emitted when an error occurs,
      // either when preparing the FFmpeg process or while
      // it is running
      stream.emit('error', err);
    })
    .fromFormat('raw')
    .addOptions(['-f u16le -ar 44100 -ac 2'])
    .toFormat('mp3');
    fluent.writeToStream(stream);
    */

    player.pipe(play.stdin);
    player.play();

    player.once('track-end', function() {
      // console.error('Track streamming ended.');
    	play.stdin.end();
      // setTimeout(function () {
      //   // stream.end();
      // }, 1000);
      // play.stdin.end();
      //session.close();
    });
  });
}

module.exports = getStream;

if (require.main === module) {
  getStream(process.argv[2]).pipe(process.stdout);
}
