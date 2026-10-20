// Minimal expect() on top of node:assert, so tests need no extra test framework.
import assert from "node:assert/strict";
export function expect(a: any) {
  const m = {
    toBe: (b: any) => assert.equal(a, b),
    toEqual: (b: any) => assert.deepEqual(a, b),
    toThrow: () => assert.throws(a),
    toContain: (b: any) => assert.ok(a.includes(b), `expected to contain ${b}`),
    toMatch: (r: RegExp) => assert.match(a, r),
    toHaveLength: (n: number) => assert.equal(a.length, n),
    toBeTruthy: () => assert.ok(a),
    not: {
      toContain: (b: any) => assert.ok(!a.includes(b), `expected not to contain ${b}`),
      toMatch: (r: RegExp) => assert.doesNotMatch(a, r),
    },
  };
  return m;
}
