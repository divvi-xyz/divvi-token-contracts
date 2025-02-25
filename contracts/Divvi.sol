// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20PermitUpgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol';
import {AccessControlDefaultAdminRulesUpgradeable} from '@openzeppelin/contracts-upgradeable/access/extensions/AccessControlDefaultAdminRulesUpgradeable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

contract DivviToken is
  ERC20PermitUpgradeable,
  AccessControlDefaultAdminRulesUpgradeable,
  UUPSUpgradeable
{
  bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

  function initialize(address owner, uint48 transferDelay) public initializer {
    __ERC20_init('Divvi', 'DIVVI');
    __AccessControlDefaultAdminRules_init(transferDelay, owner);
    __UUPSUpgradeable_init();
  }

  function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  function _authorizeUpgrade(
    address
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {} // solhint-disable-line no-empty-blocks
}
