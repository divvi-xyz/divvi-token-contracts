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

  mapping(address => bool) private _hasTransferPermission;
  bool private _requireTransferPermission;

  error TransferNotPermitted();

  modifier onlyPermittedToTransfer(address account) {
    if (!isPermittedToTransfer(account)) revert TransferNotPermitted();
    _;
  }

  function initialize(address owner, uint48 transferDelay) public initializer {
    __ERC20_init('Divvi', 'DIVVI');
    __ERC20Permit_init('Divvi');
    __AccessControlDefaultAdminRules_init(transferDelay, owner);
    __UUPSUpgradeable_init();

    _requireTransferPermission = true;
  }

  function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  function transfer(
    address recipient,
    uint256 amount
  ) public override onlyPermittedToTransfer(msg.sender) returns (bool) {
    return super.transfer(recipient, amount);
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public override onlyPermittedToTransfer(sender) returns (bool) {
    return super.transferFrom(sender, recipient, amount);
  }

  function setRequireTransferPermission(
    bool status
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _requireTransferPermission = status;
  }

  function setTransferPermission(
    address account,
    bool status
  ) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _hasTransferPermission[account] = status;
  }

  function isPermittedToTransfer(address account) public view returns (bool) {
    return !_requireTransferPermission || _hasTransferPermission[account];
  }

  function _authorizeUpgrade(
    address
  ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {} // solhint-disable-line no-empty-blocks
}
