module.exports = function (oldNotes, newNotes) {
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