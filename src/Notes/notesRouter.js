const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const NotesService = require('./NotesService')
const { getNoteValidationError } = require('./noteValidator')

const notesRouter = express.Router()
const bodyParser = express.json()

const serializeNote = note => ({
  id: note.id,
  name: xss(note.name),
  content: xss(note.content),
  folderId: note.folderId,
  modified: note.modified
})

notesRouter
  .route('/notes')

  .get((req,res,next) => {
    const knexInstance = req.app.get('db')
    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(serializeNote))
      })
      .catch(next)
  })

  .post(bodyParser, (req, res, next) => {
    const { name, content, folderid } = req.body
    const newNote = { name, content, folderid }
    const knexInstance = req.app.get('db')

    for (const field of ['name', 'content', 'folderId']) {
        if (!newNote[field]) {
          logger.error(`Note ${field} is required`)
          return res.status(400).send({
            error: { message: `Note '${field}' is required` }
          })
        }
    }

    const error = getNoteValidationError(newNote);

    if (error) return res.status(400).send(error);

    NotesService.insertNote(knexInstance, newNote)
      .then(note => {
        logger.info(`Note with id ${note.id} and folderId ${note.folderId} created.`)
        res
          .status(201)
          .location(`/notes/${note.id}`) 
          .json(serializeBookmark(note))
      })
      .catch(next)
  })

notesRouter
  .route('/notes/:note_id')

  .all((req, res, next) => {
    const { note_id } = req.params
    const knexInstance = req.app.get('db')
    NotesService.getNote(knexInstance, note_id)
      .then(note => {
        if(!note) {
          logger.error(`Note with id ${note_id} not found.`)
          return res.status(404).json({
            error: { message: `Note Not Found`}
          })
        }
        res.note = note
        next()
      })
      .catch(next)
  })

  .get((req, res) => {
    res.json(serializeNote(res.note))   
  })

  .delete((req, res, next) => {
    const { note_id } = req.params
    const knexInstance = req.app.get('db')
    NotesService.deleteNote(knexInstance, note_id)
      .then(numRowsAffected => {
        logger.info(`Note with id ${note_id} deleted.`)
        res.status(204).end() 
    })
    .catch(next)
  })

  .patch(bodyParser, (req, res, next) => {
    const { name, content } = req.body
    const noteToUpdate = { name, content }
    const knexInstance = req.app.get('db')
    const { note_id } = req.params 

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length //filter(boolean) removes undefined, empty strings for fields not sent if they arent being updated
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required fields`)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'name' or 'content'`
        }
      })
    }

    const error = getNoteValidationError(noteToUpdate)

    if (error) return res.status(400).send(error)

    BookmarksService.updateNote(knexInstance, note_id, noteToUpdate)
      .then(updatedRow => {
        // console.log(updatedRow)
        res.status(200).json(updatedRow)
      })
      .catch(next)
  })

module.exports = notesRouter