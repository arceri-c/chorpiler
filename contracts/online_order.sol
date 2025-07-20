//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract OnlineOrder {
  uint public tokenState = 1;
  address[3] public participants;
  mapping(string => address) public tokens;
  bool public items = true;

  constructor(address[3] memory _participants, address[2] memory _tokenAddresses ) {
    participants = _participants;
    tokens["usdc"] = _tokenAddresses[0];
    tokens["wtbc"] = _tokenAddresses[1];
  }

  function enact(uint id) external payable {
    uint _tokenState = tokenState;
    
    while(_tokenState != 0) {
      if (_tokenState & 1 == 1) {
        // <--- ChoreographyTask_0hy9n0g place order --->
        if (1 == id && msg.sender == participants[0]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(1);
        _tokenState |= 2;
        id = 0;
        uint8 decimals = IERC20(tokens["usdc"]).decimals();
        IERC20(tokens["usdc"]).transferFrom(msg.sender, participants[1], 10 * (10 ** decimals));
        continue; 
        }
      }
      if (_tokenState & 2 == 2) {
        if (items==true) {
          // <---  auto transition  --->
          _tokenState &= ~uint(2);
          _tokenState |= 8;
          continue; 
        }
        else {
          // <--- ChoreographyTask_1b2vkz9 confirm ETA --->
          if (2 == id && msg.sender == participants[1]) {
          // <--- custom code for task here --->
          _tokenState &= ~uint(2);
          _tokenState |= 4;
          id = 0;
          continue; 
          }
        }
      }
      if (_tokenState & 4 == 4) {
        // <--- ChoreographyTask_1jrfmx8 announce shipment --->
        if (3 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(4);
        _tokenState |= 8;
        id = 0;
        continue; 
        }
      }
      if (_tokenState & 16 == 16) {
        // <--- ChoreographyTask_1797ws1 deliver package --->
        if (4 == id && msg.sender == participants[2]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(16);
        _tokenState |= 0;
        break; // is end
        }
      }
      if (_tokenState & 8 == 8) {
        // <--- ChoreographyTask_0c87dy1 hand over package --->
        if (5 == id && msg.sender == participants[1]) {
        // <--- custom code for task here --->
        _tokenState &= ~uint(8);
        _tokenState |= 16;
        uint8 decimals = IERC20(tokens["wtbc"]).decimals();
        IERC20(tokens["wtbc"]).transferFrom(msg.sender, participants[2],1 * (10 ** decimals));
        id = 0;
        continue; 
        }
      }
      break;
    }
    
    tokenState = _tokenState;
  }

}