// Based on Harminder Virk's work on
// https://github.com/dimerapp/cli/blob/d6554e7ffd0381f283643a54feae429d2ff01cef/src/services/SSE.ts

import { status, header } from 'node-res'

export default class SSE {
  constructor () {
    this.subscriptions = new Set()
    this.counter = 0
  }

  // Subscribe to a channel and set initial headers
  public subscribe (res) {
    status(res, 200)
    header(res, 'Content-Type', 'text/event-stream')
    header(res, 'Cache-Control', 'no-cache')
    header(res, 'Connection', 'keep-alive')

    this.subscriptions.add(res)
    this.res.on('close', () => this.subscriptions.delete(res))
    this.publish('ready', {})
  }

  // Publish event and data to all connected clients
  public broadcast (event, data) {
    this.counter++
    // Do console.log(this.subscriptions.size) to see, if there are any memory leaks
    for (const res of this.subscriptions) {
      this.clientBroadcast(res, event, data)
    }
  }

  // Publish event and data to a given response object
  clientBroadcast (res, event, data) {
    res.write(`id: ${this.counter}\n`)
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
}