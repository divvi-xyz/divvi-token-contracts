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
    .option('proxy-address', {
      description:
        'Address of the proxy contract whose implementation to upgrade',
      type: 'string',
      demandOption: true,
    }).argv

  return {
    deploySalt: argv['deploy-salt'],
    proxyAddress: argv['proxy-address'],
  }
}

const CONTRACT_NAME = 'Divvi'

async function main() {
  const config = await getConfig()
  const Divvi = await hre.ethers.getContractFactory(CONTRACT_NAME)

  if (hre.network.name === 'mainnet') {
    console.log(`Upgrading ${CONTRACT_NAME} with OpenZeppelin Defender`)

    await hre.defender.proposeUpgradeWithApproval(config.proxyAddress, Divvi, {
      salt: config.deploySalt,
    })
  } else {
    console.log(`Upgrading ${CONTRACT_NAME} with local signer`)

    await hre.upgrades.upgradeProxy(config.proxyAddress, Divvi)
  }

  console.log(
    '\nTo verify the contract, get the proxy deploy address from OpenZeppelin and run:',
  )
  console.log(
    `yarn hardhat verify ${config.proxyAddress} --network ${hre.network.name}`,
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
