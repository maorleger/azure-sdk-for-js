// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import type { NetworkInterfacesListVirtualMachineScaleSetNetworkInterfacesParameters } from "@azure-rest/arm-network";
import createNetworkManagementClient, { paginate } from "@azure-rest/arm-network";
import { DefaultAzureCredential } from "@azure/identity";
import "dotenv/config";

/**
 * This sample demonstrates how to Gets all network interfaces in a virtual machine scale set.
 *
 * @summary Gets all network interfaces in a virtual machine scale set.
 * x-ms-original-file: specification/network/resource-manager/Microsoft.Network/stable/2022-05-01/examples/VmssNetworkInterfaceList.json
 */
async function listVirtualMachineScaleSetNetworkInterfaces(): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = createNetworkManagementClient(credential);
  const subscriptionId = "";
  const resourceGroupName = "rg1";
  const virtualMachineScaleSetName = "vmss1";
  const options: NetworkInterfacesListVirtualMachineScaleSetNetworkInterfacesParameters = {
    queryParameters: { "api-version": "2018-10-01" },
  };
  const initialResponse = await client
    .path(
      "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/microsoft.Compute/virtualMachineScaleSets/{virtualMachineScaleSetName}/networkInterfaces",
      subscriptionId,
      resourceGroupName,
      virtualMachineScaleSetName,
    )
    .get(options);
  const pageData = paginate(client, initialResponse);
  const result = [];
  for await (const item of pageData) {
    result.push(item);
  }
  console.log(result);
}

listVirtualMachineScaleSetNetworkInterfaces().catch(console.error);
