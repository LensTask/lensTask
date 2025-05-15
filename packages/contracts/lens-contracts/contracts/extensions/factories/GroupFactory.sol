// SPDX-License-Identifier: UNLICENSED
// Copyright (C) 2024 Lens Labs. All Rights Reserved.
pragma solidity ^0.8.26;

import {IAccessControl} from "lens-contracts/contracts/core/interfaces/IAccessControl.sol";
import {Group} from "lens-contracts/contracts/core/primitives/group/Group.sol";
import {RuleChange, RuleProcessingParams, KeyValue} from "lens-contracts/contracts/core/types/Types.sol";
import {BeaconProxy} from "lens-contracts/contracts/core/upgradeability/BeaconProxy.sol";
import {ProxyAdmin} from "lens-contracts/contracts/core/upgradeability/ProxyAdmin.sol";
import {PrimitiveFactory} from "lens-contracts/contracts/extensions/factories/PrimitiveFactory.sol";

contract GroupFactory is PrimitiveFactory {
    event Lens_GroupFactory_Deployment(address indexed group, string metadataURI);

    constructor(address primitiveBeacon, address proxyAdminLock) PrimitiveFactory(primitiveBeacon, proxyAdminLock) {}

    function deployGroup(
        string memory metadataURI,
        IAccessControl accessControl,
        address proxyAdminOwner,
        RuleChange[] calldata ruleChanges,
        KeyValue[] calldata extraData,
        address foundingMember,
        KeyValue[] calldata addFoundingMemberCustomParams
    ) external returns (address) {
        address proxyAdmin = address(new ProxyAdmin(proxyAdminOwner, PROXY_ADMIN_LOCK));
        Group group = Group(address(new BeaconProxy(proxyAdmin, PRIMITIVE_BEACON)));
        group.initialize(metadataURI, TEMPORARY_ACCESS_CONTROL);
        if (foundingMember != address(0)) {
            group.addMember(foundingMember, addFoundingMemberCustomParams, new RuleProcessingParams[](0));
        }
        group.changeGroupRules(ruleChanges);
        group.setExtraData(extraData);
        group.setAccessControl(accessControl);
        emit Lens_GroupFactory_Deployment(address(group), metadataURI);
        return address(group);
    }
}
