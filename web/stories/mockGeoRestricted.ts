import { mocked } from "storybook/test";

import { isGeoRestricted } from "../src/utils/geoRestriction";

// Use as a story's `beforeEach`. It returns the cleanup, so the next story
// renders unrestricted again.
export function mockGeoRestricted() {
  mocked(isGeoRestricted).mockReturnValue(true);
  return () => mocked(isGeoRestricted).mockReset();
}
