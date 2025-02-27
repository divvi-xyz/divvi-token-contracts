import { mine } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'

const CONTRACT_NAME = 'DivviToken'
const mockAccount1 = '0x0000000000000000000000000000000000000001'

describe(CONTRACT_NAME, () => {
  async function deployDivviContract() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, minterAccount] = await hre.ethers.getSigners()

    const ownerAddress = await owner.getAddress()

    const Divvi = await hre.ethers.getContractFactory(CONTRACT_NAME)
    const contract = await hre.upgrades.deployProxy(Divvi, [ownerAddress, 0], {
      kind: 'uups',
    })
    await contract.waitForDeployment()

    await contract.grantRole(
      ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE')),
      await minterAccount.getAddress(),
    )

    return {
      contract,
      contractAddress: await contract.getAddress(),
      owner,
      otherAccount,
      minterAccount,
    }
  }

  async function upgradeDivviContract(proxyAddress: string) {
    const Divvi = await hre.ethers.getContractFactory(CONTRACT_NAME)
    const contract = await hre.upgrades.upgradeProxy(proxyAddress, Divvi, {})
    await contract.waitForDeployment()
  }

  describe('metadata', () => {
    let divviContract: ethers.Contract

    beforeEach(async function () {
      const { contract } = await deployDivviContract()
      divviContract = contract
    })

    it('should return correct name', async function () {
      expect(await divviContract.name()).to.eql('Divvi')
    })

    it('should return correct symbol', async function () {
      expect(await divviContract.symbol()).to.eql('DIVVI')
    })

    it('should return correct decimals', async function () {
      expect(await divviContract.decimals()).to.eql(18n)
    })
  })

  describe('permissions', () => {
    it('deploys', async function () {
      const { contract } = await deployDivviContract()
      expect(contract).to.exist
    })

    it('should grant DEFAULT_ADMIN_ROLE to owner', async function () {
      const { contract, owner } = await deployDivviContract()
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE()
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true
    })

    it('should allow minter to mint tokens', async function () {
      const { contract, minterAccount } = await deployDivviContract()

      const contractAsMinter = contract.connect(
        minterAccount,
      ) as typeof contract

      await contractAsMinter.mint(mockAccount1, 1000)

      expect(await contract.balanceOf(mockAccount1)).to.equal(1000)
    })

    it('should prevent non-minters from minting', async function () {
      const { contract, otherAccount } = await deployDivviContract()

      const contractAsOtherAccount = contract.connect(
        otherAccount,
      ) as typeof contract

      await expect(
        contractAsOtherAccount.mint(mockAccount1, 1000),
      ).to.be.revertedWithCustomError(
        contract,
        'AccessControlUnauthorizedAccount',
      )
    })

    it('owner can upgrade', async function () {
      const { contractAddress } = await deployDivviContract()
      await expect(upgradeDivviContract(contractAddress)).to.be.fulfilled
    })

    it('non-owner cannot upgrade', async function () {
      const { contract, otherAccount } = await deployDivviContract()

      const DivviV2 = await hre.ethers.getContractFactory(CONTRACT_NAME)
      DivviV2.connect(otherAccount)
      const newContract = await DivviV2.deploy()
      await newContract.waitForDeployment()
      const newContractAddress = await newContract.getAddress()

      const contractAsOtherAccount = contract.connect(
        otherAccount,
      ) as typeof contract
      await expect(
        contractAsOtherAccount.upgradeToAndCall(newContractAddress, '0x'),
      ).to.be.rejectedWith('AccessControlUnauthorizedAccount')
    })

    it('DEFAULT_ADMIN_ROLE transfer works with delay', async function () {
      const { contract, owner, otherAccount } = await deployDivviContract()
      const ownerAddress = await owner.getAddress()
      const otherAddress = await otherAccount.getAddress()

      await expect(contract.defaultAdmin()).to.eventually.equal(ownerAddress)

      // Need to mine some blocks before changing the delay
      mine(10, { interval: 1000 })
      await contract.changeDefaultAdminDelay(100)
      await contract.beginDefaultAdminTransfer(otherAddress)

      const contractAsOtherAccount = contract.connect(
        otherAccount,
      ) as typeof contract
      await expect(
        contractAsOtherAccount.acceptDefaultAdminTransfer(),
      ).to.be.rejectedWith('AccessControlEnforcedDefaultAdminDelay')

      // Wait out the delay
      mine(10, { interval: 1000 })

      await contractAsOtherAccount.acceptDefaultAdminTransfer()
      expect(await contract.defaultAdmin()).to.equal(otherAddress)
    })
  })
})
