// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { RSA_PKCS1_OAEP_PADDING, RSA_PKCS1_PADDING } from "constants";
import { JsonWebKey, KeyOperation } from "../keysModels";
import crypto from "crypto";
import {
  EncryptOptions,
  EncryptParameters,
  EncryptResult,
  KeyWrapAlgorithm,
  VerifyOptions,
  VerifyResult,
  WrapKeyOptions,
  WrapResult
} from "..";
import { isNode } from "@azure/core-http";
import { convertJWKtoPEM } from "./conversions";
import { LocalCryptographyUnsupportedError, LocalSupportedAlgorithmName } from "./models";
import { SignatureAlgorithm } from "../cryptographyClientModels";
import { createHash } from "./hash";

/**
 * An interface representing a local-only cryptography provider.
 * @internal
 */
export interface LocalCryptographyProvider {
  /**
   * Encrypts the given plaintext with the specified cryptography algorithm using the provided key.
   * @param key - The key to use for encryption.
   * @param encryptParameters - The encryption parameters.
   * @param options - Additional options.
   * @internal
   */
  encrypt(
    key: JsonWebKey,
    encryptParameters: EncryptParameters,
    options: EncryptOptions
  ): Promise<EncryptResult>;

  /**
   * Returns whether this provider supports the given encryption algorithm.
   * @param algorithm - The algorithm to check.
   * @internal
   */
  isApplicable(algorithm: LocalSupportedAlgorithmName): boolean;

  /**
   * Wraps the given key using the specified cryptography algorithm and provided key.
   * @param key - The key to use for wrapping.
   * @param algorithm - The encryption algorithm to use to wrap the given key.
   * @param keyToWrap - The key to wrap.
   * @param options - Additional options.
   * @internal
   */
  wrapKey(
    key: JsonWebKey,
    algorithm: KeyWrapAlgorithm,
    keyToWrap: Uint8Array,
    options: WrapKeyOptions
  ): Promise<WrapResult>;

  /**
   * Verify the signed block of data.
   * @param key - The key to use for verification.
   * @param algorithm - The encryption algorithm to use for verification.
   * @param data - The signed block of data to verify.
   * @param signature  - The signature to verify the block against.
   * @param options - Additional options.
   * @internal
   */
  verifyData(
    key: JsonWebKey,
    algorithm: SignatureAlgorithm,
    data: Uint8Array,
    signature: Uint8Array,
    options: VerifyOptions
  ): Promise<VerifyResult>;

  /**
   * Hashes a block of data using a given algorithm.
   * @param algorithm - The encryption algorithm to use for hashing.
   * @param data - The data to hash.
   * @internal
   */
  createHash(algorithm: SignatureAlgorithm, data: Uint8Array): Promise<Buffer>;
}

/**
 * An RSA cryptography provider supporting RSA algorithms.
 */
export class RsaCryptographyProvider implements LocalCryptographyProvider {
  ensureValid(operationName: string, key?: JsonWebKey): void {
    if (!isNode) {
      throw new LocalCryptographyUnsupportedError("This operation is only available in NodeJS");
    }
    if (key && key.keyOps && !key.keyOps.includes(operationName as KeyOperation)) {
      throw new Error(`Key does not support the ${operationName} operation`);
    }
    if (key && key.kty! !== "RSA" && key.kty! !== "RSA-HSM") {
      throw new Error("Key type does not match the algorithm RSA");
    }
  }

  isApplicable(algorithm: LocalSupportedAlgorithmName): boolean {
    return this.applicableAlgorithms.includes(algorithm);
  }

  encrypt(
    key: JsonWebKey,
    encryptParameters: EncryptParameters,
    _options: EncryptOptions
  ): Promise<EncryptResult> {
    this.ensureValid("encrypt", key);
    const keyPEM = convertJWKtoPEM(key);

    const padding =
      encryptParameters.algorithm === "RSA1_5" ? RSA_PKCS1_PADDING : RSA_PKCS1_OAEP_PADDING;

    return Promise.resolve({
      algorithm: encryptParameters.algorithm,
      keyID: key.kid,
      result: crypto.publicEncrypt(
        { key: keyPEM, padding: padding },
        Buffer.from(encryptParameters.plaintext)
      )
    });
  }

  wrapKey(
    key: JsonWebKey,
    algorithm: KeyWrapAlgorithm,
    keyToWrap: Uint8Array,
    _options: WrapKeyOptions
  ): Promise<WrapResult> {
    this.ensureValid("wrapKey", key);
    const keyPEM = convertJWKtoPEM(key);

    const padding = algorithm === "RSA1_5" ? RSA_PKCS1_PADDING : RSA_PKCS1_OAEP_PADDING;

    return Promise.resolve({
      algorithm: algorithm as KeyWrapAlgorithm,
      result: crypto.publicEncrypt({ key: keyPEM, padding }, Buffer.from(keyToWrap)),
      keyID: key.kid
    });
  }

  verifyData(
    key: JsonWebKey,
    algorithm: SignatureAlgorithm,
    data: Uint8Array,
    signature: Uint8Array,
    _options: VerifyOptions
  ): Promise<VerifyResult> {
    this.ensureValid("verify", key);
    const keyPEM = convertJWKtoPEM(key);

    const verifyAlgorithm = this.signatureAlgorithmToHashAlgorithm[algorithm];
    if (!verifyAlgorithm) {
      throw new Error(`Invalid signature algorithm ${algorithm} passed to local verifyData`);
    }

    const verifier = crypto.createVerify(verifyAlgorithm);
    verifier.update(Buffer.from(data));
    verifier.end();
    return Promise.resolve({
      result: verifier.verify(keyPEM, Buffer.from(signature)),
      keyID: key.kid
    });
  }

