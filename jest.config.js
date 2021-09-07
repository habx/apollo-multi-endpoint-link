module.exports = {
  ...require('@habx/config-ci-front/jest/config'),
  "testPathIgnorePatterns": [
    "/node_modules/",
    "sharedHttpTests.ts"
  ]
}
