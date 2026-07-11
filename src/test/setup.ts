import "@testing-library/jest-dom/vitest";

// jsdom does not provide a persistent-enough localStorage between describe
// blocks; clear before each test to keep persisted stores predictable.
import { beforeEach } from "vitest";

beforeEach(() => {
  window.localStorage.clear();
});
