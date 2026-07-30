import { describe, expect, it } from "vitest";
import {
  classifySensitivity,
  confidenceFor,
  kindFor,
  parseExport,
  parseExportLine,
  slotConflicts,
} from "../src/knowledge/exports.ts";

const line = (raw: string, source = "chatgpt") => parseExportLine(raw, source);

describe("parseExportLine", () => {
  it("parses the agreed contract", () => {
    const parsed = line("PATTERN | delegation | OBSERVED | He hands the decision back | July 9");
    expect(parsed?.type).toBe("PATTERN");
    expect(parsed?.field).toBe("delegation");
    expect(parsed?.provenance).toBe("OBSERVED");
    expect(parsed?.statement).toBe("He hands the decision back");
    expect(parsed?.basis).toBe("July 9");
  });

  it("strips the pass labels ChatGPT added to every line", () => {
    const parsed = line("PREFERENCE | research | OBSERVED | [HISTORY] Prefers sourced research | July");
    expect(parsed?.statement).toBe("Prefers sourced research");
  });

  it("flags lines Grok drew from public activity", () => {
    const parsed = line("FACT | posting | OBSERVED | SOURCE=X Posts about builds | X activity", "grok");
    expect(parsed?.publicSource).toBe(true);
    expect(parsed?.statement).toBe("Posts about builds");
  });

  it("rejects prose and half-formed rows rather than guessing", () => {
    expect(line("CHANGED: things that were true once")).toBeNull();
    expect(line("FACT | thing | MAYBE | statement | basis")).toBeNull();
    expect(line("FACT | thing")).toBeNull();
    // A basis containing a pipe must not break the statement.
    const parsed = line("FACT | x | OBSERVED | A claim | July 9 | second thought");
    expect(parsed?.statement).toBe("A claim");
    expect(parsed?.basis).toBe("July 9 | second thought");
  });
});

describe("sensitivity", () => {
  it("catches sensitive subjects by field name", () => {
    const parsed = line("FACT | recovery | OBSERVED | A sobriety date | May")!;
    expect(classifySensitivity(parsed)).toContain("recovery");
  });

  it("catches sensitive content filed under an innocuous field", () => {
    // The real failure mode: a legal matter tagged as a behaviour pattern.
    const parsed = line("PATTERN | focus | OBSERVED | Appealing a CPS finding | July")!;
    expect(classifySensitivity(parsed)).toBe("child-protective matter");
  });

  it("catches family detail inside an ordinary statement", () => {
    const parsed = line("FACT | shopping | OBSERVED | Bought a pool for my boys | July 25")!;
    expect(classifySensitivity(parsed)).toBe("family detail");
  });

  it("leaves ordinary working preferences alone", () => {
    const parsed = line("PREFERENCE | deliverables | OBSERVED | Wants finished files not advice | July")!;
    expect(classifySensitivity(parsed)).toBeNull();
  });
});

describe("confidence and kind", () => {
  it("keeps second-hand claims well below a first-hand statement", () => {
    expect(confidenceFor("OBSERVED", false)).toBe(0.55);
    expect(confidenceFor("INFERRED", false)).toBe(0.35);
    // Public posting is weaker evidence than a private conversation.
    expect(confidenceFor("OBSERVED", true)).toBeCloseTo(0.45);
  });

  it("never stores a second-hand claim as undecaying identity", () => {
    const parsed = line("BOUNDARY | complexity | OBSERVED | No extra agents | July 29")!;
    expect(kindFor(parsed)).toBe("semantic");
  });
});

describe("parseExport", () => {
  const text = `
SLOT | name | OBSERVED | Big Daddy | explicit request
FACT | legal_context | OBSERVED | Charges dismissed | 2026
PREFERENCE | output | OBSERVED | Blunt over encouraging | this query
CHANGED: some prose that is not a row
`;

  it("routes slots, sensitive lines and storable lines separately", () => {
    const parsed = parseExport(text, "grok");
    expect(parsed.slots).toHaveLength(1);
    expect(parsed.sensitive).toHaveLength(1);
    expect(parsed.storable).toHaveLength(1);
    expect(parsed.storable[0]?.field).toBe("output");
  });

  it("never routes an identity slot into storage, sensitive or not", () => {
    const parsed = parseExport("SLOT | values | OBSERVED | Family survival first | talks", "grok");
    expect(parsed.storable).toHaveLength(0);
    expect(parsed.slots).toHaveLength(1);
  });
});

describe("slotConflicts", () => {
  it("surfaces disagreement between models instead of picking a winner", () => {
    const slots = [
      line("SLOT | name | INFERRED | Malachi | doc naming", "claude")!,
      line("SLOT | name | OBSERVED | Matthew R. Jaynes | resume", "chatgpt")!,
      line("SLOT | name | OBSERVED | Big Daddy | explicit request", "grok")!,
    ];
    const conflicts = slotConflicts(slots);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.slot).toBe("name");
    expect(conflicts[0]?.claims).toHaveLength(3);
  });

  it("stays quiet when the models agree", () => {
    const slots = [
      line("SLOT | style | OBSERVED | Direct and concrete | July", "claude")!,
      line("SLOT | style | OBSERVED | direct and concrete | July", "chatgpt")!,
    ];
    expect(slotConflicts(slots)).toHaveLength(0);
  });
});
