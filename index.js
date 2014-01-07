var Through = require('through')
var Recorder = require('./recorder')

var getNoteDifference = require('./get_note_difference')
var transformFunctions = require('./transforms')

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
    if (data[3] == null){
      data[3] = getPosition()
    }

    recorder.write(data)
  })

  looper.recorder = recorder

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

  looper.getLength = function(){
    return playback.length
  }

  looper.getTransformCount = function(){
    return transforms.length
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
      notes: recorder.getRange(getPosition()-length, length, preroll), 
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
    looper.queue(output)
  }

  return looper
}