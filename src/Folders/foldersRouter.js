const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const FoldersService = require('./FoldersService')
const { getFolderValidationError } = require('./folderValidator')

const foldersRouter = express.Router()
const bodyParser = express.json()

const serializeFolder = folder => ({
  id: folder.id,
  name: xss(folder.name),
})

foldersRouter
  .route('/folders')

  .get((req,res,next) => {
    const knexInstance = req.app.get('db')
    FoldersService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(serializeFolder))
      })
      .catch(next)
  })

  .post(bodyParser, (req, res, next) => {
    const { name } = req.body
    const newFolder = { name }
    const knexInstance = req.app.get('db')

    for (const field of ['name']) {
        if (!newFolder[field]) {
          logger.error(`Folder ${field} is required`)
          return res.status(400).send({
            error: { message: `Folder '${field}' is required` }
          })
        }
    }

    const error = getFolderValidationError(newFolder);

    if (error) return res.status(400).send(error);

    FoldersService.insertFolder(knexInstance, newFolder)
      .then(folder => {
        logger.info(`Folder with id ${folder.id} and name ${folder.name} created.`)
        res
          .status(201)
          .location(`/folders/${folder.id}`) 
          .json(serializeFolder(folder))
      })
      .catch(next)
  })

foldersRouter
  .route('/folders/:folder_id')

  .all((req, res, next) => {
    const { folder_id } = req.params
    const knexInstance = req.app.get('db')
    FoldersService.getFolder(knexInstance, folder_id)
      .then(folder => {
        if(!folder) {
          logger.error(`Folder with id ${folder_id} not found.`)
          return res.status(404).json({
            error: { message: `Folder Not Found`}
          })
        }
        res.folder = folder
        next()
      })
      .catch(next)
  })

  .get((req, res) => {
    res.json(serializeFolder(res.folder))   
  })

  .delete((req, res, next) => {
    const { folder_id } = req.params
    const knexInstance = req.app.get('db')
    FoldersService.deleteFolder(knexInstance, folder_id)
      .then(numRowsAffected => {
        logger.info(`Folder with id ${folder_id} deleted.`)
        res.status(204).end() 
    })
    .catch(next)
  })

  .patch(bodyParser, (req, res, next) => {
    const { name } = req.body
    const folderToUpdate = { name }
    const knexInstance = req.app.get('db')
    const { folder_id } = req.params 

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length //filter(boolean) removes undefined, empty strings for fields not sent if they arent being updated
    if (numberOfValues === 0) {
      logger.error(`Invalid update without required field`)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'name'`
        }
      })
    }

    const error = getFolderValidationError(folderToUpdate)

    if (error) return res.status(400).send(error)

    FoldersService.updateFolder(knexInstance, folder_id, folderToUpdate)
      .then(updatedRow => {
        // console.log(updatedRow)
        res.status(200).json(updatedRow)
      })
      .catch(next)
  })

module.exports = foldersRouter