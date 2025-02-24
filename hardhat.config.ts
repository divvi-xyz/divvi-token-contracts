import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox-viem'
import '@openzeppelin/hardhat-upgrades'
import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import { HDAccountsUserConfig } from 'hardhat/types'

dotenv.config()

const accounts: HDAccountsUserConfig = {
  mnemonic:
    process.env.MNEMONIC ||
    'test test test test test test test test test test test junk',
}

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  defender: {
    apiKey: process.env.DEFENDER_API_KEY!,
    apiSecret: process.env.DEFENDER_API_SECRET!,
  },
  networks: {
    mainnet: {
      url: process.env.ETHEREUM_RPC_URL || 'https://cloudflare-eth.com',
      accounts,
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY!,
  },
  sourcify: {
    enabled: true,
  },
}

export default config
