/**
 * Generates a Encoding from an INet, by removing silent transitions and encoding tasks in a bit array fashion,
 * the template can be used to render the process token play by a TemplateEngine
 */
import { deleteFromArray, printInet } from '../util/helpers';
import {
  Transition,
  Element,
  TaskLabel,
  LabelType,
  Place,
  PlaceType,
  Guard,
  SubChoreographyTaskLabel,
} from '../Parser/Element';
import { InteractionNet } from '../Parser/InteractionNet';
import * as Encoding from './Encoding/Encoding';
import { assert } from 'console';

const loggingEnabled = false; // Toggleable logging

export class INetEncoder {
  private mainEncoded = new Encoding.MainProcess();

  public generate(
    _iNet: InteractionNet,
    options: {
      unfoldSubNets: boolean; // If true, sub choreographies are "folded" into the main choreography, i.e.,
      // they are treated as visual option only with no consequence for the generated contract
      loopProtection: boolean;
    },
  ) {
    const iNet: InteractionNet = { ..._iNet };
    if (iNet.initial == null || iNet.end == null) {
      throw new Error('Invalid InteractionNet');
    }
    this.mainEncoded.modelID = iNet.id;
    this.mainEncoded.loopProtection = options.loopProtection;
    // create participant template options and IDs
    [...iNet.participants.values()].forEach((par, encodedID) => {
      this.mainEncoded.participants.set(
        par.id,
        new Encoding.Participant(
          encodedID, // encoded ID from 0..N
          par.id, // ID as in Model
          par.name,
          '[template]', // TODO: Make this settable in the TemplateEngine
        ),
      );
    });

    if (options.unfoldSubNets) {
      // sub choreographies are "folded" into the main choreography, i.e.,
      // they are treated as visual option only with no consequence for the generated contract
      this.unfoldSubNets(iNet); // Recursively unfold all subnets
    }

    this.encodeNets(this.mainEncoded, iNet);
    return this.mainEncoded;
  }

  private encodeNets(parent: Encoding.Process, iNet: InteractionNet) {
    // encode all subnets before transforming (i.e., reducing) the interaction net to preserve subnet position
    for (const subNet of iNet.subNets.values()) {
      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(
          `sub net (ID: ${subNet.id}) with no corresponding transition in parent net (ID: ${iNet.id}) found`,
        );

      const subEncoding = new Encoding.SubProcess(this.mainEncoded.subProcesses.size + 1);
      subEncoding.modelID = subNet.id;
      // record place of subnet transition
      for (const outplace of subNetTransition.target)
        for (const t of outplace.target) subEncoding.targetIDs.push(t.id);
      for (const inPlace of subNetTransition.source)
        for (const t of inPlace.source) subEncoding.sourceIDs.push(t.id);
      this.deleteElement(iNet, subNetTransition);

      // parse subnet participants from mainnet
      for (const parID of subNet.participants.keys()) {
        if (!this.mainEncoded.participants.has(parID))
          throw new Error(
            `participant (ID: ${parID}) in sub net (ID: ${subNet.id}) with no corresponding participant in parent net (ID: ${iNet.id}) found`,
          );
        subEncoding.participants.set(parID, this.mainEncoded.participants.get(parID)!);
      }
      this.mainEncoded.subProcesses.set(subEncoding.modelID, subEncoding);
    }

    this.removeSilentTransitions(iNet);
    this.encodeTransitions(iNet, parent);

    // transform and encode subnet
    for (const subNet of iNet.subNets.values()) {
      const subEncoding = this.mainEncoded.subProcesses.get(subNet.id)!;
      this.removeSilentTransitions(subNet);
      this.encodeTransitions(subNet, subEncoding);
      this.encodeSubNetTransition(subNet, parent, subEncoding);

      if (subNet.subNets.size > 0) {
        this.encodeNets(subEncoding, subNet);
      } else {
        return;
      }
    }
  }

  /**
   * Unfolds Sub choreographies into the main net,
   * For each sub choreography transition
   * @param iNet
   */
  private unfoldSubNets(iNet: InteractionNet) {
    for (const subNet of iNet.subNets.values()) {
      const subNetTransition = iNet.elements.get(subNet.id) as Transition;
      if (!subNetTransition)
        throw new Error(`SubNet with no corresponding transition in main net found: ${subNet.id}`);

      // add all elements to mainnet
      for (const element of subNet.elements) iNet.elements.set(element[0], element[1]);
      // replace subNetTransition with start transition of subnet
      assert(subNet.initial && subNet.initial.target.length === 1);
      const startTransition = subNet.initial!.target[0] as Transition;
      // link sources of subNetTransition to start transition
      this.linkNewSources(startTransition, subNetTransition.source);
      this.copyProperties(subNetTransition, [startTransition]);
      // replace subNet end event with target of subNetTransition
      assert(subNet.end && subNet.end.source.length === 1);
      const endTransition = subNet.end!.source[0] as Transition;
      this.linkNewTargets(endTransition, subNetTransition.target);

      this.deleteElement(iNet, subNet.end!);
      this.deleteElement(iNet, subNet.initial!);
      this.deleteElement(iNet, subNetTransition);
    }
    iNet.subNets.clear();
  }

