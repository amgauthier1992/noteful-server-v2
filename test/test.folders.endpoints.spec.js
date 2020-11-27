require('dotenv').config()
const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app')
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')

describe(`Folders Endpoints`, function() {
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
  
  describe(`GET /folders`, () => {
    context(`Given no folders`, () => {
      it(`responds with 200 and an empty array`, () => {
        return supertest(app)
          .get('/folders')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, [])
      })
    })

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
      
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 200 and all of the folders', () => {
        return supertest(app)
          .get('/folders')
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200, testFolders)
      })
    })

    context(`Given an XSS attack folder`, () => {
      const testFolders = makeFoldersArray();
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

      beforeEach(`insert malicious folder`, () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('folders')
              .insert([ maliciousFolder ])
          })
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/folders`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body[3].name).to.eql(expectedFolder.name)
          })
      })
    })

    describe(`GET /folders/:folder_id`, () => {
      context(`Given no folders`, () => {
        it(`responds with 404`, () => {
          const folderid = 12345
          return supertest(app)
            .get(`/folders/${folderid}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(404, { error: { message: `Folder Not Found` } })
        })
      })

      context(`Given there are folders in the database`, () => {
        const testFolders = makeFoldersArray();
        
        beforeEach('insert folders', () => {
          return db
            .into('folders')
            .insert(testFolders)
        })
        
        it('responds with 200 and the specified folder', () => {
          const folderid = 2
          const expectedFolder = testFolders[folderid - 1]
          return supertest(app)
            .get(`/folders/${folderid}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(200, expectedFolder)
        })
      })

      context(`Given an XSS attack folder`, () => {
        const testFolders = makeFoldersArray();
        const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

        beforeEach(`insert malicious folder`, () => {
          return db
            .into('folders')
            .insert(testFolders)
            .then(() => {
              return db
                .into('folders')
                .insert([ maliciousFolder ])
            })
        })

        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/folders/${maliciousFolder.id}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(200)
            .expect(res => {
              expect(res.body.name).to.eql(expectedFolder.name)
            })
        })
      }) 
    })
  })

  describe(`POST /folders`, () => {
    it(`creates a folder, responding with 201 and the new folder`, () => {
      const newFolder = {
        name: 'New folder'
      }
      return supertest(app)
        .post(`/folders`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newFolder.name)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/folders/${res.body.id}`)
        })
        .then(res => 
          supertest(app)
            .get(`/folders/${res.body.id}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(res.body)
        )
    })

    it(`responds with 400 and an error message when the 'name' is missing`, () => {
      const newFolder = {
        name: 'New folder'
      }
      delete newFolder.name

      return supertest(app)
        .post(`/folders`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(newFolder)
        .expect(400, {
          error: { message: `Folder 'name' is required` }
        })
    })

    it('removes XSS attack content from response', () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
      return supertest(app)
        .post(`/folders`)
        .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
        .send(maliciousFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(expectedFolder.name)
        })
    })
  })

  describe(`DELETE /folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderid = 12345
        return supertest(app)
          .delete(`/folders/${folderid}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(404, { error: { message: `Folder Not Found` } })
      })
    })

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
      
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 204 and removes the folder', () => {
        const idToRemove = 2
        const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
        return supertest(app)
          .delete(`/folders/${idToRemove}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/folders`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedFolders)
          )
      })
    })
  })

  describe(`PATCH /folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it(`responds with 404`, () => {
        const folderid = 123456
          return supertest(app)
            .delete(`/folders/${folderid}`)
            .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
            .expect(404, { error: { message: `Folder Not Found` } })
      })
    })

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray();
      
      beforeEach('insert folders', () => {
        return db
          .into('folders')
          .insert(testFolders)
      })

      it('responds with 200 and updates the folder', () => {
        const idToUpdate = 2
        const updatedFolder= {
          name: 'updated folder title',
        }
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updatedFolder
        }
        return supertest(app)
          .patch(`/folders/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send(updatedFolder)
          .expect(200)
          .then(res =>
            supertest(app)
              .get(`/folders/${idToUpdate}`)
              .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
              .expect(expectedFolder)
          )
      })

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/folders/${idToUpdate}`)
          .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain 'name'`
            }
          })
      })
    })
  })
})