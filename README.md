# ARCIUM-A.W.R.S
Anonymous Wallet Reputation System 

''' bash 
This project helps us prove that we are reputable and trustworthy without the need to revealing our wallet addresses.
'''
## Core idea

- Users get a reputation score based on their on chain wallet behavior but do not reveal their wallet addresses publicly.

- This reputation being calculated involves involvement with past or previous DAO participation, Airdrops, and gated DEFI platforms.

- The reputation calculated is tied to activities and not Identity or how old the wallet is.

- It is hard to fake high reputation score without a long term behavior or activity, this is know as Sybil resistance.

- Ability to prove your ZK score without revealing score or wallet publicly.

## Why use ARCIUM?

Basically, ARCIUM handles the private Computation and reputation logic securely.

## Why this topic?

In web3, it's commonly forced on people to Choose between privacy and reputation. Making wallets reveal their full transaction history before proving trustworthy, which in turn creates privacy leaks which deters honest users from participating in DAOs, airdrop and even DEFI lending activities.

## What it solves.

- As the core idea section has already highlighted most points. This project generates verifiable reputation scores based on private wallet activity and avoid linking their identity to a specific wallet or past behavior.

- Basically helps developers to integrate shadow score into their apps.With the open source front end and scoring template.

## How it works

- Connect wallet

- ARCIUM receives the public key and get he's past activity off chain(using alchemy or covalent etc)

- A private session in created in a enclave which is on chain activity + frequency. Reading the types of interactions; DAOs, NFTs, Dexes, voting records, bridge and even scam avoidances.

# Note
No raw data ever leaves the enclave. The enclave is returns the output; reputation level (bronze/silver/gold) and optionally a ZK proof or hash commitment which can be shared by the user as proof to dapps without revealing their wallet addresses.


## Use cases 

- Anonymous DAO voting 

- Airdrop whitelisting

- NFT whitelisting 

- Definitely risk scoring 

- Onboarding filters (no bots allowed)
