/*
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 *
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is regenerated.
 */

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { GovernanceAssignment, SecurityCenter } from "@azure/arm-security";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

/**
 * This sample demonstrates how to Creates or updates a governance assignment on the given subscription.
 *
 * @summary Creates or updates a governance assignment on the given subscription.
 * x-ms-original-file: specification/security/resource-manager/Microsoft.Security/preview/2022-01-01-preview/examples/GovernanceAssignments/PutGovernanceAssignment_example.json
 */
async function createGovernanceAssignment(): Promise<void> {
  const scope =
    "subscriptions/c32e05d9-7207-4e22-bdf4-4f7d9c72e5fd/resourceGroups/compute_servers/providers/Microsoft.Compute/virtualMachines/win2012";
  const assessmentName = "6b9421dd-5555-2251-9b3d-2be58e2f82cd";
  const assignmentKey = "6634ff9f-127b-4bf2-8e6e-b1737f5e789c";
  const governanceAssignment: GovernanceAssignment = {
    additionalData: {
      ticketLink: "https://snow.com",
      ticketNumber: 123123,
      ticketStatus: "Active",
    },
    governanceEmailNotification: {
      disableManagerEmailNotification: false,
      disableOwnerEmailNotification: false,
    },
    isGracePeriod: true,
    owner: "user@contoso.com",
    remediationDueDate: new Date("2022-01-07T13:00:00.0000000Z"),
    remediationEta: {
      eta: new Date("2022-01-08T13:00:00.0000000Z"),
      justification: "Justification of ETA",
    },
  };
  const credential = new DefaultAzureCredential();
  const client = new SecurityCenter(credential);
  const result = await client.governanceAssignments.createOrUpdate(
    scope,
    assessmentName,
    assignmentKey,
    governanceAssignment,
  );
  console.log(result);
}

async function main(): Promise<void> {
  createGovernanceAssignment();
}

main().catch(console.error);
