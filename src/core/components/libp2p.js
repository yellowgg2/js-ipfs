'use strict'

// libp2p-nodejs gets replaced by libp2p-browser when webpacked/browserified
const Node = require('../runtime/libp2p-nodejs')
const promisify = require('promisify-es6')
const get = require('lodash.get')
const Protector = require('libp2p-pnet')

module.exports = function libp2p (self) {
  return {
    start: promisify((callback) => {
      Promise.all([
        self.config.get(),
        self.repo.swarmKey()
      ])
        .then((results) => {
          gotConfig.apply(null, results)
        })
        .catch(callback)

      function gotConfig (config, swarmKey) {
        const options = {
          mdns: get(config, 'Discovery.MDNS.Enabled'),
          webRTCStar: get(config, 'Discovery.webRTCStar.Enabled'),
          bootstrap: get(config, 'Bootstrap'),
          modules: self._libp2pModules,
          // EXPERIMENTAL
          pubsub: get(self._options, 'EXPERIMENTAL.pubsub', false),
          dht: get(self._options, 'EXPERIMENTAL.dht', false),
          relay: {
            enabled: get(self._options, 'EXPERIMENTAL.relay.enabled',
              get(config, 'EXPERIMENTAL.relay.enabled', false)),
            hop: {
              enabled: get(self._options, 'EXPERIMENTAL.relay.hop.enabled',
                get(config, 'EXPERIMENTAL.relay.hop.enabled', false)),
              active: get(self._options, 'EXPERIMENTAL.relay.hop.active',
                get(config, 'EXPERIMENTAL.relay.hop.active', false))
            }
          }
        }

        // If a psk swarm.key exists in the repo, make the network private
        if (swarmKey) {
          options.protector = new Protector(swarmKey)
        }

        self._libp2pNode = new Node(self._peerInfo, self._peerInfoBook, options)

        self._libp2pNode.on('peer:discovery', (peerInfo) => {
          const dial = () => {
            self._peerInfoBook.put(peerInfo)
            self._libp2pNode.dial(peerInfo, () => {})
          }
          if (self.isOnline()) {
            dial()
          } else {
            self._libp2pNode.once('start', dial)
          }
        })

        self._libp2pNode.on('peer:connect', (peerInfo) => {
          self._peerInfoBook.put(peerInfo)
        })

        self._libp2pNode.start((err) => {
          if (err) { return callback(err) }

          self._libp2pNode.peerInfo.multiaddrs.forEach((ma) => {
            console.log('Swarm listening on', ma.toString())
          })

          callback()
        })
      }
    }),
    stop: promisify((callback) => {
      self._libp2pNode.stop(callback)
    })
  }
}
