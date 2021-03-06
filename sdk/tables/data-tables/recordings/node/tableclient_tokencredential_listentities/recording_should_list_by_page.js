let nock = require('nock');

module.exports.hash = "44b8d1b90df1b075f5dfd75add015626";

module.exports.testInfo = {"uniqueName":{},"newDate":{}}

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .get('/common/discovery/instance')
  .query(true)
  .reply(200, {"tenant_discovery_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/v2.0/.well-known/openid-configuration","api-version":"1.1","metadata":[{"preferred_network":"login.microsoftonline.com","preferred_cache":"login.windows.net","aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]},{"preferred_network":"login.partner.microsoftonline.cn","preferred_cache":"login.partner.microsoftonline.cn","aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]},{"preferred_network":"login.microsoftonline.de","preferred_cache":"login.microsoftonline.de","aliases":["login.microsoftonline.de"]},{"preferred_network":"login.microsoftonline.us","preferred_cache":"login.microsoftonline.us","aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]},{"preferred_network":"login-us.microsoftonline.com","preferred_cache":"login-us.microsoftonline.com","aliases":["login-us.microsoftonline.com"]}]}, [
  'Cache-Control',
  'max-age=86400, private',
  'Content-Type',
  'application/json; charset=utf-8',
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options',
  'nosniff',
  'Access-Control-Allow-Origin',
  '*',
  'Access-Control-Allow-Methods',
  'GET, OPTIONS',
  'P3P',
  'CP="DSP CUR OTPi IND OTRi ONL FIN"',
  'x-ms-request-id',
  '0761fd87-bd33-46b3-84cb-bb3a9a2d3800',
  'x-ms-ests-server',
  '2.1.11829.4 - EUS ProdSlices',
  'Set-Cookie',
  'fpc=Am7dTJW8_JpAtBhW6bg0-FLJVDEwAgAAAII3X9gOAAAA; expires=Mon, 19-Jul-2021 00:55:35 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7WevruOOLh95R1L_guFxwCP2-28kYLRPreHCPwapL0PBec--qxDZ_8nzLxHkhZuwHLv5ZmL5Eo5Ex2sJVtcKyK7FenCnrqJY7RFK8ZZGc95wFNF3o_vRPXO5dJ76ksB1_RAwlC_ir_oCzFA-pBOWmd9bNHQ5ojOqMAjEncUD7IXFEZswgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:55:34 GMT',
  'Content-Length',
  '980'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .get('/88888888-8888-8888-8888-888888888888/v2.0/.well-known/openid-configuration')
  .reply(200, {"token_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/oauth2/v2.0/token","token_endpoint_auth_methods_supported":["client_secret_post","private_key_jwt","client_secret_basic"],"jwks_uri":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/discovery/v2.0/keys","response_modes_supported":["query","fragment","form_post"],"subject_types_supported":["pairwise"],"id_token_signing_alg_values_supported":["RS256"],"response_types_supported":["code","id_token","code id_token","id_token token"],"scopes_supported":["openid","profile","email","offline_access"],"issuer":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/v2.0","request_uri_parameter_supported":false,"userinfo_endpoint":"https://graph.microsoft.com/oidc/userinfo","authorization_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/oauth2/v2.0/authorize","device_authorization_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/oauth2/v2.0/devicecode","http_logout_supported":true,"frontchannel_logout_supported":true,"end_session_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/oauth2/v2.0/logout","claims_supported":["sub","iss","cloud_instance_name","cloud_instance_host_name","cloud_graph_host_name","msgraph_host","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"],"kerberos_endpoint":"https://login.microsoftonline.com/88888888-8888-8888-8888-888888888888/kerberos","tenant_region_scope":"WW","cloud_instance_name":"microsoftonline.com","cloud_graph_host_name":"graph.windows.net","msgraph_host":"graph.microsoft.com","rbac_url":"https://pas.windows.net"}, [
  'Cache-Control',
  'max-age=86400, private',
  'Content-Type',
  'application/json; charset=utf-8',
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options',
  'nosniff',
  'Access-Control-Allow-Origin',
  '*',
  'Access-Control-Allow-Methods',
  'GET, OPTIONS',
  'P3P',
  'CP="DSP CUR OTPi IND OTRi ONL FIN"',
  'x-ms-request-id',
  '63adac0c-4d93-4567-a4a3-3152bd460400',
  'x-ms-ests-server',
  '2.1.11829.8 - EUS ProdSlices',
  'Set-Cookie',
  'fpc=Am7dTJW8_JpAtBhW6bg0-FLJVDEwAgAAAII3X9gOAAAA; expires=Mon, 19-Jul-2021 00:55:35 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7WevrzpZKaasZJ7sBggLsX8_JO3cuPNVxUKuIU_tjr7PXW65OygkwQ1gC_T_APshMf_IMYxvsOaZnuFyIWItSv_cE1BJJo1P8psOQhkygmZ4mpkvkLPu1o6Gomz8CnTOlbCykAdj_9Fgxj29qJy5BYSCWLJRMqcfTWRBHX6G0vpTwn-EgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT',
  'Content-Length',
  '1753'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .post('/88888888-8888-8888-8888-888888888888/oauth2/v2.0/token', "client_id=azure_client_id&scope=https%3A%2F%2Fsanitized%2F&grant_type=client_credentials&x-client-SKU=msal.js.node&x-client-VER=1.1.0&x-client-OS=linux&x-client-CPU=x64&x-ms-lib-capability=retry-after, h429&x-client-current-telemetry=2|771,0|,&x-client-last-telemetry=2|0|||0,0&client-request-id=91d12009-8e18-4828-9abe-eea97b8da357&client_secret=azure_client_secret")
  .reply(200, {"token_type":"Bearer","expires_in":86399,"ext_expires_in":86399,"access_token":"access_token"}, [
  'Cache-Control',
  'no-store, no-cache',
  'Pragma',
  'no-cache',
  'Content-Type',
  'application/json; charset=utf-8',
  'Expires',
  '-1',
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options',
  'nosniff',
  'P3P',
  'CP="DSP CUR OTPi IND OTRi ONL FIN"',
  'x-ms-request-id',
  '63adac0c-4d93-4567-a4a3-3152c4460400',
  'x-ms-ests-server',
  '2.1.11829.8 - EUS ProdSlices',
  'x-ms-clitelem',
  '1,0,0,,',
  'Set-Cookie',
  'fpc=Am7dTJW8_JpAtBhW6bg0-FLJVDEwAwAAAII3X9gOAAAA; expires=Mon, 19-Jul-2021 00:55:35 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT',
  'Content-Length',
  '1318'
]);

nock('https://fakeaccount.table.core.windows.net:443', {"encodedQueryParams":true})
  .get('/tableClientTestTokenCredentialnode()')
  .query(true)
  .reply(200, {"odata.metadata":"https://fakeaccount.table.core.windows.net/$metadata#tableClientTestTokenCredentialnode","value":[{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.7956301Z'\"","PartitionKey":"listEntitiesTest","RowKey":"0","Timestamp":"2021-06-19T00:55:33.7956301Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.838661Z'\"","PartitionKey":"listEntitiesTest","RowKey":"1","Timestamp":"2021-06-19T00:55:33.838661Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.1949167Z'\"","PartitionKey":"listEntitiesTest","RowKey":"10","Timestamp":"2021-06-19T00:55:34.1949167Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.2349455Z'\"","PartitionKey":"listEntitiesTest","RowKey":"11","Timestamp":"2021-06-19T00:55:34.2349455Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.2729723Z'\"","PartitionKey":"listEntitiesTest","RowKey":"12","Timestamp":"2021-06-19T00:55:34.2729723Z","foo":"testEntity"}]}, [
  'Cache-Control',
  'no-cache',
  'Transfer-Encoding',
  'chunked',
  'Content-Type',
  'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
  'Server',
  'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
  'x-ms-request-id',
  '7c52f699-1002-0129-15a5-64b1a8000000',
  'x-ms-client-request-id',
  '9412cd7e-a8fe-4bd1-a9c2-4ce5b68695b5',
  'x-ms-version',
  '2019-02-02',
  'X-Content-Type-Options',
  'nosniff',
  'x-ms-continuation-NextPartitionKey',
  '1!24!bGlzdEVudGl0aWVzVGVzdA--',
  'x-ms-continuation-NextRowKey',
  '1!4!MTM-',
  'Access-Control-Expose-Headers',
  'x-ms-request-id,x-ms-client-request-id,Server,x-ms-version,X-Content-Type-Options,Cache-Control,x-ms-continuation-NextPartitionKey,x-ms-continuation-NextRowKey,Content-Type,Content-Length,Date,Transfer-Encoding',
  'Access-Control-Allow-Origin',
  '*',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT'
]);

nock('https://fakeaccount.table.core.windows.net:443', {"encodedQueryParams":true})
  .get('/tableClientTestTokenCredentialnode()')
  .query(true)
  .reply(200, {"odata.metadata":"https://fakeaccount.table.core.windows.net/$metadata#tableClientTestTokenCredentialnode","value":[{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.3099993Z'\"","PartitionKey":"listEntitiesTest","RowKey":"13","Timestamp":"2021-06-19T00:55:34.3099993Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.3500281Z'\"","PartitionKey":"listEntitiesTest","RowKey":"14","Timestamp":"2021-06-19T00:55:34.3500281Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.386054Z'\"","PartitionKey":"listEntitiesTest","RowKey":"15","Timestamp":"2021-06-19T00:55:34.386054Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.425082Z'\"","PartitionKey":"listEntitiesTest","RowKey":"16","Timestamp":"2021-06-19T00:55:34.425082Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.4631097Z'\"","PartitionKey":"listEntitiesTest","RowKey":"17","Timestamp":"2021-06-19T00:55:34.4631097Z","foo":"testEntity"}]}, [
  'Cache-Control',
  'no-cache',
  'Transfer-Encoding',
  'chunked',
  'Content-Type',
  'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
  'Server',
  'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
  'x-ms-request-id',
  '7c52f6ae-1002-0129-27a5-64b1a8000000',
  'x-ms-client-request-id',
  '81e99b2d-84ff-44de-9ce5-bb62fa8ac2f6',
  'x-ms-version',
  '2019-02-02',
  'X-Content-Type-Options',
  'nosniff',
  'x-ms-continuation-NextPartitionKey',
  '1!24!bGlzdEVudGl0aWVzVGVzdA--',
  'x-ms-continuation-NextRowKey',
  '1!4!MTg-',
  'Access-Control-Expose-Headers',
  'x-ms-request-id,x-ms-client-request-id,Server,x-ms-version,X-Content-Type-Options,Cache-Control,x-ms-continuation-NextPartitionKey,x-ms-continuation-NextRowKey,Content-Type,Content-Length,Date,Transfer-Encoding',
  'Access-Control-Allow-Origin',
  '*',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT'
]);

nock('https://fakeaccount.table.core.windows.net:443', {"encodedQueryParams":true})
  .get('/tableClientTestTokenCredentialnode()')
  .query(true)
  .reply(200, {"odata.metadata":"https://fakeaccount.table.core.windows.net/$metadata#tableClientTestTokenCredentialnode","value":[{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.5001359Z'\"","PartitionKey":"listEntitiesTest","RowKey":"18","Timestamp":"2021-06-19T00:55:34.5001359Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.5371624Z'\"","PartitionKey":"listEntitiesTest","RowKey":"19","Timestamp":"2021-06-19T00:55:34.5371624Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.8766883Z'\"","PartitionKey":"listEntitiesTest","RowKey":"2","Timestamp":"2021-06-19T00:55:33.8766883Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.9127141Z'\"","PartitionKey":"listEntitiesTest","RowKey":"3","Timestamp":"2021-06-19T00:55:33.9127141Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.9507414Z'\"","PartitionKey":"listEntitiesTest","RowKey":"4","Timestamp":"2021-06-19T00:55:33.9507414Z","foo":"testEntity"}]}, [
  'Cache-Control',
  'no-cache',
  'Transfer-Encoding',
  'chunked',
  'Content-Type',
  'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
  'Server',
  'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
  'x-ms-request-id',
  '7c52f6b8-1002-0129-30a5-64b1a8000000',
  'x-ms-client-request-id',
  '8fd29db2-c759-467e-bd45-106e278e39fd',
  'x-ms-version',
  '2019-02-02',
  'X-Content-Type-Options',
  'nosniff',
  'x-ms-continuation-NextPartitionKey',
  '1!24!bGlzdEVudGl0aWVzVGVzdA--',
  'x-ms-continuation-NextRowKey',
  '1!4!NQ--',
  'Access-Control-Expose-Headers',
  'x-ms-request-id,x-ms-client-request-id,Server,x-ms-version,X-Content-Type-Options,Cache-Control,x-ms-continuation-NextPartitionKey,x-ms-continuation-NextRowKey,Content-Type,Content-Length,Date,Transfer-Encoding',
  'Access-Control-Allow-Origin',
  '*',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT'
]);

nock('https://fakeaccount.table.core.windows.net:443', {"encodedQueryParams":true})
  .get('/tableClientTestTokenCredentialnode()')
  .query(true)
  .reply(200, {"odata.metadata":"https://fakeaccount.table.core.windows.net/$metadata#tableClientTestTokenCredentialnode","value":[{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.9857666Z'\"","PartitionKey":"listEntitiesTest","RowKey":"5","Timestamp":"2021-06-19T00:55:33.9857666Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.0217924Z'\"","PartitionKey":"listEntitiesTest","RowKey":"6","Timestamp":"2021-06-19T00:55:34.0217924Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.0628227Z'\"","PartitionKey":"listEntitiesTest","RowKey":"7","Timestamp":"2021-06-19T00:55:34.0628227Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.1178614Z'\"","PartitionKey":"listEntitiesTest","RowKey":"8","Timestamp":"2021-06-19T00:55:34.1178614Z","foo":"testEntity"},{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A34.1558883Z'\"","PartitionKey":"listEntitiesTest","RowKey":"9","Timestamp":"2021-06-19T00:55:34.1558883Z","foo":"testEntity"}]}, [
  'Cache-Control',
  'no-cache',
  'Transfer-Encoding',
  'chunked',
  'Content-Type',
  'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
  'Server',
  'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
  'x-ms-request-id',
  '7c52f6d0-1002-0129-46a5-64b1a8000000',
  'x-ms-client-request-id',
  '4817dfb1-4454-43c1-b6c8-8de38439ba9a',
  'x-ms-version',
  '2019-02-02',
  'X-Content-Type-Options',
  'nosniff',
  'x-ms-continuation-NextPartitionKey',
  '1!24!bGlzdEVudGl0aWVzVGVzdA--',
  'x-ms-continuation-NextRowKey',
  '1!12!YmluYXJ5MQ--',
  'Access-Control-Expose-Headers',
  'x-ms-request-id,x-ms-client-request-id,Server,x-ms-version,X-Content-Type-Options,Cache-Control,x-ms-continuation-NextPartitionKey,x-ms-continuation-NextRowKey,Content-Type,Content-Length,Date,Transfer-Encoding',
  'Access-Control-Allow-Origin',
  '*',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT'
]);

nock('https://fakeaccount.table.core.windows.net:443', {"encodedQueryParams":true})
  .get('/tableClientTestTokenCredentialnode()')
  .query(true)
  .reply(200, {"odata.metadata":"https://fakeaccount.table.core.windows.net/$metadata#tableClientTestTokenCredentialnode","value":[{"odata.etag":"W/\"datetime'2021-06-19T00%3A55%3A33.7385887Z'\"","PartitionKey":"listEntitiesTest","RowKey":"binary1","Timestamp":"2021-06-19T00:55:33.7385887Z","foo@odata.type":"Edm.Binary","foo":"QmFy"}]}, [
  'Cache-Control',
  'no-cache',
  'Transfer-Encoding',
  'chunked',
  'Content-Type',
  'application/json;odata=minimalmetadata;streaming=true;charset=utf-8',
  'Server',
  'Windows-Azure-Table/1.0 Microsoft-HTTPAPI/2.0',
  'x-ms-request-id',
  '7c52f6d9-1002-0129-4fa5-64b1a8000000',
  'x-ms-client-request-id',
  '98036eea-57a0-40a1-b843-c70c54768c0b',
  'x-ms-version',
  '2019-02-02',
  'X-Content-Type-Options',
  'nosniff',
  'Access-Control-Expose-Headers',
  'x-ms-request-id,x-ms-client-request-id,Server,x-ms-version,X-Content-Type-Options,Cache-Control,Content-Type,Content-Length,Date,Transfer-Encoding',
  'Access-Control-Allow-Origin',
  '*',
  'Date',
  'Sat, 19 Jun 2021 00:55:35 GMT'
]);
