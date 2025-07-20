//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract ProcessExecution {
  uint public tokenState = 1;
  address[4] public participants;
  mapping(string => address) public tokens;

  constructor(address[4] memory _participants, address[1] memory _tokenAddresses ) {
    participants = _participants;
    tokens["usdc"] = _tokenAddresses[0];
  }

  function enact(uint id) external payable {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_001w5ww file claim for bond --->
        if (1 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        continue; 
        }
        // <--- ChoreographyTask_00l7an5 release bond --->
        if (5 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 32;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1h13qrq file dispute --->
        if (2 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        id = 0;
        continue; 
        }
        // <--- ChoreographyTask_0946is9 accept claim --->
        if (3 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 16;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_0235k4i transfer bond to landlord --->
        if (4 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 0;
        uint8 decimals = IERC20(tokens["usdc"]).decimals();
        IERC20(tokens["usdc"]).transferFrom(msg.sender, participants[2],800000000 * (10 ** decimals)/ 1e6);
        break; // is end
        }
      }
      if (_tokenState & 32 == 32) {
        // <--- ChoreographyTask_07z22w1 refund bond to tenant --->
        if (6 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(32);
        _tokenState |= 0;
        uint8 decimals = IERC20(tokens["usdc"]).decimals();
        IERC20(tokens["usdc"]).transferFrom(msg.sender, participants[0],800000000 * (10 ** decimals)/ 1e6);
        break; // is end
        }
      }
      if (_tokenState & 2 == 2) {
        // <--- ChoreographyTask_07mltd1 notify tenant of claim --->
        if (7 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(2);
        _tokenState |= 4;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_1fd84pn notify landlord --->
        if (8 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 0;
        break; // is end
        }
      }
      break;
    }
    
    tokenState = _tokenState;
  }

}