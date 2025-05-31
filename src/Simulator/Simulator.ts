import { Guard, Place, PlaceType, TaskLabel, Transition } from "../Parser/Element";
import { INetFastXMLParser } from "../Parser/FastXMLParser";
import { INetParser } from "../Parser/Parser";
import { XESFastXMLParser } from "../util/EventLog/XESFastXMLParser";
import { IXESParser } from "../util/EventLog/XESParser";
import { Event, EventLog, InstanceDataChange } from "../util/EventLog/EventLog"
import fs from 'fs';
import path from 'path';
import Mustache from "mustache";
import { Trace } from "../util/EventLog/Trace";
import { TemplateEngine } from "../Generator/TemplateEngine";
import SolDefaultContractGenerator from "../Generator/target/Sol/DefaultGenerator";
import { TriggerEncoding } from "../Generator/Encoding/TriggerEncoding";
import { CaseVariable } from "../Generator/Encoding/Encoding";

export interface ISimulator {
  generate(): void;
}

export class Simulator implements ISimulator {

  constructor(
    public workdir: string = ".",
    public bpmnDir: string = path.join(workdir + "/data/bpmn"),
    public bpmnParser: INetParser = new INetFastXMLParser(),
    public xesDir: string = path.join(workdir + "/data/generated"),
    public xesParser: IXESParser = new XESFastXMLParser(),
    public contractDir: string = path.join(workdir + "/data/generated")
  ) {}

  private static Simulation = class {
    public traces = new Array<Trace>();
    public visited = new Array<string[]>();
    public conditions = new Map<string, number>(); 
    public contract: null | { target: string, encoding: TriggerEncoding } = null;

    constructor(public contractGenerator: TemplateEngine) {}

    async generate() {
      this.generateLog();
      await this.generateContract();
    }

    async generateContract() {
      if (this.traces.length === 0) return console.warn(`No trace generated for ${this.contractGenerator.iNet.id}`);
      this.contract = await this.contractGenerator.compile();
      return this.contract;
    }

    generateLog() {
      this.replay()
    }

    replay() {
      const initial = this.contractGenerator.iNet.initial!;
      const end = this.contractGenerator.iNet.end!;
      const enabled: Place[] = [initial]; // Start with the initial place
      const candidates: Transition[] = [...initial.target]; // Initial candidates are the transitions from the initial place
      const executed: Transition[] = [];
      const toExecute: Transition[] = [...this.contractGenerator.iNet.elements.values()]
        .filter((t): t is Transition => t instanceof Transition);
      const maxLogEntries = 100; // Threshold for maximum log entries
      const log = new EventLog([]); // Initialize the log variable
      let currentTrace = new Trace([]);

      //console.log("To Execute", toExecute.map((t) => t.id))

      //console.log("Starting replay...");
      //console.log(`Initial place: ${initial.id}, End place: ${end.id}`);
      //console.log("Initial candidates:", candidates.map((t) => t.id));

      while (log.traces.length < maxLogEntries) {
        // Stop if all transitions in toExecute are executed
        if (toExecute.every((t) => executed.includes(t))) {
          //console.log("All transitions executed. Stopping replay.");
          break;
        }

        // Check for execution candidates
        const executableCandidates = candidates.filter((t) =>
          t.source.every((p) => enabled.includes(p))
        );
        if (executableCandidates.length === 0) {
          console.error("Deadlock detected: No executable transitions.");
          return;
        }

        // Prioritize transitions that are both in toExecute and candidates
        const prioritizedCandidates = executableCandidates.filter((t) => toExecute.includes(t));
        const availableCandidates = prioritizedCandidates.length > 0 ? prioritizedCandidates : executableCandidates;

        // Pick a random candidate
        const transitionCandidate = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
        ////console.log("Selected transition candidate:", transitionCandidate.id);

        // Process the transition
        this.processTransition(transitionCandidate, currentTrace);

        // Update enabled places
        transitionCandidate.source.forEach((p) => {
          const index = enabled.indexOf(p);
          if (index !== -1) enabled.splice(index, 1); // Remove source places from enabled
        });

        transitionCandidate.target.forEach((p) => {
          if (!enabled.includes(p)) enabled.push(p); // Add target places to enabled
        });
    
        // Update candidates and executed lists
        candidates.splice(candidates.indexOf(transitionCandidate), 1); // Remove from candidates
        executed.push(transitionCandidate); // Add to executed
      
        //console.log("Enabled places after execution:", enabled.map((p) => p.id));
        //console.log("Executed transitions:", executed.map((t) => t.id));

        // Check if the end place is reached
        if (transitionCandidate.target.includes(end)) {
          //console.log("End place reached. Flushing trace to log.");
          log.traces.push(currentTrace); // Add the trace to the log
          //console.log("Trace added to log:", currentTrace.events.map((e) => e.name));

          // Reset state for the next trace
          enabled.length = 0;
          enabled.push(initial); // Start again with the initial place
          candidates.length = 0;
          candidates.push(...initial.target); // Start again with initial candidates
          executed.length = 0;
          currentTrace = new Trace([]);
          //console.log("State reset for the next trace.");
          continue;
        }

        // Add new transitions to candidates
        transitionCandidate.target.forEach((p) => {
          p.target.forEach((t) => {
            if (!candidates.includes(t)) candidates.push(t);
          });
        });

        //console.log("Updated candidates:", candidates.map((t) => t.id));
      }

      

      // Remove duplicate traces from the log
      log.traces = log.traces.filter((trace, index, self) =>
        index === self.findIndex((t) =>
          t.events.map((e) => e.name).join(",") === trace.events.map((e) => e.name).join(",")
        )
      );

      // Output the log
      //console.log("Generated log:", log.traces.map((trace) => trace.events.map((e) => e.name)));
      this.traces = log.traces;
    }

    private getCondition(transition: Transition) {
      if (transition.label.guard && transition.label.guard.conditions.size > 0) 
        return [...transition.label.guard.conditions.values()].join(" && ");
    }

    private processTransition(
      transitionCandidate: Transition,
      currentTrace: Trace
    ) {
      //console.log("Executing transition:", transitionCandidate.id);
    
      // Add the transition to the trace if it has a TaskLabel
      if (transitionCandidate.label instanceof TaskLabel) {
        currentTrace.events.push(
          new Event(
            transitionCandidate.label.name,
            transitionCandidate.id,
            transitionCandidate.label.sender.id
          )
        );
      }
    
      // Handle conditions for the transition
      const condition = this.getCondition(transitionCandidate);
      if (condition) {
        if (!this.conditions.has(transitionCandidate.id)) {
          transitionCandidate.label.guard?.conditions.clear();
          this.conditions.set(transitionCandidate.id, 1 << this.conditions.size);
        }
    
        const conditionID = this.conditions.get(transitionCandidate.id)!;
    
        // Add instance data change to the last event or create a new event
        const lastEvent = currentTrace.events.at(-1);
        if (lastEvent) {
          lastEvent.dataChange = lastEvent.dataChange || [];
          lastEvent.dataChange.push(new InstanceDataChange("conditions", conditionID));
        } else {
          currentTrace.events.push(
            new Event(
              "Instance Data Change",
              "Instance Data Change",
              [...this.contractGenerator.iNet.participants.values()][0]!.id,
              "",
              [new InstanceDataChange("conditions", conditionID)]
            )
          );
        }
    
        // Update the guard for the transition
        const guard = new Guard(`conditions[${conditionID}] == true`);
        guard.conditions.set("", `conditions & ${conditionID} == ${conditionID}`);
        transitionCandidate.label.guard = guard;
      }
    }
  }

