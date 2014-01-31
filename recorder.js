var Through = require('through')

module.exports = function(opt){

  var exclude = opt && opt.exclude || {}


  var midiLoop = Through()
  var events = []

  var pendingNotes = {}

  midiLoop.on('data', function(note){
    var key = note[0] + '/' + note[1]
    if (!exclude[key]){
      events.push(note)
    }
  })

  midiLoop.getActiveNotes = function(position, length, preroll){
    var result = {}
    preroll = preroll || 0
    for (var i=0, ii=events.length; i<ii; i++){
      var note = events[i]
      if (note[3] >= position-preroll && note[3] < position+length){
        result[note[0] + '/' + note[1]] = true
      }
    }
    return Object.keys(result)
  }

  midiLoop.getRange = function(position, length, preroll){
    preroll = preroll || 0
    var sortedEvents = events.filter(function(note){
      return note[3] >= position-preroll && note[3] < position+length
    }).sort(function(a,b){
      return a[3]-b[3] || a[2]-b[2]
    })

    var duplicateCheck = {}

    var noteLookup = {}
    var notes = []

    sortedEvents.forEach(function(note){

      var key = note[0] + '/' + note[1]
      var dupKey = key + '/' + note[2] + '/' + note[3]

      if (!duplicateCheck[dupKey]){
        duplicateCheck[dupKey] = note

        var existingNote = noteLookup[key]
        if (existingNote){ // terminate existing note
          noteLookup[key] = null
          existingNote[4] = note[3] - existingNote[3]
        }

        if (note[2]){ // note on
          var newNote = noteWithPosition(note, note[3])
          notes.push(newNote)
          noteLookup[key] = newNote
        }
      }
    })

    // loop back over and fulfil remaining unterminated notes
    sortedEvents.forEach(function(note){
      var key = note[0] + '/' + note[1]
      var existingNote = noteLookup[key]
      if (existingNote){
        noteLookup[key] = null
        existingNote[4] = length + note[3] - existingNote[3]
      }
    })

    // apply absolute positions
    notes.forEach(function(note){
      var key = note[0] + '/' + note[1]

      // trim any remaining unterminated notes
      if (note[4] == null){
        note[4] = length
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