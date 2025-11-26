import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import { ProposalResolved } from "../generated/schema"
import { ProposalResolved as ProposalResolvedEvent } from "../generated/PrivateProposal/PrivateProposal"
import { handleProposalResolved } from "../src/private-proposal"
import { createProposalResolvedEvent } from "./private-proposal-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let winningChoice = 123
    let passed = "boolean Not implemented"
    let newProposalResolvedEvent = createProposalResolvedEvent(
      winningChoice,
      passed
    )
    handleProposalResolved(newProposalResolvedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ProposalResolved created and stored", () => {
    assert.entityCount("ProposalResolved", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ProposalResolved",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "winningChoice",
      "123"
    )
    assert.fieldEquals(
      "ProposalResolved",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "passed",
      "boolean Not implemented"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
