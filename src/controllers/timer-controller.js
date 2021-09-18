/*
  Timer-based controller.
*/

let _this

class TimerController {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Timer Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Timer Controller libraries.'
      )
    }

    _this = this
  }

  start () {
    setInterval(async function () {
      const crMetrics = await _this.gatherCRMetrics()
      console.log('crMetrics: ', crMetrics)
    }, 20000)
  }

  // Obtain metrics on Circuit Relays.
  async gatherCRMetrics () {
    try {
      const relayData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.relayData
      // console.log('relayData: ', relayData)

      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log('peerData: ', peerData)

      const relayMetrics = []

      for (let i = 0; i < relayData.length; i++) {
        const thisRelay = relayData[i]
        // console.log(`thisRelay: ${JSON.stringify(thisRelay, null, 2)}`)

        // Get the peer data for this relay.
        let thisPeer = peerData.filter((x) => x.from.includes(thisRelay.ipfsId))
        thisPeer = thisPeer[0]
        // console.log(`thisPeer: ${JSON.stringify(thisPeer, null, 2)}`)

        if (!thisPeer) {
          console.log(
            'Warning: Relay not found in peer list. This should not happen. Relay: ',
            thisRelay
          )
          console.log(`peerData: ${JSON.stringify(peerData, null, 2)}`)
          continue
        }

        const relayMetric = {
          multiaddr: thisRelay.multiaddr,
          ipfsId: thisRelay.ipfsId,
          latencyScore: thisRelay.latencyScore,
          name: thisPeer.data.jsonLd.name,
          protocol: thisPeer.data.jsonLd.protocol,
          version: thisPeer.data.jsonLd.version
        }
        // console.log('relayMetric: ', relayMetric)

        relayMetrics.push(relayMetric)
      }

      return relayMetrics
    } catch (err) {
      console.error('Error in gatherMetrics(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }
}

module.exports = TimerController
