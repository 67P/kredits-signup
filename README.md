# Kredits signup oracle

A Kredits oracle to signup users with their GitHub account.

## Installation

    $ npm install

## Create a local wallet

    $ node scripts/create-wallet.js

## Run the oracle

    WALLET_PASSWORD=[your wallet password] \
    ETH_RPC_URL=http://localhost:7545 \
    APM_DOMAIN=aragonpm.eth \
    GITHUB_KEY=[your github app key] \
    GITHUB_SECRET=[your github app secred] \
    DAO_ADDRESS=[your kredits address] \
    node index.js


Make sure that the oracle wallet has enought funds and that it has the permission to `MANAGE_CONTRIBUTORS_ROLE` on your DAO. 
The `aragon` CLI can be used to grant the permission. 

    $ aragon dao acl grant [your DAO address] [your contributor app address] MANAGE_CONTRIBUTORS_ROLE [your wallet address]

To get the contributor app address use `aragon dao apps`

    $ aragon dao apps [your DAO address]
