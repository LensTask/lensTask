// SPDX-License-Identifier: UNLICENSED
// Copyright (C) 2024 Lens Labs. All Rights Reserved.
pragma solidity ^0.8.26;

import {IAccessControl} from "lens-contracts/contracts/core/interfaces/IAccessControl.sol";
import {Feed} from "lens-contracts/contracts/core/primitives/feed/Feed.sol";
import {RuleChange, KeyValue} from "lens-contracts/contracts/core/types/Types.sol";
import {BeaconProxy} from "lens-contracts/contracts/core/upgradeability/BeaconProxy.sol";
import {ProxyAdmin} from "lens-contracts/contracts/core/upgradeability/ProxyAdmin.sol";
import {PrimitiveFactory} from "lens-contracts/contracts/extensions/factories/PrimitiveFactory.sol";

contract FeedFactory is PrimitiveFactory {
    event Lens_FeedFactory_Deployment(address indexed feed, string metadataURI);

    constructor(address primitiveBeacon, address proxyAdminLock) PrimitiveFactory(primitiveBeacon, proxyAdminLock) {}

    function deployFeed(
        string memory metadataURI,
        IAccessControl accessControl,
        address proxyAdminOwner,
        RuleChange[] calldata ruleChanges,
        KeyValue[] calldata extraData
    ) external returns (address) {
        address proxyAdmin = address(new ProxyAdmin(proxyAdminOwner, PROXY_ADMIN_LOCK));
        Feed feed = Feed(address(new BeaconProxy(proxyAdmin, PRIMITIVE_BEACON)));
        feed.initialize(metadataURI, TEMPORARY_ACCESS_CONTROL);
        feed.changeFeedRules(ruleChanges);
        feed.setExtraData(extraData);
        feed.setAccessControl(accessControl);
        emit Lens_FeedFactory_Deployment(address(feed), metadataURI);
        return address(feed);
    }
}
