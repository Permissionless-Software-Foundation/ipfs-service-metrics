/*
  This Controller library is concerned with timer-based functions that are
  kicked off periodicially.
*/

// Global npm libraries
import { Write } from 'p2wdb'

// Local libraries
import config from '../../config/index.js'

const METRICS_PERIOD = 60000 * 1
// const METRICS_PERIOD = 60000 * 60 * 12

class TimerControllers {
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

    this.debugLevel = localConfig.debugLevel

    // Encapsulate dependencies
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.exampleTimerFunc = this.exampleTimerFunc.bind(this)
    this.handleMetrics = this.handleMetrics.bind(this)
    this.writeMetrics = this.writeMetrics.bind(this)
    this.gatherCRMetrics = this.gatherCRMetrics.bind(this)
    this.getCashStackServices = this.getCashStackServices.bind(this)
    this.getFilePinServices = this.getFilePinServices.bind(this)

    // this.startTimers()
  }

  // Start all the time-based controllers.
  startTimers () {
    // Any new timer control functions can be added here. They will be started
    // when the server starts.
    // this.optimizeWalletHandle = setInterval(this.exampleTimerFunc, 60000 * 10)
    this.handleMetricsHandle = setInterval(this.handleMetrics, METRICS_PERIOD)

    return true
  }

  stopTimers () {
    clearInterval(this.optimizeWalletHandle)
  }

  // Replace this example function with your own timer handler.
  exampleTimerFunc (negativeTest) {
    try {
      console.log('Example timer controller executed.')

      if (negativeTest) throw new Error('test error')

      return true
    } catch (err) {
      console.error('Error in exampleTimerFunc(): ', err)

      // Note: Do not throw an error. This is a top-level function.
      return false
    }
  }

  async handleMetrics () {
    try {
      // Disable the interval to prevent multiple executions.
      clearInterval(this.handleMetricsHandle)

      // const crMetrics = await this.gatherCRMetrics()
      // console.log('crMetrics: ', crMetrics)

      // Get all the nodes providing CashStack web3 services
      const walletPeers = await this.getCashStackServices()
      console.log('walletPeers: ', walletPeers)

      // Get all the nodes providing File Pin services
      const pinPeers = await this.getFilePinServices()
      console.log('pinPeers: ', pinPeers)

      // const hash = await this.writeMetrics(crMetrics)
      // console.log('hash: ', hash)

      // Renable interval
      this.handleMetricsHandle = setInterval(this.handleMetrics, METRICS_PERIOD)
    } catch (err) {
      console.error('Error in handleMetrics(): ', err)
      // Do not throw error. This is a top-level function.

      this.handleMetricsHandle = setInterval(this.handleMetrics, METRICS_PERIOD)
    }
  }

  // Write collected metrics to the P2WDB.
  async writeMetrics (metricData) {
    try {
      console.log(`metricData: ${JSON.stringify(metricData, null, 2)}`)

      // Instantiate the Write library
      const bchWallet = this.adapters.wallet
      // console.log('bchWallet: ', bchWallet)
      const write = new Write({ bchWallet })

      // Burn PSF token to pay for P2WDB write.
      // const txid = await this.adapters.wallet.burnPsf()
      // console.log('burn txid: ', txid)
      // console.log(`https://simpleledger.info/tx/${txid}`)

      // generate signature.
      // const now = new Date()
      // const message = now.toISOString()
      // const signature = await this.adapters.wallet.generateSignature(message)

      // const p2wdbObj = {
      //   txid,
      //   signature,
      //   message,
      //   // appId: 'psf-ipfs-metrics-0001',
      //   appId: 'psf-ipfs-metrics-test01',
      //   data: metricData
      // }

      const appId = 'psf-ipfs-metrics-0002'
      // const appId = 'psf-ipfs-metrics-test01'

      // Add offer to P2WDB.
      // const hash = await this.adapters.p2wdb.write(p2wdbObj)
      const hash = await write.postEntry(metricData, appId)
      console.log('metrics written to P2WDB: ', hash)

      return hash
    } catch (err) {
      console.error('Error in writeMetrics()')
      throw err
    }
  }

  // Get a list of all IPFS nodes running the ipfs-bch-wallet-service.
  async getCashStackServices () {
    try {
      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log('peerData: ', JSON.stringify(peerData, null, 2))

      // Filter the peers so that only those advertising a wallet service are left.
      const walletServices = peerData.filter(x => x.data.jsonLd.protocol === 'ipfs-bch-wallet-service')
      // console.log('walletServices: ', JSON.stringify(walletServices, null, 2))

      const walletPeers = []
      for (let i = 0; i < walletServices.length; i++) {
        const thisWalletService = walletServices[i]

        // Create a summary object of the peer.
        const thisPeer = {
          name: thisWalletService.data.jsonLd.name,
          protocol: thisWalletService.data.jsonLd.protocol,
          version: thisWalletService.data.jsonLd.version,
          encryptPubKey: thisWalletService.data.encryptPubKey,
          ipfsId: thisWalletService.data.jsonLd.identifier,
          multiaddr: thisWalletService.multiaddr
        }
        walletPeers.push(thisPeer)
      }

      return walletPeers
    } catch (err) {
      console.error('Error in getCashStackServices(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }

  // Get a list of all IPFS nodes runing the ipfs-file-pin-service.
  async getFilePinServices () {
    try {
      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log('peerData: ', JSON.stringify(peerData, null, 2))

      // Filter the peers so that only the ones advertising file pinning service are left.
      const filePinServices = peerData.filter(x => x.data.jsonLd.protocol === 'ipfs-file-pin-service')
      // console.log('filePinServices: ', JSON.stringify(filePinServices, null, 2))

      const pinPeers = []
      for (let i = 0; i < filePinServices.length; i++) {
        const thisPinService = filePinServices[i]

        // Create a summary object of the peer.
        const thisPeer = {
          name: thisPinService.data.jsonLd.name,
          protocol: thisPinService.data.jsonLd.protocol,
          version: thisPinService.data.jsonLd.version,
          encryptPubKey: thisPinService.data.encryptPubKey,
          ipfsId: thisPinService.data.jsonLd.identifier,
          multiaddr: thisPinService.multiaddr
        }
        pinPeers.push(thisPeer)
      }

      return pinPeers
    } catch (err) {
      console.error('Error in filePinServices(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }

  // Obtain metrics on Circuit Relays.
  async gatherCRMetrics () {
    try {
      const relayData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.relayData
      console.log('relayData: ', relayData)

      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      console.log('peerData: ', JSON.stringify(peerData, null, 2))

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

export default TimerControllers
