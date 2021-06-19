let nock = require('nock');

module.exports.hash = "36bf09e1d6d913184667c3436d0d75bd";

module.exports.testInfo = {"uniqueName":{"exportkeytest":"exportkeytest162406111988502774"},"newDate":{}}

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/exportkeytest162406111988502774/create')
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
  '0982ac2c-d092-11eb-8e3c-0022484f830d',
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
  '7c7bf58b-e68e-4fd5-b93f-92f90b6b4c00',
  'x-ms-ests-server',
  '2.1.11829.4 - SCUS ProdSlices',
  'Set-Cookie',
  'fpc=AjqabCa3IHNDiO4wyU6InBE; expires=Mon, 19-Jul-2021 00:05:20 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7Wevr2b_W3K5yk7GeZ6RwVauvYB46zbjYHkzc25oyJ52Bal_vK5NBVhd5W3E9bJreS0fyreRhrQasK0d81A9UDmHNHIfE11CrOtjlQhDXXqi-EL79UyZTg4Ort-LKCQ1owdG8d5n-JA4NM3g6n3ojdoVcyit9TYA8tqi55cDAILe0qzkgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:05:20 GMT'
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
  '718cb721-43a4-4851-a7fe-2824f1390e00',
  'x-ms-ests-server',
  '2.1.11829.8 - WUS2 ProdSlices',
  'Set-Cookie',
  'fpc=AjqabCa3IHNDiO4wyU6InBE; expires=Mon, 19-Jul-2021 00:05:20 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'esctx=AQABAAAAAAD--DLA3VO7QrddgJg7WevrNOHDQZCv0IZp_SPCC55GMAjyFazZfbS5qRb-xbSXlwflTPIRYI3oOFb1LJaLtVN6ArjA7HQqxQhYE0pmsAdJjHf-VK3JSGWVI2S7ricVXBnTSqWFvn6yljRmsBeiZa1Lf7s4kB0vTGLFU9oV_UPzPKjCDeq_bskFtldXVHdun1wgAA; domain=.login.microsoftonline.com; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:05:20 GMT',
  'Content-Length',
  '1753'
]);

