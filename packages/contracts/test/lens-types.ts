// Manually defined TypeScript mappings for Lens Protocol's Types.sol
// File: lens-types.ts

/**
 * Mimics the generated Types namespace from Lens Protocol's Types.sol
 */
export namespace Types {
  /**
   * Matches the Solidity enum:
   * enum PublicationType { Nonexistent, Post, Comment, Mirror, Quote }
   */
  export enum PublicationType {
    Nonexistent = 0,
    Post = 1,
    Comment = 2,
    Mirror = 3,
    Quote = 4,
  }

  /**
   * Matches the Solidity struct:
   * struct ProcessActionParams {
   *   uint256 publicationActedProfileId;
   *   uint256 publicationActedId;
   *   uint256 actorProfileId;
   *   address actorProfileOwner;
   *   address transactionExecutor;
   *   uint256[] referrerProfileIds;
   *   uint256[] referrerPubIds;
   *   Types.PublicationType[] referrerPubTypes;
   *   bytes actionModuleData;
   * }
   */
  export interface ProcessActionParams {
    publicationActedProfileId: bigint;
    publicationActedId: bigint;
    actorProfileId: bigint;
    actorProfileOwner: string;
    transactionExecutor: string;
    referrerProfileIds: bigint[];
    referrerPubIds: bigint[];
    referrerPubTypes: PublicationType[];
    actionModuleData: string;
  }

  // Add more struct mappings as needed:
  // export interface OtherStruct { ... }
  
  // Alias for compatibility with tests referencing ProcessActionParamsStruct
  export type ProcessActionParamsStruct = ProcessActionParams;
}