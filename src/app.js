require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const validateBearerToken = require('./validate-bearer-token')
const errorHandler = require('./error-handler')
const foldersRouter = require('./Folders/foldersRouter')
const notesRouter= require('./Notes/notesRouter')

const app = express();

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}))

app.use(cors());
app.use(helmet());
app.use(validateBearerToken)
app.use(foldersRouter)
app.use(notesRouter)
app.use(errorHandler) //use error handler middleware last

module.exports = app;