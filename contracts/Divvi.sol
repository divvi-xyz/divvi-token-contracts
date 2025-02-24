// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {AccessControlDefaultAdminRulesUpgradeable} from '@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract DivviToken is
  Initializable,
  ERC20Upgradeable,
  AccessControlDefaultAdminRulesUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
  bool public upgradesDisabled;

  error UpgradesDisabled();

  function initialize(address owner, uint48 transferDelay) public initializer {
    __ERC20_init('Divvi', 'DIVVI');
    __AccessControlDefaultAdminRules_init(transferDelay, owner);
    __UUPSUpgradeable_init();
  }

  /// @notice Mints tokens, callable only by MINTER_ROLE
  function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  function _authorizeUpgrade(
    address
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
    if (upgradesDisabled) revert UpgradesDisabled();
  }

  function disableUpgrades() external onlyRole(DEFAULT_ADMIN_ROLE) {
    upgradesDisabled = true;
  }
}