  async generate(prePend = "", GeneratorType = SolDefaultContractGenerator): Promise<void> {
    const bpmnFiles = fs.readdirSync(this.bpmnDir).filter(file => file.endsWith('.bpmn'));

    for (const file of bpmnFiles) {
      console.log(`Simulation for ${file}`);
      const filePath = path.join(this.bpmnDir, file);
      const model = fs.readFileSync(filePath);
      const nets = await this.bpmnParser!.fromXML(model);
      const iNet = nets[0]; // only support one model
      iNet.id = prePend + iNet.id;
      const generator = new GeneratorType(iNet);
      generator.addCaseVariable(new CaseVariable("conditions", "uint", "uint public conditions;", true));
      const sim = new Simulator.Simulation(generator);
      await sim.generate();

      if (sim.traces.length === 0) continue;

      const log = new EventLog([...sim.traces.values()]);
      const template = fs.readFileSync(path.join(__dirname, "./templates/xes", "log.mustache.xes"), "utf-8");
      const renderedLog = Mustache.render(template, log);

      if (!fs.existsSync(this.contractDir)) fs.mkdirSync(this.contractDir, { recursive: true });
      if (!fs.existsSync(this.xesDir)) fs.mkdirSync(this.xesDir, { recursive: true });

      fs.writeFileSync(path.join(this.xesDir, `${path.basename(file, '.bpmn')}`) + ".xes", renderedLog, "utf-8");
      fs.writeFileSync(path.join(this.contractDir, `${path.basename(file, '.bpmn')}`) + ".sol", sim.contract!.target, "utf-8");
      fs.writeFileSync(path.join(this.contractDir, `${path.basename(file, '.bpmn')}`) + ".json", JSON.stringify(TriggerEncoding.toJSON(sim.contract!.encoding)), "utf-8");
      console.log(`Generated log and contract written to ${this.xesDir} and ${this.contractDir}`);
    }
  }
}