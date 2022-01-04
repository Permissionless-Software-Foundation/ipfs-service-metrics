# ipfs-service-metrics

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Forked from [ipfs-service-provider](https://github.com/Permissionless-Software-Foundation/ipfs-service-provider). This is app collects metric data on Circuit Relays and Service Providers using [ipfs-coord](https://www.npmjs.com/package/ipfs-coord), and records that data to the [P2WDB](https://github.com/Permissionless-Software-Foundation/ipfs-p2wdb-service).

## Requirements

- node **^14.18.2**
- npm **^8.3.0**
- Docker **^20.10.8**
- Docker Compose **^1.27.4**

## Installation

### Development Environment

**Note:** This software now uses an external go-ipfs IPFS node. The instructions below have not been updated to reflect this.

A development environment will allow you modify the code on-the-fly and contribute to the code base of this repository. [PM2](https://www.npmjs.com/package/pm2) is recommended for running this code base as an IPFS Circuit Relay.

- [Video: Installing ipfs-service-provider](https://youtu.be/Z0NsboIVN44)
- [Step-by-step installation instructions](https://gist.github.com/christroutner/3304a71d4c12a3a3e1664a438f64d9d0)

```bash
git clone https://github.com/Permissionless-Software-Foundation/ipfs-service-metrics
cd ipfs-service-metrics
./install-mongo-sh
npm install
./ipfs-service-metrics.sh
```

## License

[MIT](./LICENSE.md)
