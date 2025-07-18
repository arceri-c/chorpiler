//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

{{#tokenTransfer}}
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}
{{/tokenTransfer}}

contract {{{modelID}}} {
  {{^hasSubProcesses}}
  uint public tokenState = 1;
  {{/hasSubProcesses}}
  {{#hasSubProcesses}}
  uint[{{{numberOfProcesses}}}] public tokenState;
  {{/hasSubProcesses}}
  address[{{{numberOfParticipants}}}] public participants;
  {{#tokenTransfer}}
  mapping(string => address) public tokens;
  {{/tokenTransfer}}
  {{#caseVariables}}
  {{{expression}}}
  {{/caseVariables}}

  constructor(address[{{{numberOfParticipants}}}] memory _participants{{#tokenTransfer}}, address[{{{numberOfTokens}}}] memory _tokenAddresses {{/tokenTransfer}}) {
    participants = _participants;
    {{#tokenNames}}
    tokens["{{{symbol}}}"] = _tokenAddresses[{{{index}}}];
    {{/tokenNames}}
  }
  {{#caseVariables}}
  {{#setters}}
  function {{{functionName}}}({{{type}}} _{{{name}}}) external {
    {{{name}}} = _{{{name}}};
  }
  {{/setters}}
  {{/caseVariables}}

  function enact(uint id) external payable {
    {{> execution}}
  }

  {{#subProcesses}}
  function {{modelID}}(uint id) external {
    {{> execution}}
  }
  {{/subProcesses}}
}