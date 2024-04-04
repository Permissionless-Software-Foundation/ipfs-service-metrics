/*
  This library of use-cases holds the business logic around collecting and
  publishing metrics data. These use-cases are consumed by the Timer Controller
  library.
*/

// Global npm libraries
import PSFFPP from 'psffpp'

// Local libraries
import wlogger from '../adapters/wlogger.js'
import config from '../../config/index.js'

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
    this.config = config
    this.PSFFPP = PSFFPP

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
      const walletServices = peerData.filter(x => x.data.jsonLd.protocol === 'ipfs-bch-wallet-service' || x.data.jsonLd.protocol === 'ipfs-bch-wallet-consumer')
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
      const thisNode = this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode
      console.log(`thisNode: ${JSON.stringify(thisNode, null, 2)}`)

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
      // console.log('walletPeers: ', walletPeers)

      // Get all the nodes providing File Pin services
      const pinPeers = await this.getFilePinServices()
      // console.log('pinPeers: ', pinPeers)

      const now = new Date()

      return {
        metricsVersion: this.config.version,
        createdAt: now.toISOString(),
        walletPeers,
        pinPeers
      }
    } catch (err) {
      console.error('Error in compileReport()')
      throw err
    }
  }

  // Publish the JSON report to IPFS and generate a Pin Claim on the blockchain.
  // Example code that inspired this function:
  // https://github.com/ipfs-examples/helia-examples/blob/main/examples/helia-101/301-networking.js
  async publishReport (inObj = {}) {
    try {
      const { report } = inObj

      // Open the wallet and ensure it has up-to-date UTXOs
      const walletData = await this.adapters.wallet.openWallet()
      const wallet = await this.adapters.wallet.instanceWallet(walletData)
      console.log('publishReport() wallet.walletInfo: ', wallet.walletInfo)

      // Make sure the wallet is initialized with UTXOs.
      await wallet.initialize()

      // Instantiate the PSFFPP library.
      this.psffpp = new this.PSFFPP({ wallet })

      // we will use this TextEncoder to turn strings into Uint8Arrays
      const encoder = new TextEncoder()
      const fs = this.adapters.ipfs.ipfs.fs

      // add the bytes to your node and receive a unique content identifier
      const binReport = encoder.encode(JSON.stringify(report))
      const cid = await fs.addBytes(binReport)

      // const size = binReport.length
      // let fileSizeInMegabytes = Math.ceil(size / 10000)/100
      // if(fileSizeInMegabytes < 0.01) fileSizeInMegabytes = 0.01

      // const wallet = this.adapter.wallet

      const writePrice = await this.psffpp.getMcWritePrice()
      console.log(`writePrice: ${writePrice}`)

      const now = new Date()
      const filename = `psf-metrics-${now.toISOString()}.json`

      const pinObj = {
        cid: cid.toString(),
        filename,
        fileSizeInMegabytes: 1
      }

      const { pobTxid, claimTxid } = await this.psffpp.createPinClaim(pinObj)
      console.log('pobTxid: ', pobTxid)
      console.log('claimTxid: ', claimTxid)

      return {
        pobTxid,
        claimTxid
      }
    } catch (err) {
      console.error('Error in publishReport()')
      throw err
    }
  }
}

export default MetricUseCases
