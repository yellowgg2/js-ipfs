/* eslint max-nested-callbacks: ["error", 8] */
/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const IPFS = require('../../src/core')
const parallel = require('async/parallel')

// This gets replaced by `create-repo-browser.js` in the browser
const createTempRepo = require('../utils/create-repo-nodejs.js')

describe('options', () => {
  let repos = []
  let repo

  beforeEach(() => {
    repo = createTempRepo()
    repos.push(repo)
  })

  afterEach((done) => {
    parallel(
      repos.map(repo => (cb) => repo.teardown(cb)),
      done
    )
  })

  it('should merge options with repo config', (done) => {
    let ipfs = new IPFS({
      repo: repo,
      init: true,
      start: false
    })

    expect(ipfs._options.EXPERIMENTAL).to.deep.equal({})

    ipfs.once('ready', () => {
      // no experimental options have been set
      expect(ipfs._options.EXPERIMENTAL).to.deep.equal({})

      // set an experimental option
      repo.config.set('EXPERIMENTAL.pubsub', true, (error) => {
        if (error) {
          return done(error)
        }

        ipfs = new IPFS({
          repo: repo,
          init: true,
          start: false,
          EXPERIMENTAL: {
            sharding: true
          }
        })

        // should only have the experimental option we passed to the constructor
        expect(ipfs._options.EXPERIMENTAL).to.deep.equal({sharding: true})

        ipfs.once('ready', () => {
          // should have read experimental options from repo config and merged with constructor args
          expect(ipfs._options.EXPERIMENTAL).to.deep.equal({
            sharding: true,
            pubsub: true
          })

          done()
        })
      })
    })
  })
})
