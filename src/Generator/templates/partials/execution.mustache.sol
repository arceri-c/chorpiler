{{^hasSubProcesses}}
uint _tokenState = tokenState;
{{/hasSubProcesses}}
{{#hasSubProcesses}}
uint _tokenState = tokenState[{{id}}];
{{/hasSubProcesses}}

while(_tokenState != 0) {
  {{#states}}
  if (_tokenState & {{{consume}}} == {{{consume}}}) {
    {{#transitions}} 
    {{#isDecision}}
    {{^defaultBranch}}
    if ({{{decision}}}) {
    {{/defaultBranch}}
    {{#defaultBranch}}
    else {
    {{/defaultBranch}}
      {{> transition }}
    }
    {{/isDecision}}
    {{^isDecision}}
    {{> transition }}
    {{/isDecision}}
    {{/transitions}}
  }
  {{/states}}
  break;
}

{{^hasSubProcesses}}
tokenState = _tokenState;
{{/hasSubProcesses}}
{{#hasSubProcesses}}
tokenState[{{id}}] = _tokenState;
{{/hasSubProcesses}}