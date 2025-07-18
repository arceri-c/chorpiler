export class Process {
  public participants = new Map<string, Participant>();
  public transitions = new Map<string, Transition>();
  public states = new Map<number, Transition[]>();
  caseVariables = new Map<string, CaseVariable>();
  public modelID = ""; // ID as was found in model
  public tokenTransfer = false;
  public tokenNames : string[] = [];

  constructor(
    public id: number, // ID in form 0...n assigned by generator
  ) {}

  addTransition(netID: string, transition: Transition) {
    this.transitions.set(netID, transition);

    if (!this.states.has(transition.consume)) {
      this.states.set(transition.consume, []);
    }
    this.states.get(transition.consume)!.push(transition);
  }
}

export class SubProcess extends Process {
  sourceIDs: string[] = []; // transition in the parent process before this sub process
  targetIDs: string[] = []; // transition in the parent process after this sub process
}

export class MainProcess extends Process {
  public loopProtection = true;

  constructor() {
    super(0);
  }
  subProcesses = new Map<string, SubProcess>();
}

export class CaseVariable {
  constructor(
    public name: string,
    public type: string,
    public expression: string,
    public setters: boolean
  ) {}
}

interface TransitionParams {
  consume: number;
  produce: number;
  condition?: string | null;
  isEnd?: boolean;
  defaultBranch?: boolean;
  outTo?: { id: number; produce: number } | null;
}

export class Transition {
  public consume: number;
  public produce: number;
  public condition: string | null;
  public isEnd: boolean;
  public defaultBranch: boolean;
  public outTo: { id: number; produce: number } | null;

  constructor({
    consume,
    produce,
    condition = null,
    isEnd = false,
    defaultBranch = false,
    outTo = null
  }: TransitionParams) {
    this.consume = consume;
    this.produce = produce;
    this.condition = condition;
    this.isEnd = isEnd;
    this.defaultBranch = defaultBranch;
    this.outTo = outTo;
  }
}

interface TaskTransitionParams extends TransitionParams {
  taskID: number;
}

export class TaskTransition extends Transition {
  public taskID: number;

  constructor({
    taskID,
    ...transitionParams
  }: TaskTransitionParams) {
    super(transitionParams);
    this.taskID = taskID;
  }
}

interface InitiatedTransitionParams extends TaskTransitionParams {
  modelID: string;
  initiatorID: number;
  receiverID:number;
  taskName: string;
  message: string|null;
  tokenTransfer: boolean;
  tokenName: string|null;
  amount: string|undefined;
}

export class InitiatedTransition extends TaskTransition {
  public modelID: string;
  public initiatorID: number;
  public receiverID: number;
  public taskName: string;
  public message: string|null;
  public tokenTransfer: boolean = false; //is there a tokenTransfer connected to the task?
  public tokenName: string|null;
  public amount: string|undefined; //

  constructor({
    modelID,
    initiatorID,
    receiverID,
    taskName,
    message,
    tokenTransfer,
    tokenName,
    amount,
    ...transitionParams
  }: InitiatedTransitionParams) {
    super(transitionParams);
    this.modelID = modelID;
    this.initiatorID = initiatorID;
    this.receiverID = receiverID;
    this.taskName = taskName;
    this.message = message;
    this.tokenTransfer = tokenTransfer;
    this.tokenName = tokenName;
    this.amount = amount;
  }
}

export class Participant {
  constructor(
    public id: number, // ID in form 0...n assigned by generator
    public modelID: string, // ID as was found in model
    public name: string,
    public address: string
  ) {}
}