nock('https://login.microsoftonline.com:443', {"encodedQueryParams":true})
  .post('/12345678-1234-1234-1234-123456789012/oauth2/v2.0/token', "client_id=azure_client_id&scope=https%3A%2F%2Fsanitized%2F&grant_type=client_credentials&x-client-SKU=msal.js.node&x-client-VER=1.1.0&x-client-OS=linux&x-client-CPU=x64&x-ms-lib-capability=retry-after, h429&x-client-current-telemetry=2|771,0|,&x-client-last-telemetry=2|0|||0,0&client-request-id=ad4837b2-cb74-4e65-a0ad-e84026f5fdce&client_secret=azure_client_secret")
  .reply(200, {"token_type":"Bearer","expires_in":86399,"ext_expires_in":86399,"access_token":"access_token"}, [
  'Cache-Control',
  'no-store, no-cache',
  'Pragma',
  'no-cache',
  'Content-Length',
  '1322',
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
  'cafaa1fd-eed4-4315-98db-6a877e661000',
  'x-ms-ests-server',
  '2.1.11829.8 - WUS2 ProdSlices',
  'x-ms-clitelem',
  '1,0,0,,',
  'Set-Cookie',
  'fpc=AjqabCa3IHNDiO4wyU6InBEpvNouAQAAAMArX9gOAAAA; expires=Mon, 19-Jul-2021 00:05:21 GMT; path=/; secure; HttpOnly; SameSite=None',
  'Set-Cookie',
  'x-ms-gateway-slice=estsfd; path=/; secure; samesite=none; httponly',
  'Set-Cookie',
  'stsservicecookie=estsfd; path=/; secure; samesite=none; httponly',
  'Date',
  'Sat, 19 Jun 2021 00:05:20 GMT'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .post('/keys/exportkeytest162406111988502774/create', {"kty":"RSA","attributes":{"exportable":true},"release_policy":{"data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}})
  .query(true)
  .reply(200, {"attributes":{"created":1624061121,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624061121},"key":{"e":"AQAB","key_ops":["wrapKey","decrypt","encrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406111988502774/2b3eb2c7221f0dc195af2ae43b4cfc1d","kty":"RSA-HSM","n":"vly-Sbm5E70g0-TVUjhA9sg6k0t5BRMXeMqRziCmpZmq4xiX72DNwsYSBmCyN-cv7GC3FeVLJGnMEtMZ714oCZ8vV17WETZj_ZE7SBmUaKUPC17kicwx3TEKWHPgb22QrM-22xeQvu0tkAd1SCIGQ7h4Eprk6kFe0tSv0y1cvKayR8P-i9S0KibwtKd3DBugRCIKwKl0hMpMePmmokx9iyFtytpRLVohdq-ORR1kt4pEUCxuPGqNvWKmk5uv5fQKQt-zzi8kPwciZiuEtg7eJSxofWtRpzjBrpwBxu_a9JV_5xPt3kiMZIrwITm2H2c7a7-AvpKtb7rcKWNuk5DL6Q"},"release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"}}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1300',
  'x-ms-request-id',
  '09adca42-d092-11eb-8e3c-0022484f830d',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '581',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/keys/exportkeytest162406111988502774')
  .query(true)
  .reply(200, {"attributes":{"created":1624061121,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624061121},"deletedDate":1624061121,"key":{"e":"AQAB","key_ops":["wrapKey","encrypt","decrypt","unwrapKey","sign","verify"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406111988502774/2b3eb2c7221f0dc195af2ae43b4cfc1d","kty":"RSA-HSM","n":"vly-Sbm5E70g0-TVUjhA9sg6k0t5BRMXeMqRziCmpZmq4xiX72DNwsYSBmCyN-cv7GC3FeVLJGnMEtMZ714oCZ8vV17WETZj_ZE7SBmUaKUPC17kicwx3TEKWHPgb22QrM-22xeQvu0tkAd1SCIGQ7h4Eprk6kFe0tSv0y1cvKayR8P-i9S0KibwtKd3DBugRCIKwKl0hMpMePmmokx9iyFtytpRLVohdq-ORR1kt4pEUCxuPGqNvWKmk5uv5fQKQt-zzi8kPwciZiuEtg7eJSxofWtRpzjBrpwBxu_a9JV_5xPt3kiMZIrwITm2H2c7a7-AvpKtb7rcKWNuk5DL6Q"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/exportkeytest162406111988502774","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631837121}, [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '1459',
  'x-ms-request-id',
  '0a147260-d092-11eb-8e3c-0022484f830d',
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
  .get('/deletedkeys/exportkeytest162406111988502774')
  .query(true)
  .reply(200, {"attributes":{"created":1624061121,"enabled":true,"exportable":true,"recoverableDays":90,"recoveryLevel":"Recoverable+Purgeable","updated":1624061121},"deletedDate":1624061121,"key":{"e":"AQAB","key_ops":["verify","sign","unwrapKey","encrypt","decrypt","wrapKey"],"kid":"https://azure_managedhsm.managedhsm.azure.net/keys/exportkeytest162406111988502774/2b3eb2c7221f0dc195af2ae43b4cfc1d","kty":"RSA-HSM","n":"vly-Sbm5E70g0-TVUjhA9sg6k0t5BRMXeMqRziCmpZmq4xiX72DNwsYSBmCyN-cv7GC3FeVLJGnMEtMZ714oCZ8vV17WETZj_ZE7SBmUaKUPC17kicwx3TEKWHPgb22QrM-22xeQvu0tkAd1SCIGQ7h4Eprk6kFe0tSv0y1cvKayR8P-i9S0KibwtKd3DBugRCIKwKl0hMpMePmmokx9iyFtytpRLVohdq-ORR1kt4pEUCxuPGqNvWKmk5uv5fQKQt-zzi8kPwciZiuEtg7eJSxofWtRpzjBrpwBxu_a9JV_5xPt3kiMZIrwITm2H2c7a7-AvpKtb7rcKWNuk5DL6Q"},"recoveryId":"https://azure_managedhsm.managedhsm.azure.net/deletedkeys/exportkeytest162406111988502774","release_policy":{"contentType":"application/json; charset=utf-8","data":"eyJhbnlPZiI6W3siYWxsT2YiOlt7ImNsYWltIjoieC1tcy1hdHRlc3RhdGlvbi10eXBlIiwiZXF1YWxzIjoic2V2c25wdm0ifSx7ImNsYWltIjoieC1tcy1zZXZzbnB2bS1hdXRob3JrZXlkaWdlc3QiLCJlcXVhbHMiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifSx7ImNsYWltIjoieC1tcy1ydW50aW1lLnZtLWNvbmZpZ3VyYXRpb24uc2VjdXJlLWJvb3QiLCJlcXVhbHMiOnRydWV9XSwiYXV0aG9yaXR5IjoiaHR0cHM6Ly9zaGFyZWRldXMuZXVzLnRlc3QuYXR0ZXN0LmF6dXJlLm5ldC8ifV0sInZlcnNpb24iOiIxLjAuMCJ9"},"scheduledPurgeDate":1631837121}, [
  'x-frame-options',
  'SAMEORIGIN',
  'x-ms-request-id',
  '0a395fa8-d092-11eb-8e3c-0022484f830d',
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
  '35'
]);

nock('https://azure_managedhsm.managedhsm.azure.net:443', {"encodedQueryParams":true})
  .delete('/deletedkeys/exportkeytest162406111988502774')
  .query(true)
  .reply(204, "", [
  'content-type',
  'application/json; charset=utf-8',
  'x-content-type-options',
  'nosniff',
  'content-length',
  '0',
  'x-ms-request-id',
  '0a4c73e0-d092-11eb-8e3c-0022484f830d',
  'x-ms-keyvault-region',
  'eastus2',
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
  'content-security-policy',
  "default-src 'self'",
  'x-ms-keyvault-network-info',
  'conn_type=Ipv4;addr=50.35.231.105;act_addr_fam=Ipv4;',
  'x-ms-server-latency',
  '138',
  'cache-control',
  'no-cache',
  'x-frame-options',
  'SAMEORIGIN'
]);
