module.exports = function(buffer, start, length, preroll){

  var end = start + length

  var noteLookup = {}
  var firstNoteLookup = {}
  var result = []

  // loop over all notes in range then continue once to find end notes
  for (var i=(start-preroll);i<end+length;i++){
    var bufferPosition = mod(i, buffer.length)
    var events = buffer[bufferPosition]
    events && events.forEach(function(data){
      if (isNote(data)){
        noteOff(data, mod(i, length))
        if (i < end && data[2]){
          noteOn(data, mod(i, length))
        }
      }
    })
  }

  // set note ups on notes without end
  result.filter(function(note){return !note.length}).forEach(function(note){
    var firstNote = firstNoteLookup[note.key]
    if (firstNote){
      note.length = getAbsoluteLength(note.position, firstNote.position-1, length)
    }
  })


  function noteOff(data, position){
    var key = data[0] + '/' + data[1]
    if (noteLookup[key]){
      var note = noteLookup[key]
      noteLookup[key].length = getAbsoluteLength(note.position, position, length)
      noteLookup[key] = null
      return note
    }
  }

  function noteOn(data, position){
    var key = data[0] + '/' + data[1]
    var note = {
      key: key,
      data: data,
      position: position,
      length: 0
    }
    noteLookup[key] = note
    result.push(note)

    // for matching unended notes
    if (!firstNoteLookup[key]){
      firstNoteLookup[key] = note
    }

    return note
  }

  return result
}

function isNote(data){
  return (data[0] && data[0] >= 128 && data[0] <= 159)
}

function getAbsoluteLength(startPosition, endPosition, max){
  if (startPosition <= endPosition){
    return endPosition - startPosition
  } else {
    return max - startPosition + endPosition
  }
}

function mod(a,b){
  return ((a%b)+b)%b;
}