  /**
   * Encodes the transitions of an InteractionNet into an Encoding.Process.
   *
   * @param iNet - The InteractionNet to encode.
   * @param encoded - The Encoding.Process to store the encoded transitions.
   * @throws {Error} If the InteractionNet is invalid or contains unconnected transitions.
   * @returns The encoded transitions.
   */
  private encodeTransitions(iNet: InteractionNet, encoded: Encoding.Process) {
    if (iNet.initial == null || iNet.end == null) {
      throw new Error('Invalid InteractionNet');
    }
    // transitions to ids
    const taskIDs = new Map<string, number>();
    const transitions = new Array<Transition>();
    const taskIDoffset = this.mainEncoded.loopProtection === true ? 1 : 0; // keep 0 for noop, noop is required for loop protection,
    // loop protection: set taskID to noop, once it is executed once, to prevent endless execution loops.

    for (const element of iNet.elements.values()) {
      if (!(element instanceof Transition)) {
        // don't need extra IDs for other choreos
        continue;
      }
      if (element.source.length === 0 && element.target.length === 0) {
        throw new Error(`Unconnected transition in interaction net ${element.id}`);
      }
      if (!this.isSilentTransition(element)) {
        // silent transitions don't need external IDs
        taskIDs.set(element.id, taskIDs.size + taskIDoffset);
      }
      transitions.push(element);
    }

    const transitionMarkings = new Map<string, number>();
    let transitionCounter = 1;
    // add start and end event
    transitionMarkings.set(iNet.initial.id, 1);
    transitionMarkings.set(iNet.end.id, 0);

    for (const element of transitions) {
      // build condition for transition
      const condition = element.label.guard ? this.buildCondition(element.label.guard) : undefined;
      const defaultBranch = element.label.guard ? element.label.guard.default : undefined;

      // determine sequence flows
      // console.log("ID", references.get(element.id));
      let consume = 0;
      let produce = 0;
      // console.log("EID", element.id);
      // collect consuming places
      // console.log("INS____");
      for (const _in of element.source) {
        // console.log(_in);
        if (!transitionMarkings.get(_in.id)) {
          transitionMarkings.set(_in.id, 2 ** transitionCounter);
          transitionCounter++;
        }
        consume += transitionMarkings.get(_in.id)!;
        // console.log(consume)
      }
      // collect producing places
      // console.log("OUT____");
      let isEnd = false;
      for (const out of element.target) {
        // console.log(out);
        if (out instanceof Place && out.type == PlaceType.End) {
          // leads to end event
          isEnd = true;
          // we don"t need to increase the marking counter
          // as 0 doesn't take away a spot
        } else if (!transitionMarkings.get(out.id)) {
          transitionMarkings.set(out.id, 2 ** transitionCounter);
          transitionCounter++;
        }
        produce += transitionMarkings.get(out.id)!;
        // console.log(produce)
      }

      if (this.isSilentTransition(element)) {
        encoded.addTransition(
          element.id,
          new Encoding.Transition({
            consume,
            produce,
            condition,
            isEnd,
            defaultBranch,
          }),
        );
      } else if (element.label instanceof TaskLabel) {
        let tokenTransfer = false;
        let amount: number | null = null;
        let tokenName: string | null = null;
        if (element.label.message) {
          //parse message
          const parsedMessage = element.label.message.split('_');
          if (parsedMessage[0] == 'transfer') {
            tokenTransfer = true;
            amount = Number(parsedMessage[1]);
            if (Number.isNaN(amount)) {
              throw new Error('Invalid amount');
            }
            amount = amount * 1e6; // scale the amount by fixed precision to avoid multiplication with fractional constants in Solidity
            tokenName = parsedMessage[2];
            encoded.tokenTransfer = true;
            if (!encoded.tokenNames.includes(tokenName)) {
              encoded.tokenNames.push(parsedMessage[2]);
            }
          }
        }

        encoded.addTransition(
          element.id,
          new Encoding.InitiatedTransition({
            modelID: element.id,
            initiatorID: encoded.participants.get(element.label.sender.id)!.id,
            receiverID: encoded.participants.get(element.label.receiver[0].id)!.id,
            taskID: taskIDs.get(element.id)!,
            taskName: element.label.name,
            consume,
            produce,
            condition,
            isEnd,
            defaultBranch,
            message: element.label.message,
            tokenTransfer: tokenTransfer,
            tokenName: tokenName,
            amount: amount?.toString(),
          }),
        );
      }
    }
  }

