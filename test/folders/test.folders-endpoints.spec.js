const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app')
const { makeTestDataArray } = require('./example.fixtures') 

describe(`Test Suite`, function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db) 
  })
  
  after('disconnect from db', () => db.destroy())
  
  before('clean the table', () => db('blogful_articles').truncate())
  
  afterEach('cleanup', () => db('blogful_articles').truncate())
  
})