let nock = require('nock');

module.exports.hash = "36bf09e1d6d913184667c3436d0d75bd";

module.exports.testInfo = {"uniqueName":{"exportkeytest":"exportkeytest162406362332703345"},"newDate":{}}

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/exportkeytest162406362332703345/create')
  .query(true)
  .reply(401, "", [
  'content-type',
  'application/json; charset=utf-8',
  'x-ms-server-latency',
  '0',
  'x-content-type-options',
  'nosniff',
  'www-authenticate',
  'Bearer authorization="https://login.microsoftonline.com/12345678-1234-1234-1234-123456789012", resource="https://managedhsm.azure.net"',
  'x-frame-options',
  'SAMEORIGIN',
  'content-length',
  '0',
  'x-ms-request-id',
  'dda99a38-d097-11eb-aedd-000d3ae28186',
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
  'Content-Length',
  '980',
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
  '14172d2c-f359-4bbd-a808-9866969b3200',
  'x-ms-ests-server',
  '2.1.11829.4 - EUS ProdSlices',
  'Set-Cookie',
  'fpc=ArEMOhYETEZLgaVcrTZ51nY; expires=Mon, 19-Jul-2021 00:47:04 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7WevrgBCE-LXDSSwgPGpj9LFHsmObetT5o_QJHtigijj-JBnaIkdszTjGK0E_reyUvfRj6sCDn2X3U9XV5v360zFF3ZiidJgraA7PT9Hi_qASOOobf4CCtFRBJwojKkMDgOshdRvVWmQtiQy9adXNYgByx7MnOFWXKtYSpz_Ck5HiFpQgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:47:04 GMT'
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
  'e3de468e-0135-45c4-ba04-4389a33e0400',
  'x-ms-ests-server',
  '2.1.11829.8 - EUS ProdSlices',
  'Set-Cookie',
  'fpc=ArEMOhYETEZLgaVcrTZ51nY; expires=Mon, 19-Jul-2021 00:47:04 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7Wevrj3PxRZjaSAAutluOVV8VofOPtxYt-dtta52ZguPEQZ8OCEVeXPG-dgSoa0EMBMFU6J-5WqH5FskBUO65qHeCTu3LlNE9xABgpS9BHuXRlZCKtB9r9RZ_auV147wPDCN6k_AfVLAOJ-_oFugCg6Q5hJnlO9i9GqWqLdpD0nzhVsggAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:47:04 GMT',
  'Content-Length',
  '1753'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .post('/12345678-1234-1234-1234-123456789012/oauth2/v2.0/token', "client_id=azure_client_id&scope=https%3A%2F%2Fsanitized%2F&grant_type=client_credentials&x-client-SKU=msal.js.node&x-client-VER=1.1.0&x-client-OS=linux&x-client-CPU=x64&x-ms-lib-capability=retry-after, h429&x-client-current-telemetry=2|771,0|,&x-client-last-telemetry=2|0|||0,0&client-request-id=3f28b090-5baa-4808-94f4-d37ce11a44e1&client_secret=azure_client_secret")
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
  '59e2480f-077e-4ad6-9607-2f9310850400',
  'x-ms-ests-server',
  '2.1.11829.8 - EUS ProdSlices',
  'x-ms-clitelem',
  '1,0,0,,',
  'Set-Cookie',
  'fpc=ArEMOhYETEZLgaVcrTZ51nYpvNouAQAAAIg1X9gOAAAA; expires=Mon, 19-Jul-2021 00:47:04 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:47:04 GMT',
  'Content-Length',
  '1322'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/exportkeytest162406362332703345/create', {"kty":"RSA","attributes":{"exportable":true},"release_policy":{"data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}})
  .query(true)
  .reply(200, {"attributes":{"created":1624063624,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624063624},"key":{"e":"AQAB","key_ops":["wrapKey","decrypt","encrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406362332703345/b8502bfe07834d0cade46b6755ac1d36","kty":"RSA-HSM","n":"rfhac_eDzHkurlfWyFP9tN3TXw6UXN-NCahLxKov5MxuPnZli2Q0i1Qk0p8fH3YbxP2veic2nlRPV21u9D63nlHhbMVozEXQsoyf-vY5vlh5VX119nt7ozcC_wrxZBzyF9QQBWgSVIiceTjQ9u-LszfMZP74MGg_8tyB6WH-OhR5vy_DASFKun-dYoBuP7JwDIEqi88eQhIumxNubFOEcNxDuiXC78Ds7eGJUKnX6Yo0unVt3bLG-5BhrVbRbioF8UJU86ixI6GOAd9MKbz85d_n7CkSAeZXRIOoH-tBElUBxDVmTUuzdDtp37gaGf2yaBbdlGjItREgTWvhlIWkYQ"},"release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1300',
  'x-ms-request-id',
  'de07aefc-d097-11eb-aedd-000d3ae28186',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '643',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/keys/exportkeytest162406362332703345')
  .query(true)
  .reply(200, {"attributes":{"created":1624063624,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624063624},"deletedDate":1624063625,"key":{"e":"AQAB","key_ops":["wrapKey","encrypt","decrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406362332703345/b8502bfe07834d0cade46b6755ac1d36","kty":"RSA-HSM","n":"rfhac_eDzHkurlfWyFP9tN3TXw6UXN-NCahLxKov5MxuPnZli2Q0i1Qk0p8fH3YbxP2veic2nlRPV21u9D63nlHhbMVozEXQsoyf-vY5vlh5VX119nt7ozcC_wrxZBzyF9QQBWgSVIiceTjQ9u-LszfMZP74MGg_8tyB6WH-OhR5vy_DASFKun-dYoBuP7JwDIEqi88eQhIumxNubFOEcNxDuiXC78Ds7eGJUKnX6Yo0unVt3bLG-5BhrVbRbioF8UJU86ixI6GOAd9MKbz85d_n7CkSAeZXRIOoH-tBElUBxDVmTUuzdDtp37gaGf2yaBbdlGjItREgTWvhlIWkYQ"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/exportkeytest162406362332703345","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631839625}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1459',
  'x-ms-request-id',
  'de75b5fa-d097-11eb-aedd-000d3ae28186',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '180',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .get('/deletedkeys/exportkeytest162406362332703345')
  .query(true)
  .reply(200, {"attributes":{"created":1624063624,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624063624},"deletedDate":1624063625,"key":{"e":"AQAB","key_ops":["verify","sign","unwrapKey","encrypt","decrypt","wrapKey"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406362332703345/b8502bfe07834d0cade46b6755ac1d36","kty":"RSA-HSM","n":"rfhac_eDzHkurlfWyFP9tN3TXw6UXN-NCahLxKov5MxuPnZli2Q0i1Qk0p8fH3YbxP2veic2nlRPV21u9D63nlHhbMVozEXQsoyf-vY5vlh5VX119nt7ozcC_wrxZBzyF9QQBWgSVIiceTjQ9u-LszfMZP74MGg_8tyB6WH-OhR5vy_DASFKun-dYoBuP7JwDIEqi88eQhIumxNubFOEcNxDuiXC78Ds7eGJUKnX6Yo0unVt3bLG-5BhrVbRbioF8UJU86ixI6GOAd9MKbz85d_n7CkSAeZXRIOoH-tBElUBxDVmTUuzdDtp37gaGf2yaBbdlGjItREgTWvhlIWkYQ"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/exportkeytest162406362332703345","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631839625}, [
  'x-frame-options',
  'SAMEORIGIN',
  'x-ms-request-id',
  'de9c9350-d097-11eb-aedd-000d3ae28186',
  'content-type',
  'application/json; charset=utf-8',
  'x-ms-keyvault-region',
  'eastus2',
  'content-length',
  '1459',
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
  '43'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/deletedkeys/exportkeytest162406362332703345')
  .query(true)
  .reply(204, "", [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '0',
  'x-ms-request-id',
  'deae7872-d097-11eb-aedd-000d3ae28186',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '125',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);