  private encodeSubNetTransition(
    subNet: InteractionNet,
    parent_process: Encoding.Process,
    subEncoded: Encoding.SubProcess,
  ) {
    const sources = subEncoded.sourceIDs;
    // calculate produce of end event of subnet
    let produce = 0;
    for (const id of sources) {
      produce += parent_process.transitions.get(id)!.produce;
      // set outTo of parent net transition activating the subprocess
      parent_process.transitions.get(id)!.outTo = { id: subEncoded.id, produce: 1 };
    }
    // set end event outTo
    for (const beforeEnd of subNet.end!.source)
      subEncoded.transitions.get(beforeEnd.id)!.outTo = { id: parent_process.id, produce };
  }

  private buildCondition(guard: Guard) {
    return [...guard.conditions.values()].join(' && ');
  }

  /**
   * Assure source and target are connected through one place and source doesn't have other targets and target doesn't have other sources
   * Includes rule a, b, e, f.1, h
   */
  private removeSilentTransitionCaseA(
    iNet: InteractionNet,
    prevElement: Element,
    element: Element,
    nextElement: Element,
  ) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (prevElement.target.length !== 1 || nextElement.source.length !== 1) return;
    if (!(element instanceof Place)) return;

    if (this.isSilentTransition(prevElement)) {
      if (loggingEnabled) console.log('Applied silent transition removal rule a, b, e, f.1, h');
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (this.isSilentTransition(nextElement)) {
      if (loggingEnabled) console.log('Applied silent transition removal rule a, b, e, f.1, h');
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  private removeSilentTransitionCaseB(
    iNet: InteractionNet,
    prevElement: Element,
    element: Element,
    nextElement: Element,
  ) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(prevElement) || !this.isSilentTransition(nextElement)) return;
    if (!(element instanceof Place)) return;

    if (prevElement.target.length >= 1 && nextElement.source.length === 1) {
      // rule f.2
      if (loggingEnabled) console.log('Applied silent transition removal rule F.2');
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (prevElement.target.length === 1 && nextElement.source.length > 1) {
      // rule g
      if (loggingEnabled) console.log('Applied silent transition removal rule G');
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  private removeSilentTransitionCaseC(
    iNet: InteractionNet,
    prevElement: Element,
    element: Element,
    nextElement: Element,
  ) {
    if (element.source.length !== 1 || element.target.length !== 1) return;
    if (!this.isSilentTransition(element)) return;
    assert(element instanceof Transition);
    if (prevElement.target.length > 1 && nextElement.source.length === 1) {
      // rule c
      if (loggingEnabled) console.log('Applied silent transition removal rule C');
      this.copyProperties(element as Transition, nextElement.target as Transition[]);
      this.mergeTargetIntoSource(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    } else if (prevElement.target.length === 1 && nextElement.source.length >= 1) {
      // rule d
      if (loggingEnabled) console.log('Applied silent transition removal rule D');
      this.copyProperties(element as Transition, prevElement.source as Transition[]);
      this.mergeSourceIntoTarget(iNet, prevElement, nextElement);
      this.deleteElement(iNet, element);
      return true;
    }
    return false;
  }

  // rule i
  private removeSilentTransitionCaseD(iNet: InteractionNet, element: Element) {
    if (element.source.length !== 1 || element.target.length <= 1) return;
    if (!this.isSilentTransition(element)) return;
    assert(element instanceof Transition);
    if (
      element.source.length === 1 &&
      element.target.length > 1 &&
      element.source[0].source.length > 0 &&
      element.source[0].target.length > 1
    ) {
      if (loggingEnabled) console.log('Applied silent transition removal rule I');
      // XOR -> AND, XOR not immediately after start event (a manual task is present before the XOR)
      const xorPlace = element.source[0]; // p0
      assert(xorPlace instanceof Place);
      const andPlaces = element.target; // p1, p2, ...
      for (const prevTransition of xorPlace.source) this.linkNewTargets(prevTransition, andPlaces);
      for (const andPlace of andPlaces) this.linkNewTargets(andPlace, xorPlace.target);
      this.deleteElement(iNet, element);
      this.deleteElement(iNet, xorPlace);
      return true;
    }
    return false;
  }

  private mergeSourceIntoTarget(iNet: InteractionNet, source: Element, target: Element) {
    if (loggingEnabled)
      console.log(
        `Merging (ID: ${source.id}, type: ${source.constructor.name}) into (ID: ${target.id}, type: ${target.constructor.name})`,
      );
    this.linkNewSources(target, source.source);
    if (source instanceof Transition) this.copyProperties(source, [target as Transition]);
    if (iNet.initial == source) iNet.initial = target as Place;
    this.deleteElement(iNet, source);
  }

  private mergeTargetIntoSource(iNet: InteractionNet, source: Element, target: Element) {
    if (loggingEnabled)
      console.log(
        `Merging (ID: ${target.id}, type: ${target.constructor.name}) into (ID: ${source.id}, type: ${source.constructor.name})`,
      );
    this.linkNewTargets(source, target.target);
    if (target instanceof Transition) this.copyProperties(target, [source as Transition]);
    if (iNet.end == target) iNet.end = source as Place;
    this.deleteElement(iNet, target);
  }

  public removeSilentTransitions(iNet: InteractionNet) {
    outer: while (true) {
      for (const element of Array.from(iNet.elements.values())) {
        const prevElement = element.source[0];
        const nextElement = element.target[0];
        if (element instanceof Place) {
          if (this.removeSilentTransitionCaseA(iNet, prevElement, element, nextElement)) {
            continue outer;
          }
          if (this.removeSilentTransitionCaseB(iNet, prevElement, element, nextElement)) {
            continue outer;
          }
        } else {
          if (this.removeSilentTransitionCaseC(iNet, prevElement, element, nextElement)) {
            continue outer;
          }
          if (this.removeSilentTransitionCaseD(iNet, element)) {
            continue outer;
          }
        }
      }
      break;
    }
    return iNet;
  }

  private isSilentTransition(el: Element) {
    return (
      el instanceof Transition &&
      (el.label.type === LabelType.DataExclusiveIncoming ||
        el.label.type === LabelType.DataExclusiveOutgoing ||
        el.label.type === LabelType.EventExclusiveIncoming ||
        el.label.type === LabelType.EventExclusiveOutgoing ||
        el.label.type === LabelType.ParallelConverging ||
        el.label.type === LabelType.ParallelDiverging ||
        el.label.type === LabelType.Start ||
        el.label.type === LabelType.End ||
        this.isSubOrCallChoreographyTask(el))
    );
  }

  private isSubOrCallChoreographyTask(el: Transition) {
    return el instanceof Transition && el.label instanceof SubChoreographyTaskLabel;
  }

  private deleteElement(iNet: InteractionNet, el: Element) {
    this.unlinkAllSources(el);
    this.unlinkAllTargets(el);
    iNet.elements.delete(el.id);
  }

  private unlinkAllSources(el: Element) {
    if (el.source.length === 0) return;
    for (const source of el.source) deleteFromArray(source.target, el);
    el.source = new Array();
  }

  private unlinkAllTargets(el: Element) {
    if (el.target.length === 0) return;
    for (const target of el.target) deleteFromArray(target.source, el);
    el.target = new Array();
  }

  private linkNewSources(el: Element, sources: Element[]) {
    el.source.push(...sources);
    for (const transition of sources) transition.target.push(el);
  }

  private linkNewTargets(el: Element, targets: Element[]) {
    el.target.push(...targets);
    for (const transition of targets) transition.source.push(el);
  }

  private copyProperties(copyFrom: Transition, copyTo: Transition[]) {
    if (copyFrom.label.guard) {
      for (const to of copyTo) {
        // copy guards
        if (!to.label.guard) {
          to.label.guard = copyFrom.label.guard;
          continue;
        } else {
          to.label.guard.conditions = new Map([
            ...copyFrom.label.guard.conditions,
            ...to.label.guard.conditions,
          ]);
          // Ensure no label can be defaultBranch if one of the labels is a condition
          if (to.label.guard.conditions.size > 0) {
            to.label.guard.default = false;
          }
        }
      }
    }
    // adjust subnet source and target if necessary
    for (const subNet of this.mainEncoded.subProcesses.values()) {
      if (subNet.sourceIDs.includes(copyFrom.id)) {
        deleteFromArray(subNet.sourceIDs, copyFrom.id);
        subNet.sourceIDs.push(...copyTo.map((t) => t.id));
      }
    }
  }
}
