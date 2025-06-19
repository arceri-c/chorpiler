import * as fs from 'fs';
// import chorpiler, { TriggerEncoding } from 'chorpiler';

//import { INetParser } from './src/Parser/Parser';
//import SolDefaultContractGenerator from "./src/Generator/target/Sol/DefaultGenerator";
//import { TriggerEncoding } from './src/Generator/Encoding/TriggerEncoding'; // adjust path if needed
import chorpiler, { TriggerEncoding } from './src'; // assumes index.ts is in ./src

const parser = new chorpiler.Parser();
const bpmnXML = fs.readFileSync("diagram.bpmn");

parser.fromXML(bpmnXML)
  .then((iNet) => {
    const contractGenerator = new chorpiler.generators.sol.DefaultContractGenerator(iNet[0]);

    return contractGenerator.compile();
  })
  .then((gen) => {
    fs.writeFileSync("Process_token.sol", gen.target, { flag: 'w+' });
    console.log("Process.sol generated.");
    console.log(TriggerEncoding.toJSON(gen.encoding));
  })
  .catch((err) => {
    console.error("An error occurred:", err);
  });