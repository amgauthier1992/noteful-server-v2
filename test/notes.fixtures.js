function makeNotesArray() {
  return [
    {
      id: 1,
      name: 'First note',
      content: 'lorem ipsum',
      folderid: 1,
      modified: '1994-07-18T16:28:32.615Z'
    },
    {
      id: 2,
      name: 'Second note',
      content: 'lorem ipsum',
      folderid: 2,
      modified: '1992-07-24T16:28:32.615Z'
    },
    {
      id: 3,
      name: 'Third note',
      content: 'lorem ipsum',
      folderid: 3,
      modified: '1996-04-30T16:28:32.615Z'
    },
    {
      id: 4,
      name: 'Fourth note',
      content: 'lorem ipsum',
      folderid: 1,
      modified: '1994-08-26T16:28:32.615Z'
    },
  ]
}

function makeMaliciousNote() {
  const maliciousNote = {
    id: 911,
    name: 'Naughty naughty very naughty <script>alert("xss");</script>',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    folderid: 1,
    modified: new Date().toISOString()
  }
  const expectedNote = {
    ...maliciousNote, 
    name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousNote,
    expectedNote
  }
}

module.exports = {
  makeNotesArray,
  makeMaliciousNote,
}