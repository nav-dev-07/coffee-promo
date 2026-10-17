import assert from "node:assert/strict";
import { test } from "node:test";
import { characterOffset, cursorStates, movementLook, parseCursor, resizeDirections, resolveCursorState } from "../app/components/coffee-cursor-states.ts";

test("all 36 approved states are addressable through CSS keywords / data-cursor", () => {
  assert.equal(new Set(cursorStates).size, 36);
  for (const cursor of cursorStates) {
    assert.equal(resolveCursorState({ cursor }), cursor);
    assert.equal(resolveCursorState({ cursor: "auto", override: cursor }), cursor);
  }
  assert.equal(parseCursor('url("data:image/svg+xml,a,b,c") 4 4, crosshair'), "crosshair");
  assert.equal(resolveCursorState({ cursor: "auto", override: "typo", interactive: true }), "pointer");
});

test("automatic cursors distinguish links, text, and vertical writing", () => {
  assert.equal(resolveCursorState({ cursor: "auto" }), "default");
  assert.equal(resolveCursorState({ cursor: "auto", interactive: true, overText: true }), "pointer");
  assert.equal(resolveCursorState({ cursor: "auto", overText: true }), "text");
  assert.equal(resolveCursorState({ cursor: "auto", overText: true, verticalText: true }), "vertical-text");
  assert.equal(resolveCursorState({ cursor: "crosshair", overText: true }), "crosshair");
});

test("press reactions preserve disabled, text, zoom, and resize semantics", () => {
  assert.equal(resolveCursorState({ cursor: "pointer", pressed: true }), "pressed");
  assert.equal(resolveCursorState({ cursor: "auto", clickPulse: true }), "pressed");
  for (const cursor of ["not-allowed", "no-drop", "text", "vertical-text", "zoom-in", "ew-resize", "wait"]) {
    assert.equal(resolveCursorState({ cursor, pressed: true, clickPulse: true }), cursor);
  }
  assert.equal(resolveCursorState({ cursor: "pointer", override: "copy", disabled: true, pressed: true }), "not-allowed");
});

test("dragging stays grabbed through pointer capture and releases without a click-pulse delay", () => {
  assert.equal(resolveCursorState({ cursor: "grab", pressed: true }), "grabbing");
  assert.equal(resolveCursorState({ cursor: "pointer", override: "grab", dragging: true }), "grabbing");
  assert.equal(resolveCursorState({ cursor: "grab", clickPulse: true }), "grab");
  assert.equal(resolveCursorState({ cursor: "grab", dragState: "copy" }), "copy");
  assert.equal(resolveCursorState({ cursor: "grab", dragState: "alias" }), "alias");
  assert.equal(resolveCursorState({ cursor: "grab", dragState: "no-drop" }), "no-drop");
});

test("loading and explicitly hidden cursors take priority over hover/click", () => {
  assert.equal(resolveCursorState({ cursor: "pointer", busy: true, pressed: true }), "progress");
  assert.equal(resolveCursorState({ cursor: "pointer", busy: true, override: "wait" }), "wait");
  assert.equal(resolveCursorState({ cursor: "none", busy: true, disabled: true, pressed: true }), "none");
  assert.equal(resolveCursorState({ cursor: "pointer", override: "none", dragging: true }), "none");
});

test("every resize direction uses the correct single/double-ended geometry", () => {
  assert.equal(resizeDirections["n-resize"].angle, -90);
  assert.equal(resizeDirections["ne-resize"].angle, -45);
  assert.equal(resizeDirections["s-resize"].angle, 90);
  assert.equal(resizeDirections["w-resize"].angle, 180);
  assert.equal(resizeDirections["nesw-resize"].angle, -45);
  assert.equal(resizeDirections["nwse-resize"].angle, 45);
  assert.equal(resizeDirections["row-resize"].angle, 90);
  for (const [cursor, geometry] of Object.entries(resizeDirections)) {
    assert.equal(Boolean(geometry.double), /^(ew|ns|nesw|nwse|col|row)-resize$/.test(cursor));
  }
});

test("the eyes look in the movement direction with bounded, symmetric travel", () => {
  assert.deepEqual(movementLook(0, 0), { x: 0, y: 0 });
  const right = movementLook(10000, 0);
  assert.deepEqual(right, { x: 2.7, y: 0 });
  const diagonal = movementLook(15, -15);
  assert.ok(diagonal.x > 0 && diagonal.y < 0);
  assert.ok(Math.abs(diagonal.x + diagonal.y) < 0.00001);
  assert.ok(Math.hypot(diagonal.x, diagonal.y) <= 2.700001);
  assert.ok(movementLook(0.2, 0).x < right.x);
  const reverse = movementLook(-15, 15);
  assert.equal(reverse.x, -diagonal.x);
  assert.equal(reverse.y, -diagonal.y);
});

test("the character stays on screen near the scrollbar and bottom edge without moving its hotspot", () => {
  const width = 1440;
  const height = 900;
  for (const [x, y] of [[720, 450], [1438, 450], [720, 898], [1438, 898]]) {
    const offset = characterOffset(x, y, width, height);
    const left = x + (0 + offset.x - 16) * 2 / 3;
    const right = x + (96 + offset.x - 16) * 2 / 3;
    const top = y + (0 + offset.y - 18) * 2 / 3;
    const bottom = y + (78 + offset.y - 18) * 2 / 3;
    assert.ok(left >= 0 && right <= width);
    assert.ok(top >= 0 && bottom <= height);
  }
  assert.deepEqual(characterOffset(720, 450, width, height), { x: 0, y: 0 });
});
