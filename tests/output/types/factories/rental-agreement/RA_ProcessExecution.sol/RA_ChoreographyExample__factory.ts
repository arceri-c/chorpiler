/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  RA_ChoreographyExample,
  RA_ChoreographyExampleInterface,
} from "../../../rental-agreement/RA_ProcessExecution.sol/RA_ChoreographyExample";

const _abi = [
  {
    inputs: [
      {
        internalType: "address[3]",
        name: "_participants",
        type: "address[3]",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "enact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "items",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "participants",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_items",
        type: "bool",
      },
    ],
    name: "setItems",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenState",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405260016000556004805460ff1916905534801561001f57600080fd5b5060405161043838038061043883398101604081905261003e916100db565b61004b6001826003610052565b505061016d565b826003810192821561009a579160200282015b8281111561009a57825182546001600160a01b0319166001600160a01b03909116178255602090920191600190910190610065565b506100a69291506100aa565b5090565b5b808211156100a657600081556001016100ab565b80516001600160a01b03811681146100d657600080fd5b919050565b6000606082840312156100ed57600080fd5b82601f8301126100fc57600080fd5b604051606081016001600160401b038111828210171561012c57634e487b7160e01b600052604160045260246000fd5b60405280606084018581111561014157600080fd5b845b8181101561016257610154816100bf565b835260209283019201610143565b509195945050505050565b6102bc8061017c6000396000f3fe608060405234801561001057600080fd5b50600436106100575760003560e01c80632115e67e1461005c57806335c1d3491461007f5780635e9cc2a9146100af578063c06fad06146100c2578063e90dd9e2146100df575b600080fd5b61007d61006a366004610244565b6004805460ff1916911515919091179055565b005b61009261008d36600461026d565b6100f6565b6040516001600160a01b0390911681526020015b60405180910390f35b61007d6100bd36600461026d565b610116565b6004546100cf9060ff1681565b60405190151581526020016100a6565b6100e860005481565b6040519081526020016100a6565b6001816003811061010657600080fd5b01546001600160a01b0316905081565b6000545b801561023e57806001166001141561015e5781600114801561014957506001600001546001600160a01b031633145b1561015e57600091506001191660061761011a565b806002166002141561019b57816002148015610186575060018001546001600160a01b031633145b1561019b57600091506002191660081761011a565b80600416600414156101d8578160031480156101c3575060018001546001600160a01b031633145b156101d857600091506004191660101761011a565b806020166020141561020e57816004148015610200575060018001546001600160a01b031633145b1561020e576020191661023e565b8060061660061415610226576006191660201761011a565b806018166018141561023e576018191660201761011a565b60005550565b60006020828403121561025657600080fd5b8135801515811461026657600080fd5b9392505050565b60006020828403121561027f57600080fd5b503591905056fea2646970667358221220447c2312a97848f9c9b067604b5a263af3aeea965f487ef04c7795fbf01cacb764736f6c63430008090033";

type RA_ChoreographyExampleConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: RA_ChoreographyExampleConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class RA_ChoreographyExample__factory extends ContractFactory {
  constructor(...args: RA_ChoreographyExampleConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _participants: [AddressLike, AddressLike, AddressLike],
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_participants, overrides || {});
  }
  override deploy(
    _participants: [AddressLike, AddressLike, AddressLike],
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_participants, overrides || {}) as Promise<
      RA_ChoreographyExample & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): RA_ChoreographyExample__factory {
    return super.connect(runner) as RA_ChoreographyExample__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): RA_ChoreographyExampleInterface {
    return new Interface(_abi) as RA_ChoreographyExampleInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): RA_ChoreographyExample {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as RA_ChoreographyExample;
  }
}
