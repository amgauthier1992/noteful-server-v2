const logger = require('../logger')

const NO_ERRORS = null

function getFolderValidationError({ name }) {
  if(!name) {
    logger.error(`Folder name must be provided`)
    return {
      error: {
        message: `Folder name must be provided`
      }
    }
  }
  return NO_ERRORS;
}

module.exports = {
  getFolderValidationError,
}
