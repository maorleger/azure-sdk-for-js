let nock = require('nock');

module.exports.hash = "b64edaca8a29b8099f61ff8914d4bb1a";

module.exports.testInfo = {"uniqueName":{},"newDate":{}}

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-/create')
  .query(true)
  .reply(401, "", [
  'content-type',
  'application/json; charset=utf-8',
  'x-ms-server-latency',
  '1',
  'x-content-type-options',
  'nosniff',
  'www-authenticate',
  'Bearer authorization="https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012", resource="https://managedhsm.azure.net"',
  'x-frame-options',
  'SAMEORIGIN',
  'content-length',
  '0',
  'x-ms-request-id',
  'a116ee50-d08c-11eb-b258-000d3adff4d7',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'cache-control',
  'no-cache'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .get('/common/discovery/instance')
  .query(true)
  .reply(200, {"tenant_discovery_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0/.well-known/openid-configuration","api-version":"1.1","metadata":[{"preferred_network":"login.microsoftonline.com","preferred_cache":"login.windows.net","aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]},{"preferred_network":"login.partner.microsoftonline.cn","preferred_cache":"login.partner.microsoftonline.cn","aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]},{"preferred_network":"login.microsoftonline.de","preferred_cache":"login.microsoftonline.de","aliases":["login.microsoftonline.de"]},{"preferred_network":"login.microsoftonline.us","preferred_cache":"login.microsoftonline.us","aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]},{"preferred_network":"login-us.microsoftonline.com","preferred_cache":"login-us.microsoftonline.com","aliases":["login-us.microsoftonline.com"]}]}, [
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
  'd8e8e212-862e-4ce8-aa50-d688fcdd6c00',
  'x-ms-ests-server',
  '2.1.11829.4 - WUS2 ProdSlices',
  'Set-Cookie',
  'fpc=AiaGymeKzcdLoJAs5-2DWTI; expires=Sun, 18-Jul-2021 23:26:38 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7Wevro-KJMKKjwKBT0Znw4iPucs-WTknNKToGW5ZdyKVwDkfBjqTRRv0h-OinPng5pXzQP5eS8mbtgSDiOS0lw0jbeY_mPnIhy-JlXRH-X1XKq2V5S1WTF3lUfcPtp2sglS0mUASrY_alkS0koo4grbtNq22cEE09Uul7feXhIPYO2AogAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Fri, 18 Jun 2021 23:26:37 GMT',
  'Content-Length',
  '980'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .get('/12345678-1234-1234-1234-123456789012/v2.0/.well-known/openid-configuration')
  .reply(200, {"token_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/oauth2/v2.0/token","token_endpoint_auth_methods_supported":["client_secret_post","private_key_jwt","client_secret_basic"],"jwks_uri":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/discovery/v2.0/keys","response_modes_supported":["query","fragment","form_post"],"subject_types_supported":["pairwise"],"id_token_signing_alg_values_supported":["RS256"],"response_types_supported":["code","id_token","code id_token","id_token token"],"scopes_supported":["openid","profile","email","offline_access"],"issuer":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/v2.0","request_uri_parameter_supported":false,"userinfo_endpoint":"https://graph.microsoft.com/oidc/userinfo","authorization_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/oauth2/v2.0/authorize","device_authorization_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/oauth2/v2.0/devicecode","http_logout_supported":true,"frontchannel_logout_supported":true,"end_session_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/oauth2/v2.0/logout","claims_supported":["sub","iss","cloud_instance_name","cloud_instance_host_name","cloud_graph_host_name","msgraph_host","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"],"kerberos_endpoint":"https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012/kerberos","tenant_region_scope":"WW","cloud_instance_name":"microsoftonline.com","cloud_graph_host_name":"graph.windows.net","msgraph_host":"graph.microsoft.com","rbac_url":"https://pas.windows.net"}, [
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
  '87482d50-c115-4b8e-9528-155136b40100',
  'x-ms-ests-server',
  '2.1.11829.8 - EUS ProdSlices',
  'Set-Cookie',
  'fpc=AiaGymeKzcdLoJAs5-2DWTI; expires=Sun, 18-Jul-2021 23:26:38 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7WevrhGI8-Bt6KFHqOIAN9UxnSb-AssOQ9o2RP9xXC3oQoeLD_U2FCibfgxzmpmQnpqMy7901iFOyCp_JtJdJ3jfC_-Qbi23RkDA0n9kbqDF2TX5_Loe7nq9o3sQwCYgvlWiJylfXP0NvOVdobDJvj3DxtpubDsKi9nYSkUSKumGUHrIgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Fri, 18 Jun 2021 23:26:37 GMT',
  'Content-Length',
  '1753'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .post('/12345678-1234-1234-1234-123456789012/oauth2/v2.0/token', "client_id=azure_client_id&scope=https%3A%2F%2Fsanitized%2F&grant_type=client_credentials&x-client-SKU=msal.js.node&x-client-VER=1.1.0&x-client-OS=linux&x-client-CPU=x64&x-ms-lib-capability=retry-after, h429&x-client-current-telemetry=2|771,0|,&x-client-last-telemetry=2|0|||0,0&client-request-id=c7e9f246-f207-4459-aca1-53eb64883256&client_secret=azure_client_secret")
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
  '3a098889-cf57-49fc-8a0b-00329e4c0d00',
  'x-ms-ests-server',
  '2.1.11829.8 - WUS2 ProdSlices',
  'x-ms-clitelem',
  '1,0,0,,',
  'Set-Cookie',
  'fpc=AiaGymeKzcdLoJAs5-2DWTIpvNouAQAAAK0iX9gOAAAA; expires=Sun, 18-Jul-2021 23:26:38 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Fri, 18 Jun 2021 23:26:37 GMT',
  'Content-Length',
  '1322'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-/create', {"kty":"RSA","attributes":{"exportable":true},"release_policy":{"data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}})
  .query(true)
  .reply(200, {"attributes":{"created":1624058798,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624058798},"key":{"e":"AQAB","key_ops":["wrapKey","decrypt","encrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-/86162913243801ea03ed6bbf81c32349","kty":"RSA-HSM","n":"o9JNTCksMmqi21mIkFhm8TSWHjZm8huKEoJ6vF3TIZzN5AnjGZf-rSQIJFQjIclRPtbnSwr52-uwttPAGCx4X6HcCEKWMxkP89QXTS1pUE0DHRjhRq5szRJLAlB9Qm4roSAveRwaZZX9QIOoBbtuoYTSWUJMA-L-2qn4hIPVoI8sWt6k4nTUl-7Df5S_IqzB_vL--D8vNoHTMag9M1ooSoyZlOZ8sqxRiVSCfNSiyoXKubmY-VXWweWlltPzmT0UC-K93IZpHtcWHQDERcYOf1ey251euFAXdH2nJRbvHDrjNVbmM2ynF4Xc-p9nMdxVBS0boZnAGnZKWEdo5u9CBw"},"release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1340',
  'x-ms-request-id',
  'a146e1c8-d08c-11eb-b258-000d3adff4d7',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '510',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-')
  .query(true)
  .reply(200, {"attributes":{"created":1624058798,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624058798},"deletedDate":1624058799,"key":{"e":"AQAB","key_ops":["wrapKey","encrypt","decrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-/86162913243801ea03ed6bbf81c32349","kty":"RSA-HSM","n":"o9JNTCksMmqi21mIkFhm8TSWHjZm8huKEoJ6vF3TIZzN5AnjGZf-rSQIJFQjIclRPtbnSwr52-uwttPAGCx4X6HcCEKWMxkP89QXTS1pUE0DHRjhRq5szRJLAlB9Qm4roSAveRwaZZX9QIOoBbtuoYTSWUJMA-L-2qn4hIPVoI8sWt6k4nTUl-7Df5S_IqzB_vL--D8vNoHTMag9M1ooSoyZlOZ8sqxRiVSCfNSiyoXKubmY-VXWweWlltPzmT0UC-K93IZpHtcWHQDERcYOf1ey251euFAXdH2nJRbvHDrjNVbmM2ynF4Xc-p9nMdxVBS0boZnAGnZKWEdo5u9CBw"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631834799}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1539',
  'x-ms-request-id',
  'a1a1f81a-d08c-11eb-b258-000d3adff4d7',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '156',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .get('/deletedkeys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-')
  .query(true)
  .reply(200, {"attributes":{"created":1624058798,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624058798},"deletedDate":1624058799,"key":{"e":"AQAB","key_ops":["verify","sign","unwrapKey","encrypt","decrypt","wrapKey"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-/86162913243801ea03ed6bbf81c32349","kty":"RSA-HSM","n":"o9JNTCksMmqi21mIkFhm8TSWHjZm8huKEoJ6vF3TIZzN5AnjGZf-rSQIJFQjIclRPtbnSwr52-uwttPAGCx4X6HcCEKWMxkP89QXTS1pUE0DHRjhRq5szRJLAlB9Qm4roSAveRwaZZX9QIOoBbtuoYTSWUJMA-L-2qn4hIPVoI8sWt6k4nTUl-7Df5S_IqzB_vL--D8vNoHTMag9M1ooSoyZlOZ8sqxRiVSCfNSiyoXKubmY-VXWweWlltPzmT0UC-K93IZpHtcWHQDERcYOf1ey251euFAXdH2nJRbvHDrjNVbmM2ynF4Xc-p9nMdxVBS0boZnAGnZKWEdo5u9CBw"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631834799}, [
  'x-frame-options',
  'SAMEORIGIN',
  'x-ms-request-id',
  'a1c691a2-d08c-11eb-b258-000d3adff4d7',
  'content-type',
  'application/json; charset=utf-8',
  'x-ms-keyvault-region',
  'eastus2',
  'content-length',
  '1539',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'cache-control',
  'no-cache',
  'x-content-type-options',
  'nosniff',
  'x-ms-build-version',
  '1.0.20210605-1-ffd80f31-develop',
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '31'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/deletedkeys/CRUDKeyName-cancreateanexportablekeywithreleasepolicy-')
  .query(true)
  .reply(204, "", [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '0',
  'x-ms-request-id',
  'a1d82cfa-d08c-11eb-b258-000d3adff4d7',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '116',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);
