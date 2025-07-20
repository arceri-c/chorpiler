const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Online Order", function () {
  let tokenUSDC, tokenWBTC, process;
  let owner, buyer, seller, courier;

  beforeEach(async function () {
    [owner, buyer, seller, courier] = await ethers.getSigners();

    // Deploy mock tokens
    const Token = await ethers.getContractFactory("MockToken");
    tokenUSDC = await Token.deploy("USDC", "USDC", 6);  // 6 decimals
    tokenWBTC = await Token.deploy("WBTC", "WBTC", 8);  // 8 decimals
    await tokenUSDC.waitForDeployment();
    await tokenWBTC.waitForDeployment();

    // Mint to participants
    const usdcAmount = 10n * 10n ** 6n; // 10 USDC
    const wbtcAmount = 1n * 10n ** 8n; // 1 WBTC

    await tokenUSDC.mint(buyer.address, usdcAmount);
    await tokenWBTC.mint(seller.address, wbtcAmount);

    // Deploy contract
    const OnlineOrder = await ethers.getContractFactory("OnlineOrder");
    process = await OnlineOrder.deploy(
      [buyer.address, seller.address, courier.address],
      [await tokenUSDC.getAddress(), await tokenWBTC.getAddress()]
    );
    await process.waitForDeployment();

    // Buyer approves contract to spend USDC
    await tokenUSDC.connect(buyer).approve(process.getAddress(), usdcAmount);

    // Seller approves contract to spend WBTC
    await tokenWBTC.connect(seller).approve(process.getAddress(), wbtcAmount);
  });

  it("should execute process and transfer tokens", async function () {
    const usdcAmount = 10n * 10n ** 6n;
    const wbtcAmount = 1n * 10n ** 8n;

    // Buyer places order and pays seller in USDC
    await expect(process.connect(buyer).enact(1))
      .to.changeTokenBalances(tokenUSDC, [buyer, seller], [-usdcAmount, usdcAmount]);

    // Seller hands over package and pays courier in WBTC
    await expect(process.connect(seller).enact(5))
      .to.changeTokenBalances(tokenWBTC, [seller, courier], [-wbtcAmount, wbtcAmount]);

    // Courier delivers package (no transfer)
    await process.connect(courier).enact(4);
    expect(await process.tokenState()).to.equal(0);
  });
});
