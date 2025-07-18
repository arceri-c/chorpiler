// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{#conditions}}{{> condition}}{{/conditions}}) {
{{/hasConditions}}
{{#taskName}}
// <--- custom code for task here --->
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
{{#outTo}}
tokenState[{{outTo.id}}] = {{outTo.produce}};
{{/outTo}}
{{#produce}}
_tokenState |= {{{produce}}};
{{/produce}}
{{#tokenTransfer}}
uint8 decimals = IERC20(tokens["{{{tokenName}}}"]).decimals();
IERC20(tokens["{{{tokenName}}}"]).transfer(participants[{{{receiver}}}],{{{amount}}} * (10 ** decimals)/ 1e6);
{{/tokenTransfer}}
{{#isEnd}}
break; // is end
{{/isEnd}}
{{^isEnd}}
{{#initiator}}
{{#loopProtection}}
id = 0;
{{/loopProtection}}
{{/initiator}}
continue; 
{{/isEnd}}
{{#hasConditions}}
}
{{/hasConditions}}