var Duplex = require('duplex')
var BufferLoop = require('./buffer_loop')
var Player = require('./player')

module.exports = function(clock, options){

  var options = options || {}
  var bufferLoop = BufferLoop(options.bufferLength)
  var player = Player(clock)


  player.on('beat', function(beat){
    //console.log('beat', beat)
  })

  var looper = Duplex().on('_data', function (data) {
    bufferLoop.write(data)
  }).on('_end', function () {
    d._end()
  })

  looper.player = player

  looper.store = function(length, offset){
    var notes = bufferLoop.getNotes(length, offset)
    player.setNotes(notes, length)
  }

  player.on('data', function(data){
    looper._data(data)
  })

  clock.on('position', function(position){
    bufferLoop.setPosition(position)
  })

  return looper

}


function getAbsoluteLength(startPosition, endPosition, max){
  if (startPosition >= endPosition){
    return endPosition - startPosition
  } else {
    return max - startPosition + endPosition
  }
}