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
    this.getConsumerNodes = this.getConsumerNodes.bind(this)
    this.getFilePinServices = this.getFilePinServices.bind(this)
    this.compileInitialReport = this.compileInitialReport.bind(this)
    this.compileReport = this.compileReport.bind(this)
    this.getCircuitRelays = this.getCircuitRelays.bind(this)
    this.initPinContent = this.initPinContent.bind(this)
    this.interrogatePinServices = this.interrogatePinServices.bind(this)
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

  // Get a list of all IPFS nodes running the ipfs-bch-wallet-consumer
  async getConsumerNodes () {
    try {
      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log('peerData: ', JSON.stringify(peerData, null, 2))

      // Filter the peers so that only those advertising a wallet service are left.
      const consumers = peerData.filter(x => x.data.jsonLd.protocol === 'ipfs-bch-wallet-consumer')
      // console.log('consumers: ', JSON.stringify(consumers, null, 2))

      const consumerPeers = []
      for (let i = 0; i < consumers.length; i++) {
        const thisConsumer = consumers[i]

        // Create a summary object of the peer.
        const thisPeer = {
          name: thisConsumer.data.jsonLd.name,
          protocol: thisConsumer.data.jsonLd.protocol,
          version: thisConsumer.data.jsonLd.version,
          encryptPubKey: thisConsumer.data.encryptPubKey,
          ipfsId: thisConsumer.data.jsonLd.identifier,
          multiaddr: thisConsumer.multiaddr,
          web2Api: thisConsumer.data.jsonLd.web2Api
        }
        consumerPeers.push(thisPeer)
      }

      return consumerPeers
    } catch (err) {
      console.error('Error in getConsumerNodes(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }

  // Get a list of all IPFS nodes runing the ipfs-file-pin-service.
  async getFilePinServices () {
    try {
      // const thisNode = this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode
      // console.log(`thisNode: ${JSON.stringify(thisNode, null, 2)}`)

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

  // Get a list of all IPFS nodes running as a V2 Circuit Relay
  async getCircuitRelays () {
    try {
      // const thisNode = this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode
      // console.log(`thisNode: ${JSON.stringify(thisNode, null, 2)}`)

      const peerData =
        this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log('peerData: ', JSON.stringify(peerData, null, 2))

      // Filter the peers so that only the ones advertising file pinning service are left.
      const crNodes = peerData.filter(x => x.data.isCircuitRelay === true)
      // console.log('crNodes: ', JSON.stringify(crNodes, null, 2))

      const crPeers = []
      for (let i = 0; i < crNodes.length; i++) {
        const thisNode = crNodes[i]

        // Create a summary object of the peer.
        const thisPeer = {
          name: thisNode.data.jsonLd.name,
          protocol: thisNode.data.jsonLd.protocol,
          version: thisNode.data.jsonLd.version,
          encryptPubKey: thisNode.data.encryptPubKey,
          ipfsId: thisNode.data.jsonLd.identifier,
          multiaddr: thisNode.multiaddr
        }
        crPeers.push(thisPeer)
      }

      return crPeers
    } catch (err) {
      console.error('Error in getCircuitRelays(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }

  // Compile an initial report, based on the state of this IPFS node and the
  // peers it can see. This is a quick action that prepares for interrogation
  // of the connected nodes.
  async compileInitialReport (inObj = {}) {
    try {
      // Get all the nodes providing CashStack web3 services
      const walletPeers = await this.getCashStackServices()
      // console.log('walletPeers: ', walletPeers)

      // Get all the nodes running ipfs-bch-wallet-consumer
      const consumerPeers = await this.getConsumerNodes()

      // Get all the nodes providing File Pin services
      const pinPeers = await this.getFilePinServices()
      // console.log('pinPeers: ', pinPeers)

      const crPeers = await this.getCircuitRelays()

      const now = new Date()

      return {
        metricsVersion: this.config.version,
        createdAt: now.toISOString(),
        walletPeers,
        consumerPeers,
        pinPeers,
        circuitRelays: crPeers
      }
    } catch (err) {
      console.error('Error in compileInitialReport()')
      throw err
    }
  }

  // This is a macro function. It orchestrates many of the subfunctions in this
  // library. It returns a metrics report as a JSON object. That object can then
  // be published to IPFS using a Pin Claim.
  async compileReport (inObj = {}) {
    try {
      // Generate an initial report based on the state of the IPFS node.
      const initialReport = await this.compileInitialReport(inObj)

      await this.interrogateConsumers({ initialReport })

      // await this.interrogatePinServices({ initialReport })

      return initialReport
    } catch (err) {
      console.error('Error in compileReport()')
      throw err
    }
  }

  // async interrogateConsumers (inObj = {}) {
  //   try {
  //     const { initialReport } = inObj
  //
  //     // const { consumerPeers } = initialReport
  //   } catch (err) {
  //     console.error('Error in iterrogateConsuemrs()')
  //     throw err
  //   }
  // }

  // This function is run at startup. It waits until a Pin Service is connected
  // to, then it request the most recent pinned content. It sets the most
  // recent as the file to use for metric tests. This function retries with a
  // delay until it is successful.
  async initPinContent (inObj = {}) {
    try {
      this.callComplete = false

      // const initPinContentHandle = setInterval(async function () {
      //   if()
      // }, 60000 * 2)
    } catch (err) {
      console.error('Error in initPinContent()')
      throw err
    }
  }

  // For each wallet service, download a recently pinned piece of conent to test
  // that it's operating correctly.
  // async interrogatePinServices (inObj = {}) {
  //   try {
  //
  //   } catch (err) {
  //     console.error('Error in interrogatePinServices()')
  //     throw err
  //   }
  // }

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
