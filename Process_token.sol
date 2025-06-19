//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract PizzaDelivery {
  uint public tokenState = 1;
  address[3] public participants;

  constructor(address[3] memory _participants) {
    participants = _participants;
  }

  function enact(uint id) external payable {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g order pizza --->
        if (1 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        IERC20(usdcToken).transfer(participants[1],0.1);
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_1m3qduh hand over pizza --->
        if (2 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_175oxwe deliver pizza --->
        if (3 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 0;
        break; // is end
        }
      }
      break;
    }
    
    tokenState = _tokenState;
  }

}