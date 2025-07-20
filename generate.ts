import * as fs from 'fs';
import chorpiler, { TriggerEncoding } from './src'; 

const parser = new chorpiler.Parser();
const bpmnXML = fs.readFileSync("rental-agreement.bpmn");

parser.fromXML(bpmnXML)
  .then((iNet) => {
    const contractGenerator = new chorpiler.generators.sol.DefaultContractGenerator(iNet[0]);

    return contractGenerator.compile();
  })
  .then((gen) => {
    fs.writeFileSync("Process.sol", gen.target, { flag: 'w+' });
    console.log("Process.sol generated.");
    console.log(TriggerEncoding.toJSON(gen.encoding));
  })
  .catch((err) => {
    console.error("An error occurred:", err);
  });