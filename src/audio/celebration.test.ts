import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playCelebration, resetCelebrationAudio } from "./celebration";

class FakeAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class FakeOscillator {
  type = "sine";
  frequency = new FakeAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeGain {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  currentTime = 0;
  destination = {};
  state = "running";
  resume = vi.fn(async () => undefined);
  createOscillator = vi.fn(() => new FakeOscillator());
  createGain = vi.fn(() => new FakeGain());

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

function installFakeAudioContext(): void {
  (window as unknown as { AudioContext?: unknown }).AudioContext = FakeAudioContext;
}

function removeAudioContext(): void {
  delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
}

describe("playCelebration", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    resetCelebrationAudio();
    installFakeAudioContext();
  });

  afterEach(() => {
    removeAudioContext();
    resetCelebrationAudio();
  });

  it("plays a short three-note chime", () => {
    playCelebration();

    const context = FakeAudioContext.instances[0];
    expect(context).toBeDefined();
    expect(context?.createOscillator).toHaveBeenCalledTimes(3);
    expect(context?.createGain).toHaveBeenCalledTimes(3);
    expect(context?.resume).toHaveBeenCalled();
  });

  it("reuses the same audio context across plays", () => {
    playCelebration();
    playCelebration();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0]?.createOscillator).toHaveBeenCalledTimes(6);
  });

  it("stays silent instead of throwing when audio is unavailable", () => {
    removeAudioContext();

    expect(() => playCelebration()).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });
});
