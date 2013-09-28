var Through = require('through')

module.exports = function(){

  var midiLoop = Through()
  var events = []

  var pendingNotes = {}

  midiLoop.on('data', function(note){
    events.push(note)

    var key = note[0] + '/' + note[1]

    // set end data after notes have been grabbed
    //if (!note[2] && pendingNotes[key]){
    //  var event = pendingNotes[key]
    //  event.data[4] = note[3] - event.position
    //  pendingNotes[key] = null
    //}
  })

  midiLoop.getNotes = function(position, length, preroll){
    preroll = preroll || 0
    var sortedEvents = events.filter(function(note){
      return note[3] >= position-preroll && note[3] < position+length
    }).sort(function(a,b){
      return a[3]-b[3] || a[2]-b[2]
    })

    var noteLookup = {}
    var notes = []

    sortedEvents.forEach(function(note){

      var key = note[0] + '/' + note[1]

      if (note[2]){
        var newNote = noteWithPosition(note, note[3])
        notes.push(newNote)
        noteLookup[key] = newNote
      } else {
        var existingNote = noteLookup[key]
        if (existingNote){
          noteLookup[key] = null
          existingNote[4] = note[3] - existingNote[3]
        }
      }
    })

    notes.forEach(function(note){

      // cut off any unterminated notes
      if (note[4] == null){
        note[4] = (position + length) - note[3]
      }

      // assign relative position
      note[3] = note[3] % length

    })

    return notes
  }

  return midiLoop
}

function noteWithPosition(note, position){
  return [note[0], note[1], note[2], position, note[4]]
}