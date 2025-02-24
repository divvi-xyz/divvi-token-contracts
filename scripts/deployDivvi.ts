import { loadSecret } from '@valora/secrets-loader'
import hre from 'hardhat'
import yargs from 'yargs'

async function getConfig() {
  //
  // Load secrets from Secrets Manager and inject into process.env.
  //
  const secretNames = process.env.SECRET_NAMES?.split(',') ?? []
  for (const secretName of secretNames) {
    Object.assign(process.env, await loadSecret(secretName))
  }

  const argv = await yargs
    .env('')
    .option('deploy-salt', {
      description: 'Salt to use for CREATE2 deployments',
      type: 'string',
      demandOption: true,
    })
    .option('owner-address', {
      description: 'Address of the address to use as owner',
      type: 'string',
      demandOption: true,
    }).argv

  return {
    deploySalt: argv['deploy-salt'],
    ownerAddress: argv['owner-address'],
  }
}

const CONTRACT_NAME = 'Divvi'

const ONE_DAY = 60 * 60 * 24

async function main() {
  const config = await getConfig()
  const Divvi = await hre.ethers.getContractFactory(CONTRACT_NAME)

  const ownerAddress = process.env.SAFE_OWNER_ADDRESS
  if (!ownerAddress) {
    throw new Error('No owner address configured!')
  }

  let address: string

  if (hre.network.name === 'mainnet') {
    console.log(`Deploying ${CONTRACT_NAME} with OpenZeppelin Defender`)
    const result = await hre.defender.deployProxy(
      Divvi,
      [config.ownerAddress, ONE_DAY],
      { salt: config.deploySalt },
    )
    address = await result.getAddress()
  } else {
    console.log(`Deploying ${CONTRACT_NAME} with local signer`)
    const result = await hre.upgrades.deployProxy(
      Divvi,
      [config.ownerAddress, ONE_DAY],
      { salt: config.deploySalt },
    )
    address = await result.getAddress()
  }

  console.log('\nTo verify the contract, run:')
  console.log(`yarn hardhat verify ${address} --network ${hre.network.name}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
