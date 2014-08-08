midi-looper
===

Stream based midi loop maker. Buffers all input then creates loops on demand.

## Install

```bash
$ npm install midi-looper
```

## API

```js
var MidiLooper = require('midi-looper')
var looper = MidiLooper(clock.getPosition)
```

### MidiLooper(getPosition, opts)

Create a looper instance. You must pass in a function that when called returns the current playback position (in beats).

### looper.write(midiNote)

Stores a note in the buffer at the position returned by `getPosition()`.

### looper.pipe(destination) / looper.on('data')

Whenever the playback changes (due to a `transform()` or `store()`), emits the new output playback e.g. (`{length: 8, notes: [[144, 60, 127, 0, 0.5], [144, 60, 127, 1, 0.5]]}` - array of [channel, note, velocity, position % length, noteLength])

### looper.store(length, preroll)

Sets the current playback to loop the buffered notes from `getPosition() - length` to current time. Preroll will include the desired overlap.

### looper.transform(nameOrFunc, args)

Apply a transform functions to the playback. The combined transforms are returned by `getOutput()`. Returns a `release()` function that can be called to remove the transform.

### looper.getTransformCount()

Returns the total number of transforms currently applied to output.

### looper.bounce()

Bounce the final output with transforms applied back to the input and clear the active transforms.

### looper.undo() / looper.redo()

`setLength()`, `store()` and `bounce()` all generate undo history which can be navigated using the `undo()` and `redo()` functions.


### looper.getInput()

Returns the current playback loop without transforms applied.

### looper.getOutput()

Returns the current playback loop **with transforms** applied.

### looper.getLength()

Current input playback loop length.

### looper.setLength(length)

Set the loop length, repeating or truncating the playback as neccessary centred around `getPosition()`.

## Transforms

### looper.transform('suppress', noteKeysToSuppress)

Pass in an array of note keys (`"144/25"`) to suppress, or if `noteKeysToSuppress` is null, suppress all notes.

### looper.transform('notes', notesToAppend)

Add the specified notes in as an array ([channel, note, velocity, position, duration])

### looper.transform('repeat', midiNotesToRepeat, rate)

Specify the midi notes ([chan, note, vel]) you want to repeat at the `rate` specified.

### looper.transform('offset', offset)

Shift all note playback positions by offset.

### looper.transform('loop', start, length)

Loops playback notes from `start` and if length exceeds the total loopLength, the notes are repeated to fill.

### looper.transform('hold', start, length)

Like `loop` except preserves the original playback length

### looper.transform('quantize', grid, noteKeysToQuantize)

Quantize the specified notes (or null for all notes) to quantize at the `grid` specified.