  createHash(algorithm: SignatureAlgorithm, data: Uint8Array): Promise<Buffer> {
    return createHash(this.signatureAlgorithmToHashAlgorithm[algorithm], data);
  }

  private applicableAlgorithms: LocalSupportedAlgorithmName[] = [
    "RSA1_5",
    "RSA-OAEP",
    "PS256",
    "RS256",
    "PS384",
    "RS384",
    "PS512",
    "RS512"
  ];

  /** Mapping between signature algorithms and their corresponding hash algorithms. Externally used for testing. */
  signatureAlgorithmToHashAlgorithm: { [s: string]: string } = {
    PS256: "SHA256",
    RS256: "SHA256",
    PS384: "SHA384",
    RS384: "SHA384",
    PS512: "SHA512",
    RS512: "SHA512"
  };
}

export class AesCryptographyProvider implements LocalCryptographyProvider {
  encrypt(
    key: JsonWebKey,
    encryptParameters: EncryptParameters,
    _options: EncryptOptions
  ): Promise<EncryptResult> {
    this.ensureValid("encrypt", key);
    let iv: Uint8Array;
    if ("iv" in encryptParameters) {
      iv = encryptParameters.iv;
    } else {
      iv = crypto.randomBytes(32);
    }

    const cryptoParams = this.algorithmNameToCryptoParams[encryptParameters.algorithm];

    // TODO: is this a valid use case???
    if (!cryptoParams) {
      throw new Error(
        `Invalid cryptography algorithm passed to encrypt ${encryptParameters.algorithm}`
      );
    }
    const cipher = crypto.createCipheriv(
      cryptoParams.name,
      key.k?.slice(0, cryptoParams.size >> 3),
      iv
    );
    let encrypted = cipher.update(Buffer.from(encryptParameters.plaintext));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return Promise.resolve({
      algorithm: encryptParameters.algorithm,
      result: encrypted,
      iv: iv
    });
  }

  ensureValid(operationName: string, key: JsonWebKey) {
    if (!isNode) {
      throw new LocalCryptographyUnsupportedError("This operation is only available in NodeJS");
    }
    if (key && key.keyOps && !key.keyOps.includes(operationName as KeyOperation)) {
      throw new Error(`Key does not support the ${operationName} operation`);
    }
    if (key && key.kty! !== "oct" && key.kty! !== "oct-HSM") {
      throw new Error("Key type does not match the algorithm oct");
    }
  }

  isApplicable(algorithm: LocalSupportedAlgorithmName) {
    return this.applicableAlgorithms.includes(algorithm);
  }

  wrapKey(
    _key: JsonWebKey,
    _algorithm: KeyWrapAlgorithm,
    _keyToWrap: Uint8Array,
    _options: WrapKeyOptions
  ): Promise<WrapResult> {
    throw new Error("Method not implemented.");
  }
  verifyData(
    _key: JsonWebKey,
    _algorithm: string,
    _data: Uint8Array,
    _signature: Uint8Array,
    _options: VerifyOptions
  ): Promise<VerifyResult> {
    throw new Error("Method not implemented.");
  }
  createHash(_algorithm: string, _data: Uint8Array): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }

  private applicableAlgorithms: LocalSupportedAlgorithmName[] = [
    "A128KW",
    "A192KW",
    "A256KW",
    "A128CBC",
    "A192CBC",
    "A256CBC",
    "A128CBCPAD",
    "A192CBCPAD",
    "A256CBCPAD"
  ];

  private algorithmNameToCryptoParams: {
    [s: string]: { name: string; size: number } | undefined;
  } = {
    A128KW: undefined,
    A192KW: undefined,
    A256KW: undefined,
    A128CBC: undefined,
    A192CBC: undefined,
    A256CBC: { name: "aes-256-cbc", size: 256 },
    A128CBCPAD: undefined,
    A192CBCPAD: undefined,
    A256CBCPAD: undefined
  };
}

export const localCryptographyProviders = [
  new RsaCryptographyProvider(),
  new AesCryptographyProvider()
];

export function isLocallySupported(algorithm: string): boolean {
  return (
    isNode &&
    localCryptographyProviders.some((provider) =>
      provider.isApplicable(algorithm as LocalSupportedAlgorithmName)
    )
  );
}

export function findLocalProvider(
  algorithm: LocalSupportedAlgorithmName
): LocalCryptographyProvider {
  const applicableProviders = localCryptographyProviders.filter((provider) =>
    provider.isApplicable(algorithm)
  );

  if (applicableProviders.length === 0) {
    // LocalCryptographyUnsupportedError will make us defer to the remote service.
    throw new LocalCryptographyUnsupportedError(
      `No local providers apply to algorithm ${algorithm}.`
    );
  }

  if (applicableProviders.length > 1) {
    // We should never have more than one local crypto provider, so failing fast will help us catch it in development.
    throw new Error(
      `Found multiple local providers that apply to algorithm ${algorithm} when expected at most one.`
    );
  }

  return applicableProviders[0];
}
