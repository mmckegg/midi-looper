module.exports = {

  suppress: function(input, keys){
    return {
      length: input.length,
      notes: input.notes.filter(function(note){
        return keys && !~keys.indexOf(note[0] + '/' + note[1])
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
    var count = Math.ceil(length / input.length)

    for (var i=0;i<count;i++){
      input.notes.forEach(function(note){
        var position = note[3] + (input.length*i)
        if (inRange(position, start, length, input.length)){
          newNotes.push(noteWithPosition(note, position % length, Math.min(length/2, note[4])))
        }
      })
    }
    
    return {
      length: length,
      notes: newNotes
    }
  },

  quantize: function(input, grid, keys){
    var newNotes = input.notes.map(function(note){
      if (!keys || ~keys.indexOf(note[0] + '/' + note[1])){
        var quantizePosition = Math.round(note[3] / grid) * grid
        return noteWithPosition(note, quantizePosition)
      } else {
        return note
      }
    })

    return {
      length: input.length,
      notes: newNotes
    }
  }
}


function inRange(position, start, length, totalLength){
  var end = (start + length) % totalLength
  if (end > start){
    return position >= start && position < end 
  } else {
    return position >= start || position < end 
  }
}

function noteWithPosition(note, position, length){
  return [note[0], note[1], note[2], position, length || note[4]]
}


function mod(a,b){
  return ((a%b)+b)%b;
}