/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../../common";
import type {
  Errors,
  ErrorsInterface,
} from "../../../../../lens-modules/contracts/libraries/constants/Errors";

const _abi = [
  {
    inputs: [],
    name: "ActionNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadyEnabled",
    type: "error",
  },
  {
    inputs: [],
    name: "ArrayMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "Blocked",
    type: "error",
  },
  {
    inputs: [],
    name: "CallerNotFollowNFT",
    type: "error",
  },
  {
    inputs: [],
    name: "CannotInitImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "DisablingAlreadyTriggered",
    type: "error",
  },
  {
    inputs: [],
    name: "EmergencyAdminCanOnlyPauseFurther",
    type: "error",
  },
  {
    inputs: [],
    name: "ExecutorInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "GuardianEnabled",
    type: "error",
  },
  {
    inputs: [],
    name: "InitParamsInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "Initialized",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidParameter",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPointedPub",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidReferrer",
    type: "error",
  },
  {
    inputs: [],
    name: "NonERC721ReceiverImplementer",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "NotEOA",
    type: "error",
  },
  {
    inputs: [],
    name: "NotFollowing",
    type: "error",
  },
  {
    inputs: [],
    name: "NotGovernance",
    type: "error",
  },
  {
    inputs: [],
    name: "NotGovernanceOrEmergencyAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotHub",
    type: "error",
  },
  {
    inputs: [],
    name: "NotMigrationAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotOwnerOrApproved",
    type: "error",
  },
  {
    inputs: [],
    name: "NotProfileOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "NotRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "NotWhitelisted",
    type: "error",
  },
  {
    inputs: [],
    name: "Paused",
    type: "error",
  },
  {
    inputs: [],
    name: "PublicationDoesNotExist",
    type: "error",
  },
  {
    inputs: [],
    name: "PublishingPaused",
    type: "error",
  },
  {
    inputs: [],
    name: "SelfBlock",
    type: "error",
  },
  {
    inputs: [],
    name: "SelfFollow",
    type: "error",
  },
  {
    inputs: [],
    name: "SignatureExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "SignatureInvalid",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenDoesNotExist",
    type: "error",
  },
] as const;

const _bytecode =
  "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea264697066735822122028e7ca3d05f0c972d81e6f9a413c066a74a4ed5e020991f80dcbff5d0bbe37fe64736f6c63430008170033";

type ErrorsConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ErrorsConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Errors__factory extends ContractFactory {
  constructor(...args: ErrorsConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      Errors & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Errors__factory {
    return super.connect(runner) as Errors__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ErrorsInterface {
    return new Interface(_abi) as ErrorsInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Errors {
    return new Contract(address, _abi, runner) as unknown as Errors;
  }
}
