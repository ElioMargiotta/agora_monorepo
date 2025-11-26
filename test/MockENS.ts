import { expect } from "chai";
import { ethers } from "hardhat";
import { MockENS } from "../types/contracts/MockENS";

describe("MockENS", function () {
  let mockENS: MockENS;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockENSFactory = await ethers.getContractFactory("MockENS");
    mockENS = await MockENSFactory.deploy();
    await mockENS.waitForDeployment();
  });

  describe("Subdomain creation", function () {
    it("should create a subdomain under .agora", async function () {
      const label = ethers.keccak256(ethers.toUtf8Bytes("agora"));
      const agoraNode = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [ethers.ZeroHash, label]));

      // Set owner of .agora to owner
      await mockENS.setNodeOwner(agoraNode, owner.address);

      // Create subdomain test.agora to addr1
      const testLabel = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await mockENS.setSubnodeOwner(agoraNode, testLabel, addr1.address);

      // Check owner
      const testNode = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [agoraNode, testLabel]));
      expect(await mockENS.owner(testNode)).to.equal(addr1.address);
    });

    it("should fail to create the same subdomain with different address from unauthorized account", async function () {
      const label = ethers.keccak256(ethers.toUtf8Bytes("agora"));
      const agoraNode = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [ethers.ZeroHash, label]));

      // Set owner of .agora to owner
      await mockENS.setNodeOwner(agoraNode, owner.address);

      // Create subdomain test.agora to addr1
      const testLabel = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await mockENS.setSubnodeOwner(agoraNode, testLabel, addr1.address);

      // Now, try to set the same subnode to addr2 from addr2 (not owner)
      await expect(mockENS.connect(addr2).setSubnodeOwner(agoraNode, testLabel, addr2.address)).to.be.revertedWithCustomError(mockENS, "NotOwner");
    });

    it("should fail to register an already owned ENS from unauthorized account", async function () {
      const label = ethers.keccak256(ethers.toUtf8Bytes("example"));
      const exampleNode = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [ethers.ZeroHash, label]));

      // Set owner of .example to addr1
      await mockENS.setNodeOwner(exampleNode, addr1.address);

      // Now, try to set the same node to addr2 from addr2 (not owner)
      await expect(mockENS.connect(addr2).setOwner(exampleNode, addr2.address)).to.be.revertedWithCustomError(mockENS, "NotAuthorized");
    });

    it("should allow the owner to change the owner of their ENS", async function () {
      const label = ethers.keccak256(ethers.toUtf8Bytes("mydomain"));
      const mydomainNode = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes32", "bytes32"], [ethers.ZeroHash, label]));

      // Set owner of .mydomain to addr1
      await mockENS.setNodeOwner(mydomainNode, addr1.address);

      // Now, addr1 changes the owner to addr2
      await mockENS.connect(addr1).setOwner(mydomainNode, addr2.address);

      // Check that owner is now addr2
      expect(await mockENS.owner(mydomainNode)).to.equal(addr2.address);
    });
  });
});
