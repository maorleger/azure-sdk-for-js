// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * A union type representing the names of all of the locally supported algorithms.
 */
export type LocalSupportedAlgorithmName =
  | "RSA1_5"
  | "RSA-OAEP"
  | "PS256"
  | "RS256"
  | "PS384"
  | "RS384"
  | "PS512"
  | "RS512"
  | "A128KW"
  | "A192KW"
  | "A256KW"
  | "A128CBC"
  | "A192CBC"
  | "A256CBC"
  | "A128CBCPAD"
  | "A192CBCPAD"
  | "A256CBCPAD";

export class LocalCryptographyUnsupportedError extends Error {}
