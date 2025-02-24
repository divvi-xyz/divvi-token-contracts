# divvi-token-contracts

Repository containing contracts relating to the DIVVI token.

## Deployment Plan

The `Divvi` contract is enabled to support arbitrary _roles-based permissions_. Currently,
semantics exist for only two roles, `DEFAULT_ADMIN_ROLE` and `MINTER_ROLE`.

- `DEFAULT_ADMIN_ROLE` is able to manage permissions (assigning/revoking addresses to roles), and is the sole address able to authorize contract upgrades. Only one address may possess this role.

- `MINTER_ROLE` has access to privileged methods, namely, those that mint DIVVI tokens.

On deploy, the `DEFAULT_ADMIN_ROLE` is granted to the Safe Multisig wallet we've configured. Since the `DEFAULT_ADMIN_ROLE` possesses a lot of control over contract permissions, the contract is
set up to enable a handful of security measures around transferring the `DEFAULT_ADMIN_ROLE`. These measures include:

- Requiring a two step process of initiating transfer, and accepting it on the new `DEFAULT_ADMIN_ROLE` holder's address.
- Enabling a configurable delay between transfer being initiated, and the new `DEFAULT_ADMIN_ROLE` address being able to accept it.

By default, the transfer delay is set to one day. After deploy, the following steps should be taken. See the Operations section below.

- Safe wallet multisig calls `grantRole` with `keccak256("MINTER_ROLE")` as role on the HSM address to be used in the backend.
- Safe wallet multisig calls `changeDefaultAdminDelay` to set a larger transfer delay, if desired.

### Operational Wallets

For the purposes of deploying and upgrading, we maintain a number of operational wallets. 

For Mainnet deplyments and upgrades, we maintain two Safe wallets. The first of these wallets is
used strictly for proxy and implementation deployment, and may be shared among other services. The second wallet will act as the "owner" of the contract and can _upgrade_ the contract, and _manage roles_.

Additionally, we maintain another Safe wallet for the Minter role, which will be used to mint tokens.

#### Mainnet

For Mainnet, the Safe addresses are as follows:

- Shared Deployer Safe: [0x215bde0Ec16d1358139F624d522361c431413754](https://app.safe.global/home?safe=eth:0x215bde0Ec16d1358139F624d522361c431413754)
- Owner Safe: [0x056E510DD2aDf29c068F84C8657D6dE80B19F139](https://app.safe.global/home?safe=eth:0x056E510DD2aDf29c068F84C8657D6dE80B19F139)
- Minter Safe: [0x64f3196e4F8C7F3e4978bc5F79A043A49bb20fE2](https://app.safe.global/home?safe=eth:0x64f3196e4F8C7F3e4978bc5F79A043A49bb20fE2)

### Deployment and Upgrade Process

#### Mainnet

We use [OpenZeppelin Defender](https://www.openzeppelin.com/defender) to manage deployments and upgrades on Mainnet. Before beginning a deployment, make sure that your `.env` file is set up correctly. Namely, make sure to get the `DEFENDER_API_KEY`, `DEFENDER_API_SECRET`, `ETHERSCAN_API_KEY`, `ETHEREUM_RPC_URL` values from GSM and copy them in. (Ideally we could inject these config values into Hardhat automatically, but we haven't found a way to do that.) Also include `OWNER_ADDRESS` to set the initial owner for the proxy. This should be the _Owner Safe_ address listed above.

💡 For a smooth experience ensure you've been invited to Defender for Divvi and are added as a signer to the Deployer and Owner safes.

To deploy for the first time, run:

```
yarn hardhat run scripts/deployDivvi.ts
```

This will initiate a proxy deployment on OpenZeppelin Defender, which requires two steps to complete - the Shared Deployer Safe wallet must sign transactions to deploy _both_ the proxy and implementation contracts. Find those steps in [Defender Dashboard](https://defender.openzeppelin.com/v2/), in the "Deploy" section for the "Celo" production environment. It deploys the implementation contract first, then the proxy one. To approve the deployment, open the deployment details and click a button to open the Safe App. If the particular Safe requires multiple signatures, ask fellow engineers for additional ones in Slack.

After both deployments are signed and completed, you should see the output in your terminal with a command to run to verify both the proxy and implementation contracts on the block explorers.

To upgrade, ensure that the `PROXY_ADDRESS` field is filled out in your `.env` file, and run:

```
yarn hardhat run scripts/upgradeDivvi.ts
```

This will initiate a proxy upgrade on OpenZeppelin Defender, which also requires two steps to complete. First, the Deployer Safe wallet must sign a transaction to deploy the new implementation contract.
Once this is done, the _Owner_ Safe wallet must sign a transaction to upgrade the implementation of the proxy. After this is done, you should see output in your terminal with a command to run to verify
both the proxy and implementation contracts on the block explorers.

### Metadata

Metadata about proxy and implementation deployments is automatically generated and stored in the `.openzeppelin/` directory, which should be checked into version control.

## Operations

### DEFAULT_ADMIN_ROLE Transfer Process

💡 For a smooth experience ensure you've been added as a signer to both _Shared Deployer Safe_ and _Owner Safe_ listed above. All contract calls are initiated from the Safe UI using the "New Transaction" button.

- Current admin address calls `beginDefaultAdminTransfer` on the contract, with the address of the desired new `DEFAULT_ADMIN_ROLE`.
- Safe wallet multisig calls `acceptDefaultAdminTransfer` on the contract, transferring the `DEFAULT_ADMIN_ROLE`. Note that the proposed new `DEFAULT_ADMIN_ROLE` holder must wait out the transfer delay before calling this method.
- At any point after initiating the transfer, but before the proposed recipient accepts, the current `DEFAULT_ADMIN_ROLE` holder can call `cancelDefaultAdminTransfer` to revoke the transfer.

### Granting `MINTER_ROLE`

- Current admin address calls `grantRole` with `keccak256("MINTER_ROLE")`and address to be granted role.

### Revoking `MINTER_ROLE`

- Current admin address calls `revokeRole` with `keccak256("MINTER_ROLE")`and address to have role revoked.

### Changing `defaultAdminDelay`

- Current admin address calls `changeDefaultAdminDelay` with the delay to set in number of seconds.
- At any point before the _current_ `defaultAdminDelay` period elapses, admin address can call `rollbackDefaultAdminDelay` to cancel the update.
