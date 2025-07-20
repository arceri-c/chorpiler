const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RentalAgreement", function () {
  let tokenUSDC, rental, owner, tenant, landlord, agent;
  const bondAmount = 800_000_000n; // 800 USDC

  beforeEach(async function () {
    [owner, tenant, landlord, agent] = await ethers.getSigners();

    // Deploy mock USDC token (6 decimals)
    const Token = await ethers.getContractFactory("MockToken");
    tokenUSDC = await Token.deploy("USDC", "USDC", 6);
    await tokenUSDC.waitForDeployment();

    // Mint tokens to landlord (who will transfer bond)
    await tokenUSDC.mint(landlord.address, bondAmount);

    // Deploy RentalAgreement
    const RentalAgreement = await ethers.getContractFactory("RentalAgreement");
    rental = await RentalAgreement.deploy(
      [tenant.address, landlord.address, agent.address, owner.address],
      [await tokenUSDC.getAddress()]
    );
    await rental.waitForDeployment();

    // Approve contract to move landlord's USDC
    await tokenUSDC.connect(landlord).approve(
      await rental.getAddress(),
      bondAmount
    );
  });

  it("should transfer bond to landlord", async function () {
    const decimals = await tokenUSDC.decimals();
    const transferAmount = (bondAmount * (10n ** BigInt(decimals))) / 1_000_000n;

    await rental.connect(agent).enact(1);
    expect(await rental.tokenState()).to.equal(2); // state moves to 2

    await rental.connect(landlord).enact(7);
    expect(await rental.tokenState()).to.equal(4); // state moves to 4

    await rental.connect(tenant).enact(3);
    expect(await rental.tokenState()).to.equal(16); // state moves to 16

    await expect(() =>
      rental.connect(landlord).enact(4)
    ).to.changeTokenBalances(
      tokenUSDC,
      [landlord, agent],
      [-transferAmount, transferAmount]
    );

    expect(await rental.tokenState()).to.equal(0);
  });

  it("should refund bond to tenant if no claim", async function () {
    const decimals = await tokenUSDC.decimals();
    const transferAmount = (bondAmount * (10n ** BigInt(decimals))) / 1_000_000n;

    await rental.connect(agent).enact(5);
    expect(await rental.tokenState()).to.equal(32); // state moves to 32

    await expect(() =>
      rental.connect(landlord).enact(6)
    ).to.changeTokenBalances(
      tokenUSDC,
      [landlord, tenant],
      [-transferAmount, transferAmount]
    );

    expect(await rental.tokenState()).to.equal(0);
  });
  
});
