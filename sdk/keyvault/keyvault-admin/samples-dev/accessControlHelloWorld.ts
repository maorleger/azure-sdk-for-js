// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * @summary Uses an AccessControlClient to list, create, and assign roles to users.
 */

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new JaegerExporter()));

provider.register();
registerInstrumentations({
  instrumentations: [getNodeAutoInstrumentations()]
});
import {
  KeyVaultAccessControlClient,
  KeyVaultPermission,
  KnownKeyVaultDataAction,
  KnownKeyVaultRoleScope
} from "@azure/keyvault-admin";
import { DefaultAzureCredential } from "@azure/identity";
import * as uuid from "uuid";
import {
  SpanStatus,
  Tracer,
  TracerCreateSpanOptions,
  TracingContext,
  TracingSpan,
  useTracer
} from "@azure/core-tracing";
import * as api from "@opentelemetry/api";
import { SpanAttributeValue } from "@opentelemetry/api";
// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

export class OpenTelemetryTracer implements Tracer {
  startSpan(
    name: string,
    options: TracerCreateSpanOptions
  ): { span: TracingSpan; tracingContext: TracingContext } {
    let context = options.tracingContext || api.context.active();
    const span = api.trace.getTracer("@azure/core-tracing").startSpan(name);
    context = api.trace.setSpan(context, span);
    return {
      span: new OpenTelemetrySpanWrapper(span),
      tracingContext: context
    };
  }
  withContext<Callback extends (args: Parameters<Callback>) => ReturnType<Callback>>(
    callback: Callback,
    options: TracerCreateSpanOptions, // todo: should context actually be required??
    callbackThis?: ThisParameterType<Callback>,
    ...callbackArgs: Parameters<Callback>
  ): ReturnType<Callback> {
    return api.context.with(
      options.tracingContext || api.context.active(),
      callback,
      callbackThis,
      ...callbackArgs
    );
  }
}

class OpenTelemetrySpanWrapper implements TracingSpan {
  constructor(private span: api.Span) {}
  setStatus(status: SpanStatus): void {
    if (status.status === "error") {
      this.span.setStatus({
        code: api.SpanStatusCode.ERROR,
        message: status.error.toString()
      });
      this.span.recordException(status.error);
    } else {
      this.span.setStatus({
        code: api.SpanStatusCode.OK
      });
    }
  }
  setAttribute(name: string, value: unknown): void {
    this.span.setAttribute(name, value as SpanAttributeValue);
  }
  end(): void {
    this.span.end();
  }
  unwrap(): unknown {
    return this.span;
  }
}
export async function main(): Promise<void> {
  useTracer(new OpenTelemetryTracer());
  // DefaultAzureCredential expects the following three environment variables:
  // - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
  // - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
  // - AZURE_CLIENT_SECRET: The client secret for the registered application
  const credential = new DefaultAzureCredential();
  const url = process.env["AZURE_MANAGEDHSM_URI"];
  if (!url) {
    throw new Error("Missing environment variable AZURE_MANAGEDHSM_URI.");
  }
  const client = new KeyVaultAccessControlClient(url, credential);
  await client.createRoleAssignment("/", "foobar", "fff", "fdfd");

  for await (const roleAssignment of client.listRoleAssignments("/")) {
    console.log(roleAssignment);
  }

  const globalScope = KnownKeyVaultRoleScope.Global;
  const roleDefinitionName = uuid.v4();
  const permissions: KeyVaultPermission[] = [
    {
      dataActions: [KnownKeyVaultDataAction.StartHsmBackup, KnownKeyVaultDataAction.StartHsmRestore]
    }
  ];
  let roleDefinition = await client.setRoleDefinition(globalScope, {
    roleDefinitionName,
    roleName: "Backup Manager",
    permissions,
    description: "Allow backup actions"
  });
  console.log(roleDefinition);

  // This sample uses a custom role but you may assign one of the many built-in roles.
  // Please refer to https://docs.microsoft.com/azure/key-vault/managed-hsm/built-in-roles for more information.
  const roleAssignmentName = uuid.v4();
  const clientObjectId = process.env["CLIENT_OBJECT_ID"];
  if (!clientObjectId) {
    throw new Error("Missing environment variable CLIENT_OBJECT_ID.");
  }
  let assignment = await client.createRoleAssignment(
    globalScope,
    roleAssignmentName,
    roleDefinition.id,
    clientObjectId
  );
  console.log(assignment);

  assignment = await client.getRoleAssignment(globalScope, roleAssignmentName);
  console.log(assignment);

  await client.deleteRoleAssignment(globalScope, roleAssignmentName);

  await client.deleteRoleDefinition(globalScope, roleDefinition.name);
}

main().catch((err) => {
  console.log("error code: ", err.code);
  console.log("error message: ", err.message);
  console.log("error stack: ", err.stack);
});
