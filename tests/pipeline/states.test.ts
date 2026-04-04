import { describe, it, expect } from "vitest";
import {
  PIPELINE_STATES,
  getNextState,
  isValidTransition,
  getErrorState,
  STATE_TO_STAGE,
} from "../../src/pipeline/states";

describe("PIPELINE_STATES", () => {
  it("contains all expected states in order", () => {
    expect(PIPELINE_STATES).toEqual([
      "queued",
      "ingested",
      "cleaned",
      "segmented",
      "enriched",
      "qa_passed",
      "synthesized",
      "processed",
      "published",
    ]);
  });

  it("has 9 states", () => {
    expect(PIPELINE_STATES).toHaveLength(9);
  });

  it("starts with queued and ends with published", () => {
    expect(PIPELINE_STATES[0]).toBe("queued");
    expect(PIPELINE_STATES[PIPELINE_STATES.length - 1]).toBe("published");
  });
});

describe("getNextState", () => {
  it("returns ingested when current is queued", () => {
    expect(getNextState("queued")).toBe("ingested");
  });

  it("returns cleaned when current is ingested", () => {
    expect(getNextState("ingested")).toBe("cleaned");
  });

  it("advances through all intermediate states", () => {
    expect(getNextState("cleaned")).toBe("segmented");
    expect(getNextState("segmented")).toBe("enriched");
    expect(getNextState("enriched")).toBe("qa_passed");
    expect(getNextState("qa_passed")).toBe("synthesized");
    expect(getNextState("synthesized")).toBe("processed");
    expect(getNextState("processed")).toBe("published");
  });

  it("returns null for the final state published", () => {
    expect(getNextState("published")).toBeNull();
  });

  it("returns null for an unrecognized state", () => {
    expect(getNextState("unknown_state")).toBeNull();
  });
});

describe("isValidTransition", () => {
  it("allows forward sequential transitions", () => {
    expect(isValidTransition("queued", "ingested")).toBe(true);
    expect(isValidTransition("ingested", "cleaned")).toBe(true);
    expect(isValidTransition("cleaned", "segmented")).toBe(true);
    expect(isValidTransition("segmented", "enriched")).toBe(true);
    expect(isValidTransition("enriched", "qa_passed")).toBe(true);
    expect(isValidTransition("qa_passed", "synthesized")).toBe(true);
    expect(isValidTransition("synthesized", "processed")).toBe(true);
    expect(isValidTransition("processed", "published")).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(isValidTransition("queued", "cleaned")).toBe(false);
    expect(isValidTransition("ingested", "segmented")).toBe(false);
    expect(isValidTransition("queued", "published")).toBe(false);
  });

  it("rejects going backwards", () => {
    expect(isValidTransition("ingested", "queued")).toBe(false);
    expect(isValidTransition("published", "processed")).toBe(false);
  });

  it("allows any transition to an error_ state", () => {
    expect(isValidTransition("queued", "error_ingest")).toBe(true);
    expect(isValidTransition("ingested", "error_clean")).toBe(true);
    expect(isValidTransition("qa_passed", "error_synthesize")).toBe(true);
  });

  it("allows retry from error state to the previous valid state", () => {
    // error_ingested means failed during ingest (index 1), retry goes back to queued (index 0)
    expect(isValidTransition("error_ingested", "queued")).toBe(true);
  });

  it("rejects invalid retry from error state", () => {
    expect(isValidTransition("error_ingested", "ingested")).toBe(false);
    expect(isValidTransition("error_ingested", "cleaned")).toBe(false);
  });

  it("rejects transitions from unrecognized states", () => {
    expect(isValidTransition("unknown", "queued")).toBe(false);
    expect(isValidTransition("unknown", "ingested")).toBe(false);
  });
});

describe("getErrorState", () => {
  it("prefixes the stage with error_", () => {
    expect(getErrorState("ingest")).toBe("error_ingest");
    expect(getErrorState("clean")).toBe("error_clean");
    expect(getErrorState("synthesize")).toBe("error_synthesize");
    expect(getErrorState("publish")).toBe("error_publish");
  });
});

describe("STATE_TO_STAGE", () => {
  it("maps each non-terminal state to its processing stage", () => {
    expect(STATE_TO_STAGE["queued"]).toBe("ingest");
    expect(STATE_TO_STAGE["ingested"]).toBe("clean");
    expect(STATE_TO_STAGE["cleaned"]).toBe("segment");
    expect(STATE_TO_STAGE["segmented"]).toBe("enrich");
    expect(STATE_TO_STAGE["enriched"]).toBe("qa");
    expect(STATE_TO_STAGE["qa_passed"]).toBe("synthesize");
    expect(STATE_TO_STAGE["synthesized"]).toBe("postprocess");
    expect(STATE_TO_STAGE["processed"]).toBe("publish");
  });

  it("does not include published (terminal state has no next stage)", () => {
    expect(STATE_TO_STAGE["published"]).toBeUndefined();
  });
});
