var Stream = require('stream')

module.exports = function(clock){

  var onNotes = []

  var playback = {notes: [], length: 192}
  var currentLoop = null

  var player = new Stream()
  player.readable = true

  player.setNotes = function(notes, length){
    playback = {
      notes: notes,
      length: length
    }
    player.emit('change')
  }

  player.turnOffAllNotes = function(){
    onNotes.forEach(function(note){
      player.emit('data', offNoteFor(note.data))
    })
    onNotes = []
  }

  player.setLoop = function(position, length){
    player.turnOffAllNotes()
    currentLoop = [position % playback.length, length]
  }

  player.getLength = function(){
    return playback.length
  }

  player.getNotes = function(){
    return playback.notes
  }

  player.clearLoop = function(){
    player.turnOffAllNotes()
    currentLoop = null
  }

  clock.on('position', function(position){
    var constrainedPosition = position % playback.length

    if (currentLoop){
      // looped playback
      var microPosition = position % currentLoop[1]
      if (microPosition === 0){
        player.turnOffAllNotes()
        player.emit('beat', (currentLoop[0] % playback.length) / 24)
      }
      triggerMoment(currentLoop[0] + microPosition)
    } else {
      // normal playback
      var microPosition = constrainedPosition % 24
      if (microPosition === 0){
        player.emit('beat', constrainedPosition / 24)
      }
      triggerMoment(constrainedPosition)
    }

    player.emit('position', constrainedPosition)
  })

  function triggerMoment(position){
    var toTurnOff = []

    // send off data
    onNotes.forEach(function(note){
      if (((note.position + note.length) % playback.length) == position){
        player.emit('data', offNoteFor(note.data))
        toTurnOff.push(note)
      }
    })

    // remove from onNotes
    toTurnOff.forEach(function(note){
      var index = onNotes.indexOf(note)
      if (~index){
        onNotes.splice(index, 1)
      }
    })

    // send on data
    playback.notes.forEach(function(note){
      if (note.position == position){
        player.emit('data', note.data)
        onNotes.push(note)
      }
    })

  }

  return player
}

function offNoteFor(data){
  return [data[0], data[1], 0]
}