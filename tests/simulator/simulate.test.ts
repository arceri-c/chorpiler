import SolDefaultContractGenerator from "../../src/Generator/target/Sol/DefaultGenerator";
import { Simulator } from "../../src/Simulator/Simulator";

describe('Simulate...', () => {

  const sim = new Simulator(__dirname);

  before(() => {
    return sim.generate("test_", SolDefaultContractGenerator, { unfoldSubNets: true, loopProtection: false });
  })

  it("", () => {})

})