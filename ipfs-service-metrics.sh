#!/bin/bash

# Ports
export PORT=5005 # REST API port
export IPFS_TCP_PORT=5868
export IPFS_WS_PORT=5869

#export ENABLE_CIRCUIT_RELAY=1

# Production database connection string.
#export DBURL=mongodb://localhost:27017/bch-service-dev

export COORD_NAME=ipfs-service-metrics
export MNEMONIC="dry shock cinnamon fossil portion quit toy leaf lottery move repair absurd"

export DEBUG_LEVEL=1

npm start
