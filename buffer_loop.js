var notesFromBuffer = require('./notes_from_buffer')

module.exports = function(length){

  var bufferPosition = 0
  var buffer = []
  buffer.length = length || (384 * 4)

  var bufferLoop = {}

  bufferLoop.write = function(data){
    buffer[bufferPosition] = buffer[bufferPosition] || []
    buffer[bufferPosition].push(data)
  }

  bufferLoop.getNotes = function(length, offset){
    var start = bufferPosition - length + (offset || 0)
    var preroll = 6

    return notesFromBuffer(buffer, start, length, preroll)
  }

  bufferLoop.setPosition = function(position){
    bufferPosition = position % buffer.length
    buffer[bufferPosition] = null
  }

  return bufferLoop

}
