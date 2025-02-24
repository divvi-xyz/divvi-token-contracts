import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: ['hardhat.config.ts', 'scripts/**/*.ts', 'test/**/*.ts'],
  ignoreDependencies: [
    '@openzeppelin/contracts',
    '@openzeppelin/contracts-upgradeable',
  ],
}

export default config
