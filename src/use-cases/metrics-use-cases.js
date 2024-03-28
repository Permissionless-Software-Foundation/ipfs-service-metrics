/*
  This library of use-cases holds the business logic around collecting and
  publishing metrics data. These use-cases are consumed by the Timer Controller
  library.
*/

// Local libraries
import wlogger from '../adapters/wlogger.js'

class MetricUseCases {
  constructor (localConfig = {}) {
    // Depency injection
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating User Use Cases library.'
      )
    }

    // Encapsulate dependencies
    this.wlogger = wlogger

    // Bind 'this' object to all subfunctions
    this.getCashStackServices = this.getCashStackServices.bind(this)
    this.getFilePinServices = this.getFilePinServices.bind(this)
    this.compileReport = this.compileReport.bind(this)
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

  // This is a macro function. It orchestrates many of the subfunctions in this
  // library. It returns a metrics report as a JSON object. That object can then
  // be published to IPFS using a Pin Claim.
  async compileReport (inObj = {}) {
    try {
      // Get all the nodes providing CashStack web3 services
      const walletPeers = await this.getCashStackServices()
      console.log('walletPeers: ', walletPeers)

      // Get all the nodes providing File Pin services
      const pinPeers = await this.getFilePinServices()
      console.log('pinPeers: ', pinPeers)
    } catch (err) {
      console.error('Error in compileReport()')
      throw err
    }
  }
}

export default MetricUseCases
