function makeFoldersArray() {
  return [
    {
      id: 1,
      name: 'Folder One'
    },
    {
      id: 2,
      name: 'Folder Two'
    },
    {
      id: 3,
      name: 'Folder Three'
    },
  ];
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    id: 911,
    name: 'Naughty naughty very naughty <script>alert("xss");</script>',
  }
  const expectedFolder = {
    ...maliciousFolder,
    name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
  }
  return {
    maliciousFolder,
    expectedFolder,
  }
}

module.exports = {
  makeFoldersArray,
  makeMaliciousFolder,
}