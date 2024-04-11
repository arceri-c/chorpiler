import Mustache from "mustache";
import { InteractionNet } from "../../../Parser/InteractionNet"
import { TemplateEngine } from "../../TemplateEngine"
import util from 'util';
import * as fs from 'fs';
import path from "path";
import { ProcessGenerator, TemplateOptions } from "../../ProcessGenerator";
import { ProcessEncoding } from '../../ProcessEncoding';

const readFile = util.promisify(fs.readFile);

export default class SolDefaultContractGenerator implements TemplateEngine {

  async compile(_iNet: InteractionNet, _template?: string, _options?: TemplateOptions): Promise<{target: string, encoding: ProcessEncoding}> {
    const iNet: InteractionNet = {..._iNet}
    if (iNet.initial == null || iNet.end == null) {
      throw new Error("Invalid InteractionNet"); 
    }
    const template: string = _template ? _template : await this.getTemplate();

    const gen = ProcessGenerator.generate(iNet);

    return { target: Mustache.render(template, gen.options), 
      encoding: gen.encoding };
  }

  async getTemplate(): Promise<string> {
    return (await readFile(path.join(__dirname, '..', '..', 'templates/ProcessExecution.sol'))).toString();
  }
}