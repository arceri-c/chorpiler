import { use } from "chai";
import * as fs from 'fs';
import {INetParser} from "../../src/Parser/Parser";
import chaiAsPromised from 'chai-as-promised';
import util from 'util';
import { TemplateEngine }  from "../../src/Generator/TemplateEngine";
import path from "path";
import { BPMN_PATH, OUTPUT_PATH } from "../config";
import { INetFastXMLParser } from "../../src/Parser/FastXMLParser";
import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator";
import SolStateChannelContractGenerator from "../../src/Generator/target/Sol/StateChannelGenerator";
import { TriggerEncoding } from "../../src";
import { CaseVariable } from "../../src/Generator/Encoding/Encoding";

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
use(chaiAsPromised);

const compileCase = async (generator: TemplateEngine, outputPath: string, caseLabel: string) => {
  const output = await generator.compile();

  await writeFile(
    path.join(outputPath.replace(".sol", "_encoding.json")), 
    JSON.stringify(TriggerEncoding.toJSON(output.encoding)), 
    { flag: 'w+' }
  );

  return writeFile(
    path.join(outputPath), 
    // need to append a label to the contract name as otherwise waffle will error when compiling
    // multiple contracts with the same name
    output.target.replace("contract ", "contract " + caseLabel), 
    { flag: 'w+' }
  );
}

// Test Parsing and Generation works with all supported elements 
describe('Test Parsing and Generation', () => {

  let parser: INetParser;

  beforeEach(() => {
    parser = new INetFastXMLParser();
  });

  describe('Parse correct BPMN and generate Sol Contracts', () => {

    it('Compile model with simple seq flow ', () => {
      return readFile(path.join(BPMN_PATH, 'seq-flow.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with XOR that allows to skip to the end event to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'xor-skip.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with AND to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'and.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with XOR to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'xor.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with long (7 consecutive) seq flows to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'seq-flow-7.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with uncontrolled merge of seq flows to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'uncontrolled-flow.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        console.log(await new SolDefaultContractGenerator(iNet[0]).compile());
      })
    });

    it('Compile model with sub choreographies to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'sub-choreography.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with sub choreographies to Sol contract that seperates the instance state (unfold=false)', () => {
      return readFile(path.join(BPMN_PATH, 'sub-choreography2.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return console.log(await new SolDefaultContractGenerator(iNet[0]).compile(false));
      })
    });

    it('Compile model with XOR followed by AND to Sol contract', () => { // Should be reduced properly, according to Rule (i)
      return readFile(path.join(BPMN_PATH, 'xor-and.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with event-based gateway', () => {
      return readFile(path.join(BPMN_PATH, 'event.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with a Loop to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'loop.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

    it('Compile model with a lot of XOR skips to Sol contract', () => {
      return readFile(path.join(BPMN_PATH, 'skip.bpmn')).then(async (data) => {
        const iNet = await parser.fromXML(data);
        console.log(await new SolDefaultContractGenerator(iNet[0]).compile())
        return await new SolDefaultContractGenerator(iNet[0]).compile();
      })
    });

  });

  describe('Parse and compile Pizza Case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "pizza"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "pizza"));
      }
    })

    it('to Sol Contract', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/pizza/pizza.bpmn'));
      const contract =  new SolDefaultContractGenerator((await parser.fromXML(data))[0]);
      contract.addCaseVariable(new CaseVariable("items", "bool", "bool public items = false;", true));

      return compileCase(
        contract,
        path.join(OUTPUT_PATH, "/pizza/PIZZA_ProcessExecution.sol"),
        "PIZZA_"
      );

    });

  });

  describe('Parse and compile pharmacy (out of order xml file) case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "out-of-order"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "out-of-order"));
      }
    })

    it('to Sol Contract', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/out-of-order/out-of-order-xml.bpmn'));

      return compileCase(
        new SolDefaultContractGenerator((await parser.fromXML(data))[0]),
        path.join(OUTPUT_PATH, "/out-of-order/PH_ProcessExecution.sol"),
        "PH_"
      );

    });

    it.skip('to State Channel Root', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/out-of-order/out-of-order-xml.bpmn'));

      return compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]),
        path.join(OUTPUT_PATH, "/out-of-order/PH_ProcessChannel.sol"),
        "PH_"
      );
      
    });

  });

  describe('Parse and compile supply chain case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "supply-chain"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "supply-chain"));
      }
    })

    it('to Sol Contract', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/supply-chain/supply-chain.bpmn'));

      return compileCase(
        new SolDefaultContractGenerator((await parser.fromXML(data))[0]), 
        path.join(OUTPUT_PATH, "/supply-chain/SC_ProcessExecution.sol"),
        "SC_"
      );
      
    });

    it.skip('to State Channel Root', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/supply-chain/supply-chain.bpmn'));

      return compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]), 
        path.join(OUTPUT_PATH, "/supply-chain/SC_ProcessChannel.sol"),
        "SC_"
      );

    });

  });

  describe('Parse and compile Incident Management Case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "incident-management"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "incident-management"));
      }
    })

    it('to Sol Contract', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/incident-management/incident-management.bpmn'));

      const contract = new SolDefaultContractGenerator((await parser.fromXML(data))[0]);
      contract.addCaseVariable(new CaseVariable("resolved", "bool", "bool public resolved = false;", true));

      return compileCase(
        contract,
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessExecution.sol"),
        "IM_"
      );
    });

    it.skip('to State Channel Root', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/incident-management/incident-management.bpmn'));

      return compileCase(
        new SolStateChannelContractGenerator((await parser.fromXML(data))[0]),
        path.join(OUTPUT_PATH, "/incident-management/IM_ProcessChannel.sol"),
        "IM_"
      );

    });

  });

  describe('Parse and compile Rental Agreement Case', () => {

    before(() => {
      if (!fs.existsSync(path.join(OUTPUT_PATH, "rental-agreement"))) {
        fs.mkdirSync(path.join(OUTPUT_PATH, "rental-agreement"));
      }
    })

    it('to Sol Contract', async () => {

      const data = await readFile(path.join(BPMN_PATH, '/cases/rental-agreement/rental-agreement.bpmn'));
      const contract = new SolDefaultContractGenerator((await parser.fromXML(data))[0]);
      contract.addCaseVariable(new CaseVariable("bond", "int", "int public bond = 4000;", false));
      contract.addCaseVariable(new CaseVariable("weeklyRent", "int", "int public weeklyRent = 1000;", true));

      return compileCase(
        contract,
        path.join(OUTPUT_PATH, "/rental-agreement/RA_ProcessExecution.sol"),
        "RA_"
      );
 
    });

  });

});