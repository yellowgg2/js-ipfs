'use strict'

module.exports = (domain, opts, callback) => {
  domain = encodeURIComponent(domain)
  let url = `https://ipfs.io/api/v0/dns?arg=${domain}`

  for (const prop in opts) {
    url += `&${prop}=${opts[prop]}`
  }

  self.fetch(url, {mode: 'cors'})
    .then((response) => {
      if (response.ok) return response.json()

      return response.text()
        .then((text) => {
          throw new Error(`failed to fetch ${url}: ${response.status} ${text}`)
        })
    })
    .then((response) => {
      if (response.Path) {
        return callback(null, response.Path)
      } else {
        return callback(new Error(response.Message))
      }
    })
    .catch((error) => {
      callback(error)
    })
}
