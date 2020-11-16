const logger = require('../logger')

const NO_ERRORS = null

function getNoteValidationError({ name, content, folderId, modified }) {
  if(!name) {
    logger.error(`Note name must be provided`)
    return {
      error: {
        message: `Note name must be provided`
      }
    }
  }

  if(!content) {
    logger.error(`Note content must be provided`)
    return {
      error: {
        message: `Note content must be provided`
      }
    }
  }

  if(!folderId) {
    logger.error(`Note must be assigned to an existing folder`)
    return {
      error: {
        message: `Note must be assigned to an existing folder`
      }
    }
  }

//   if(!modified) {}

  return NO_ERRORS;
}

module.exports = {
  getNoteValidationError,
}
