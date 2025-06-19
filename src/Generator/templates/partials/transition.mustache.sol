// <--- {{#modelID}}{{modelID}} {{taskName}}{{/modelID}}{{^modelID}} auto transition {{/modelID}} --->
{{#hasConditions}}
if ({{#conditions}}{{> condition}}{{/conditions}}) {
{{/hasConditions}}
{{#taskName}}
// <--- custom code for task here --->
{{#transaction}}
IERC20({{{tokenType}}}).transfer(participants[{{{receiver}}}],{{{amount}}});
{{/transaction}}
{{/taskName}}
_tokenState &= ~uint({{{consume}}});
{{#outTo}}
tokenState[{{outTo.id}}] = {{outTo.produce}};
{{/outTo}}
{{#produce}}
_tokenState |= {{{produce}}};
{{/produce}}
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