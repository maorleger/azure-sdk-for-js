// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  createTracingClient,
  TracingClient,
  TracingSpan,
  TracingSpanOptions
} from "@azure/core-tracing";
import {
  RequestPolicyFactory,
  RequestPolicy,
  RequestPolicyOptions,
  BaseRequestPolicy
} from "./requestPolicy";
import { WebResourceLike } from "../webResource";
import { HttpOperationResponse } from "../httpOperationResponse";
import { URLBuilder } from "../url";
import { logger } from "../log";

/**
 * Options to customize the tracing policy.
 */
export interface TracingPolicyOptions {
  /**
   * User agent used to better identify the outgoing requests traced by the tracing policy.
   */
  userAgent?: string;
}

/**
 * Creates a policy that wraps outgoing requests with a tracing span.
 * @param tracingOptions - Tracing options.
 * @returns An instance of the {@link TracingPolicy} class.
 */
export function tracingPolicy(tracingOptions: TracingPolicyOptions = {}): RequestPolicyFactory {
  return {
    create(nextPolicy: RequestPolicy, options: RequestPolicyOptions) {
      return new TracingPolicy(nextPolicy, options, tracingOptions);
    }
  };
}

/**
 * A policy that wraps outgoing requests with a tracing span.
 */
export class TracingPolicy extends BaseRequestPolicy {
  private userAgent?: string;
  private tracingClient: TracingClient;

  constructor(
    nextPolicy: RequestPolicy,
    options: RequestPolicyOptions,
    tracingOptions: TracingPolicyOptions
  ) {
    super(nextPolicy, options);
    this.userAgent = tracingOptions.userAgent;
    this.tracingClient = createTracingClient({ namespace: "", packageName: "@azure/core-http" });
  }

  public async sendRequest(request: WebResourceLike): Promise<HttpOperationResponse> {
    const path = URLBuilder.parse(request.url).getPath() || "/";

    // Passing spanOptions as part of tracingOptions to maintain compatibility @azure/core-tracing@preview.13 and earlier.
    // We can pass this as a separate parameter once we upgrade to the latest core-tracing.
    const spanOptions: TracingSpanOptions = {
      spanKind: "client"
    };

    const { span, tracingContext } = this.tracingClient.startSpan(
      path,
      { tracingOptions: { tracingContext: request.tracingContext } },
      spanOptions
    );

    span.setAttribute("http.method", request.method);
    span.setAttribute("http.url", request.url);
    span.setAttribute("requestId", request.requestId);

    if (this.userAgent) {
      span.setAttribute("http.user_agent", this.userAgent);
    }

    const requestHeaders = this.tracingClient.createRequestHeaders(span.spanContext);
    for (const headerName in requestHeaders) {
      request.headers.set(headerName, requestHeaders[headerName]);
    }

    try {
      const response = await this.tracingClient.withContext(
        tracingContext,
        this._nextPolicy.sendRequest,
        undefined,
        request
      );
      this.tryProcessResponse(span, response);
      return response;
    } catch (err) {
      this.tryProcessError(span, err);
      throw err;
    }
  }

  private tryProcessError(span: TracingSpan, error: any): void {
    try {
      span.setStatus({
        status: "error",
        error
      });

      if (error.statusCode) {
        span.setAttribute("http.status_code", error.statusCode);
      }
      span.end();
    } catch (error) {
      logger.warning(`Skipping tracing span processing due to an error: ${error.message}`);
    }
  }

  private tryProcessResponse(span: TracingSpan, response: HttpOperationResponse): void {
    try {
      span.setAttribute("http.status_code", response.status);
      const serviceRequestId = response.headers.get("x-ms-request-id");
      if (serviceRequestId) {
        span.setAttribute("serviceRequestId", serviceRequestId);
      }
      span.setStatus({ status: "success" });
      span.end();
    } catch (error) {
      logger.warning(`Skipping tracing span processing due to an error: ${error.message}`);
    }
  }
}
