require('dotenv').config()
const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures')

describe(`Notes Endpoints`, function() {
  let db;

  const cleanup = () => db.raw(
    `TRUNCATE
      folders,
      notes
    RESTART IDENTITY CASCADE`
  )

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    })
    app.set('db', db) 
  })
  
  after('disconnect from db', () => db.destroy())
  
  before('cleanup', () => cleanup())
  
  afterEach('cleanup', () => cleanup())

  describe(`GET /notes`, () => {
    context(`Given no notes`, () => {
      it(`responds with 200 and an empty array`, () => {
        return supertest(app)
          .get('/notes')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, [])
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();
      
      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })

      it('responds with 200 and all of the notes', () => {
        return supertest(app)
          .get(`/notes`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testNotes)
      })
    })

    context(`Given an XSS attack note`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote()
      
      beforeEach('insert malicious note', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert([ maliciousNote ])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/notes`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedNote.name)
            expect(res.body[0].content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe(`GET /notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteid = 123456
        return supertest(app)
          .get(`/notes/${noteid}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Note Not Found` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes= makeNotesArray()
  
      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })
  
      it('responds with 200 and the specified note', () => {
        const noteid = 2
        const expectedNote = testNotes[noteid - 1]
        return supertest(app)
          .get(`/notes/${noteid}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, expectedNote)
      })
    })
    
    context(`Given an XSS attack note`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousNote, expectedNote } = makeMaliciousNote();

      beforeEach('insert malicious note', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert([ maliciousNote ])
          })
      })

      it('removes XSS attack content', () => { 
        return supertest(app)
          .get(`/notes/${maliciousNote.id}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNote.name)
            expect(res.body.content).to.eql(expectedNote.content)
          })
      })
    })
  })

  describe(`POST /notes`, () => {
    const testFolders = makeFoldersArray();

    beforeEach('insert folders', () => {
      return db
        .into('folders')
        .insert(testFolders)
    })

    it(`creates a note, responding with 201 and the new note`, () => {
      const newNote = {
        name: 'new note name',
        content: 'new note content',
        folderid: 1 //random folder
      }
      return supertest(app)
        .post('/notes')
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newNote.name)
          expect(res.body.content).to.eql(newNote.content)
          expect(res.body.folderid).to.eql(1)
          expect(res.body).to.have.property('id')
          expect(res.body).to.have.property('folderid')
          expect(res.headers.location).to.eql(`/notes/${res.body.id}`)
          const expected = new Date().toLocaleString()
          const actual = new Date(res.body.modified).toLocaleString()
          expect(actual).to.eql(expected)
        })
        .then(res => 
          supertest(app)
            .get(`/notes/${res.body.id}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(res.body)
        )
    })

    const requiredFields = ['name', 'content', 'folderid']

    requiredFields.forEach(field => {
      const newNote = {
        name: 'new note name',
        content: 'new note content',
        folderid: 1
      }
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newNote[field]

        return supertest(app)
          .post('/notes')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(newNote)
          .expect(400, {
            error: { message: `Note '${field}' is required` }
          })
      })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousNote, expectedNote } = makeMaliciousNote()
      return supertest(app)
        .post(`/notes`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(maliciousNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedNote.name)
          expect(res.body.content).to.eql(expectedNote.content)
        })
    })
  })

  describe(`DELETE /notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteid = 123456
        return supertest(app)
          .delete(`/notes/${noteid}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Note Not Found` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray()
  
      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })

      it('responds with 204 and removes the note', () => {
        const idToRemove = 2
        const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
        return supertest(app)
          .delete(`/notes/${idToRemove}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/notes`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedNotes)
          )
      })
    })
  })

  describe(`PATCH /notes/:note_id`, () => {
    context(`Given no notes`, () => {
      it(`responds with 404`, () => {
        const noteid = 123456  
        return supertest(app)
          .delete(`/notes/${noteid}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Note Not Found` } })
      })
    })

    context('Given there are notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray()
  
      beforeEach('insert folders and notes', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          })
      })
  
      it('responds with 200 and updates the article', () => {
        const idToUpdate = 2
        const updatedNote = {
          name: 'updated note name',
          content: 'updated note content',
          folderid: 1
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updatedNote
        }
        return supertest(app)
          .patch(`/notes/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(updatedNote)
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/notes/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedNote)
          )
      })
  
      it(`responds with 400 when no required fields supplied`, () => {
          const idToUpdate = 2
          return supertest(app)
            .patch(`/notes/${idToUpdate}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .send({ irrelevantField: 'foo' })
            .expect(400, {
              error: {
                message: `Request body must contain either 'name', 'content', or 'folderid'`
              }
            })
        })
  
      it(`responds with 200 when updating only a subset of fields`, () => {
        const idToUpdate = 2
        const updatedNote = {
          name: 'updated anote name',
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updatedNote
        }
  
        return supertest(app)
          .patch(`/notes/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send({
            ...updatedNote,
            fieldToIgnore: 'should not be in GET response'
          })
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/notes/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedNote)
          )
      })

      it(`responds with 200 when updating only the note's containing folder`, () => {
        const idToUpdate = 2
        const updatedNote = {
          folderid: 2,
        }
        const expectedNote = {
          ...testNotes[idToUpdate - 1],
          ...updatedNote
        }

        return supertest(app)
          .patch(`/notes/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(updatedNote)
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/notes/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedNote)
          )
      })
    })
  })
})