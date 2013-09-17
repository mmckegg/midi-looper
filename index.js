var Through = require('through')
var Recorder = require('./recorder')

module.exports = function(getPosition){

  var playback = {notes: [], length: 8}
  var output = playback

  var recorder = Recorder(getPosition)

  var transforms = []

  var undos = []
  var redos = []

  function setPlayback(newPlayback){
    emitActiveChanged(playback.notes, newPlayback.notes)
    playback = newPlayback
    refreshOutput()
  }


  var looper = Through(function(data){
    if (!Array.isArray(data)){
      data = data.data
    }
    this.queue(data)
  })

  looper.pipe(recorder)

  looper.transform = function(func, args){
    var args = Array.prototype.slice.call(arguments)
    transforms.push(args)
    refreshOutput()
    return function(refresh){ // release function
      var index = transforms.indexOf(args)
      if (~index){
        transforms.splice(index, 1)
        if (refresh !== false) refreshOutput()
      }
    }
  }

  looper.getPosition = getPosition

  looper.bounce = function(){
    undos.push(playback)
    setPlayback(output)
    transforms = []
  }

  looper.undo = function(){
    if (undos.length){
      redos.push(playback)
      setPlayback(undos.pop())
      refreshOutput()
    }
  }

  looper.redo = function(){
    if (redos.length){
      undos.push(playback)
      setPlayback(redos.pop())
      refreshOutput()
    }
  }

  looper.getInput = function(){
    return playback
  }

  looper.getOutput = function(){
    return output
  }

  looper.getNotes = function(selection){
    if (selection){
      return playback.notes.filter(function(note){
        return selection.some(function(f){
          var key = note[0] + '/' + note[1]
          return f == key
        })
      })
    } else {
      return playback.notes
    }
  }

  looper.store = function(length, preroll){
    undos.push(playback)
    length = length || playback.length
    setPlayback({
      notes: recorder.getNotes(getPosition()-length, length, preroll), 
      length: length
    })
    refreshOutput()
  }

  function emitActiveChanged(oldNotes, newNotes){
    var difference = getNoteDifference(oldNotes, newNotes)
    difference.added.forEach(function(note){
      looper.emit('noteState', note, 'active')
    })
    difference.removed.forEach(function(note){
      looper.emit('noteState', note, 'inactive')
    })
  }

  function refreshOutput(){
    output = transforms.reduce(function(current, transform){
      var func = transform[0]
      var args = transform.slice(1)

      if (typeof(func) == 'string'){
        func = transformFunctions[func]
      }

      if (func && func.apply){
        return func.apply(looper, [current].concat(args))
      } else {
        return current
      }
    }, playback)
    looper.emit('change', output)
  }

  return looper

}

function getNoteDifference(oldNotes, newNotes){
  var added = []
  var removed = []

  var handled = []
  oldNotes.forEach(function(note){
    var key = note[0] + '/' + note[1]
    if (~!handled.indexOf(key)){
      if (!newNotes.some(function(n){
        return n[0] == note[0] && n[1] == note[1]
      })){
        removed.push([note[0], note[1]])
      }
      handled.push(key)
    }
  })

  var handled = []
  newNotes.forEach(function(note){
    var key = note[0] + '/' + note[1]
    if (~!handled.indexOf(key)){
      if (!oldNotes.some(function(n){
        return n[0] == note[0] && n[1] == note[1]
      })){
        added.push([note[0], note[1]])
      }
      handled.push(key)
    }
  })

  return {
    added: added,
    removed: removed
  }
}

var transformFunctions = {

  suppress: function(input, keys){
    return {
      length: input.length,
      notes: input.notes.filter(function(note){
        return !~keys.indexOf(note[0] + '/' + note[1])
      })
    }
  },

  clear: function(input){
    return {
      length: input.length,
      notes: []
    }
  },

  notes: function(input, notes){
    return {
      length: input.length,
      notes: input.notes.concat(notes)
    }
  },

  repeat: function(input, notes, length){
    var newNotes = []
    var count = Math.floor(input.length / length)
    for (var i=0;i<count;i++){
      notes.forEach(function(note){
        newNotes.push(noteWithPosition(note, i*length, length/2))
      })
    }
    return {
      length: input.length,
      notes: input.notes.concat(newNotes)
    }
  },

  offset: function(input, offset){
    return {
      length: input.length,
      notes: input.notes.map(function(note){
        return noteWithPosition(note, note[3]+offset)
      })
    }
  },

  loop: function(input, start, length){
    var newNotes = []
    var count = Math.ceil(input.length / length)

    for (var i=0;i<count;i++){
      input.notes.forEach(function(note){
        var position = note[3] + (input.length*i)
        if (inRange(position, start, length, input.length)){
          newNotes.push(noteWithPosition(note, position % length, Math.min(length, note[4])))
        }
      })
    }

    return {
      length: length,
      notes: newNotes
    }
  }
}

function noteWithPosition(note, position, length){
  return [note[0], note[1], note[2], position, length || note[4]]
}

function inRange(position, start, length, totalLength){
  var end = (start + length) % totalLength
  if (end > start){
    return position >= start && position < end 
  } else {
    return position >= start || position < end 
  }
}

function mod(a,b){
  return ((a%b)+b)%b;
}