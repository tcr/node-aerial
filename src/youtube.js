var ytdl     = require('ytdl-core');
var ffmpeg   = require('fluent-ffmpeg');
var through  = require('through');
var fs       = require('fs');

var env = require('../env');

// c'mon ytdl
console.warn = function () { /*noop*/ }

function getStream (uri, opt) {
  if (!uri.match(/^https?\:/)) {
    uri = 'https://www.youtube.com/watch?v=' + uri;
  }

  // defaults.set(opt = opt || {}); 
  opt = opt || {};
  opt.videoFormat = opt.videoFormat || 'mp4';
  opt.quality = opt.quality || 'lowest';
  opt.audioFormat = opt.audioFormat || 'mp3';

  var video = ytdl(uri, {filter: filterVideo, quality: opt.quality});

  function filterVideo(format) {
    return format.container === (opt.videoFormat);
  }

  var bufferstream = through();
  video.pipe(bufferstream);
    

  video.on('error', function (err) {
    // console.error('Youtube error:', err);
    bufferstream.end();
  })

  var stream = opt.file ?
    fs.createWriteStream(opt.file)
    :
    through();

  fluent = new ffmpeg({
    source: bufferstream
  })
  .on('error', function(err) {
        // The 'error' event is emitted when an error occurs,
        // either when preparing the FFmpeg process or while
        // it is running
        stream.emit('error', err);
    })
    .toFormat(opt.audioFormat);

    fluent.writeToStream(stream);

  video.once('info', function (info) {
    var duration = (info.length_seconds + 1) * 1000;
    var timerid = setTimeout(function () {
      stream.emit('realtime-end', null);
    }, duration);
    timerid.unref();
    stream.on('error', function (err) {
      stream.emit('realtime-end', err);
      clearTimeout(timerid);
    })
  })

  setImmediate(function () {
    stream.emit('uri', uri);
  })

  return stream;
}

module.exports = getStream;

if (require.main === module) {
  getStream(process.argv[2]).pipe(process.stdout);
}
