import { InteractionNet } from "../../../Parser/InteractionNet"
import { CaseVariable } from "../../Encoding/Encoding";
import { TemplateEngine } from "../../TemplateEngine"
import path from "path";

export default class SolStateChannelContractGenerator extends TemplateEngine {

  constructor(
    _iNet: InteractionNet, 
    _caseVariables?: Map<string, CaseVariable>) {
    super(_iNet, 
      path.join(__dirname, '..', '..', 'templates/ProcessChannel.sol'),
       _caseVariables,
        [ { partial: 'transition', path: path.join(__dirname, '..', '..', 'templates/transition.mustache.sol') } ]);
  }
}