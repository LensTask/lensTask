// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IPostAction } from "lens-contracts/contracts/extensions/actions/ActionHub.sol";
import { KeyValue } from "lens-contracts/contracts/core/types/Types.sol";
import { BasePostAction } from "lens-contracts/contracts/actions/post/base/BasePostAction.sol";
import { IFeed } from "lens-contracts/contracts/core/interfaces/IFeed.sol";
import { AcceptedAnswerNFT } from "./AcceptedAnswerNFT.sol";

/**
 * @title BountyPostAction
 * @notice A post action that allows the creator of a post to assign an NFT to a selected
 *         commenter on the post.
 */
contract BountyPostAction is BasePostAction {
    // feed => postId => nftAddress
    mapping(address => mapping(uint256 => address)) private _bountyNftAddress;

    // feed => postId => bountyWinnerAddress
    mapping(address => mapping(uint256 => address)) private _bountyWinnerAddress;

    /**
      * @notice Configures the BountyPostAction Action for a given post.
      * @param originalMsgSender The address initiating the configuration via the ActionHub. Must be post author.
      * @param feed The address of the feed contract where the post exists.
      * @param postId The ID of the post being configured.
      * @param params List of key-value pairs where the `value` of the first element is 
      *        the ABI-encoded address of the NFT contract.
      * @return bytes Empty bytes.
     */
    function _configure(
        address originalMsgSender,
        address feed,
        uint256 postId,
        KeyValue[] calldata params
    ) internal override returns (bytes memory) {
        require(
            originalMsgSender == IFeed(feed).getPostAuthor(postId),
            "Only author can configure"
        );
        
        _bountyNftAddress[feed][postId] = abi.decode(params[0].value, (address));

        return "";
    }

    /**
     * @notice Assigns the winner of the bounty on a given post
     * @param originalMsgSender The address initiating the action via the ActionHub.
     * @param feed The address of the feed contract where the post exists.
     * @param postId The ID of the post being executed on.
     * @param params Array of key-value pairs. Expected to contain at least one element,
     *        where the `value` of the first element is the ABI-encoded boolean vote.
     * @return bytes Empty bytes.
     * Requirements:
     * - The `originalMsgSender` must be the author of this `postId`.
     * - The `postId` must have an associated NFT bounty address.
     * - The winner of the bounty has not been set before.
     * - `params` must not be empty and the first element's value must be abi-decodable as an address.
     */
    function _execute(
        address originalMsgSender,
        address feed,
        uint256 postId,
        KeyValue[] calldata params
    ) external override returns (bytes memory) {
        require(_bountyNftAddress[feed][postId] != 0, "No NFT address configured");
        require(_bountyWinnerAddress[feed][postId] == 0, "Bounty winner already assigned");

        address bountyWinner = abi.decode(params[0].value, (address));

        _bountyWinnerAddress[feed][postId] = bountyWinner;

        AcceptedAnswerNFT(_bountyNftAddress[feed][postId]).mint(bountyWinner);

        return "";
    }

    /**
     * @notice Gets the bounty NFT contract address for a specific post.
     * @param feed The address of the feed contract where the post exists.
     * @param postId The ID of the post to get the bounty NFT address for.
     * @return address The bounty NFT contract address.
     */
    function getBountyNft(address feed, uint256 postId) external view returns (address) {
        return _bountyNftAddress[feed][postId];
    }

    /**
     * @notice Gets the winner of the bounty NFT for a specific post.
     * @param feed The address of the feed contract where the post exists.
     * @param postId The ID of the post to get the bounty NFT winner for.
     * @return address The bounty NFT winner.
     */
    function getBountyWinner(address feed, uint256 postId) external view returns (address) {
        return _bountyWinnerAddress[feed][postId];
    }
}