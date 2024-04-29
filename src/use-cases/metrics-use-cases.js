/*
  This library of use-cases holds the business logic around collecting and
  publishing metrics data. These use-cases are consumed by the Timer Controller
  library.
*/

// Global npm libraries
import PSFFPP from 'psffpp'
import axios from 'axios'
import BchTokenSweep from 'bch-token-sweep/index.js'

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
    this.axios = axios
    this.BchTokenSweep = BchTokenSweep

    // Bind 'this' object to all subfunctions
    this.getCashStackServices = this.getCashStackServices.bind(this)
    this.getConsumerNodes = this.getConsumerNodes.bind(this)
    this.getFilePinServices = this.getFilePinServices.bind(this)
    this.compileInitialReport = this.compileInitialReport.bind(this)
    this.compileReport = this.compileReport.bind(this)
    this.getCircuitRelays = this.getCircuitRelays.bind(this)
    this.initPinContent = this.initPinContent.bind(this)
    this.interrogateConsumers = this.interrogateConsumers.bind(this)
    // this.interrogatePinServices = this.interrogatePinServices.bind(this)

    // State
    this.targetCid = null // placeholder
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
        ipfsPeers: {
          walletPeers,
          consumerPeers,
          pinPeers,
          circuitRelays: crPeers
        }
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

      // Try to sweep the test wallet to make sure its balance is zero.
      try {
        await this.sweepTestWallet()
      } catch (err) {
        console.log('Error trying to sweep test wallet. Continuing metrics test.')
      }

      let expectedBalance = 0
      try {
        expectedBalance = await this.loadTestWallet()
      } catch (err) {
        console.error('Error trying to send PSF tokens to test wallet. Can not continue test. Error: ', err)
        return initialReport
      }

      // Wait a few seconds to let the transaction propegate across the network.
      const timeToWait = 15000
      console.log(`Waiting ${timeToWait / 1000} seconds before checking balance...`)
      await this.adapters.wallet.bchWallet.bchjs.Util.sleep(timeToWait)

      const consumerReport = await this.interrogateConsumers({ initialReport, expectedBalance })
      initialReport.consumerReport = consumerReport

      // await this.interrogatePinServices({ initialReport })

      return initialReport
    } catch (err) {
      console.error('Error in compileReport(): ', err)
      throw err
    }
  }

  async interrogateConsumers (inObj = {}) {
    try {
      // Get a list of consumer nodes
      const { initialReport, expectedBalance } = inObj
      const { consumerPeers } = initialReport.ipfsPeers

      // Return an empty array if there are no known consumer peers.
      if (!consumerPeers || !consumerPeers.length) return []

      const consumerReport = []

      for (let i = 0; i < consumerPeers.length; i++) {
        const thisConsumer = consumerPeers[i]
        const web2Api = thisConsumer.web2Api

        // Skip this peer if it does not have a web2 API listed.
        if (!web2Api) continue

        // Get the IPFS ID of the file service this consumer is attached to.
        const fileServiceResult = await this.axios.get(`${web2Api}/ipfs/service`)
        const fileService = fileServiceResult.data.selectedIpfsFileProvider
        console.log('fileService: ', fileService)
        thisConsumer.fileService = fileService

        // Get the IPFS ID of the wallet service this consumer is attached to.
        const bchServiceResult = await this.axios.get(`${web2Api}/bch/service`)
        const bchService = bchServiceResult.data.selectedServiceProvider
        console.log('bchService: ', bchService)
        thisConsumer.bchService = bchService

        // Get data on the files pinned by the pinning services this consumer
        // peer is connected to.
        let url = `${web2Api}/ipfs/pins`
        console.log('url: ', url)
        const pinsResult = await this.axios.get(url)
        const fileData = pinsResult.data
        // console.log(`fileData for ${web2Api}: `, JSON.stringify(fileData, null, 2))

        if (fileData.success === false) {
          thisConsumer.targetCid = null
          thisConsumer.targetCidIsValid = false
          thisConsumer.targetCidIsValid = false
        } else {
          if (i === 0) {
            this.targetCid = fileData.pins.pins[1].cid

            thisConsumer.targetCid = this.targetCid
            thisConsumer.targetCidIsValid = fileData.pins.pins[1].validClaim
            thisConsumer.targetCidIsPinned = fileData.pins.pins[1].dataPinned
          } else {
            thisConsumer.targetCid = this.targetCid

            const target = fileData.pins.pins.filter(x => x.cid === this.targetCid)
            if (!target[0]) {
              thisConsumer.targetCidIsValid = null
              thisConsumer.targetCidIsPinned = null
            } else {
              thisConsumer.targetCidIsValid = target[0].validClaim
              thisConsumer.targetCidIsPinned = target[0].dataPinned
            }
          }
        }

        // Get the address for the test wallet
        const wallet = this.adapters.wallet.bchWallet
        const keyPair = await wallet.getKeyPair(1)
        const address = keyPair.cashAddress

        url = `${web2Api}/bch/utxos`
        const bchResult = await this.axios.post(url, { address })
        const utxos = bchResult.data
        console.log('utxos: ', JSON.stringify(utxos, null, 2))

        thisConsumer.walletServiceWorking = false

        if (utxos[0].slpUtxos) {
          if (!utxos[0].slpUtxos.type1.tokens.length) {
            throw new Error('No SLP token UTXOs found. Indexer may have fallen behind, or more time may be needed before balance registers.')
          }

          const tokenQty = Number(utxos[0].slpUtxos.type1.tokens[0].qtyStr)
          console.log(`tokenQty: ${tokenQty}`)

          if (tokenQty === expectedBalance) {
            thisConsumer.walletServiceWorking = true
          }
        }

        consumerReport.push(thisConsumer)
      }

      return consumerReport
    } catch (err) {
      console.error('Error in interrogateConsumers()', err)
      throw err
    }
  }

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

  // Load a random amount of PSF tokens to the test wallet at index 1 of the HD
  // wallet.
  async loadTestWallet () {
    try {
      const wallet = this.adapters.wallet.bchWallet

      const keyPair = await wallet.getKeyPair(1)
      // console.log('keyPair: ', keyPair)
      const address = keyPair.cashAddress

      const balance = await wallet.getBalance()
      console.log('balance: ', balance)
      const tokens = await wallet.listTokens()
      console.log('tokens: ', tokens)
      // const bchAddr = wallet.walletInfo.cashAddress
      // console.log('bchAddr: ', bchAddr)

      const qty = wallet.bchjs.Util.floor8(Math.random() / 1000)
      console.log(`Sending ${qty} PSF tokens.`)

      await wallet.initialize()
      const receiver = {
        address,
        tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
        qty
      }
      const txid = await wallet.sendTokens(receiver, 3)
      console.log(`Sent ${qty} PSF tokens. TXID: ${txid}`)

      return qty
    } catch (err) {
      console.error('Error in loadTestWallet()')
      throw err
    }
  }

  // Sweep any tokens or BCH from the test wallet at index 1 of the HD wallet.
  async sweepTestWallet () {
    try {
      // Get key pair for receiving wallet (index 0)
      const wallet = this.adapters.wallet.bchWallet
      const walletWif = wallet.walletInfo.privateKey
      const receiverAddr = wallet.walletInfo.cashAddress

      // Get key pair for test wallet (index 1)
      const keyPair = await wallet.getKeyPair(1)
      const wif = keyPair.wif

      // Instantiate the sweeper library.
      const sweeper = new this.BchTokenSweep(
        wif,
        walletWif,
        wallet
      )
      await sweeper.populateObjectFromNetwork()

      // Generate the sweep transaction.
      const hex = await sweeper.sweepTo(receiverAddr)

      // Broadcast the transaction.
      const txid = await wallet.broadcast({ hex })
      console.log(`Test wallet swept. TXID: ${txid}`)

      return txid
    } catch (err) {
      console.error('Error in sweepTestWallet()')
      throw err
    }
  }
}

export default MetricUseCases
