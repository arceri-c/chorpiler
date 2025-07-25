/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface PIZZA_ProcessExecutionInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "enact"
      | "items"
      | "participants"
      | "setItems"
      | "tokenState"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "enact", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "items", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "participants",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "setItems", values: [boolean]): string;
  encodeFunctionData(
    functionFragment: "tokenState",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "enact", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "items", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "participants",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setItems", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenState", data: BytesLike): Result;
}

export interface PIZZA_ProcessExecution extends BaseContract {
  connect(runner?: ContractRunner | null): PIZZA_ProcessExecution;
  waitForDeployment(): Promise<this>;

  interface: PIZZA_ProcessExecutionInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  enact: TypedContractMethod<[id: BigNumberish], [void], "nonpayable">;

  items: TypedContractMethod<[], [boolean], "view">;

  participants: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  setItems: TypedContractMethod<[_items: boolean], [void], "nonpayable">;

  tokenState: TypedContractMethod<[], [bigint], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "enact"
  ): TypedContractMethod<[id: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "items"
  ): TypedContractMethod<[], [boolean], "view">;
  getFunction(
    nameOrSignature: "participants"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "setItems"
  ): TypedContractMethod<[_items: boolean], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "tokenState"
  ): TypedContractMethod<[], [bigint], "view">;

  filters: {};
}
