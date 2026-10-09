targetScope = 'resourceGroup'
@allowed(['development', 'staging', 'production'])
param environment string = 'development'
param location string = resourceGroup().location
param namePrefix string = 'cw'

// Foundation only. No app ingress, database or production network is provisioned.
resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-${environment}-logs'
  location: location
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
}
resource containerEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-${environment}-apps'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}
resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${namePrefix}-${uniqueString(resourceGroup().id)}-kv'
  location: location
  properties: {
    tenantId: tenant().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    accessPolicies: []
  }
}
output environmentId string = containerEnvironment.id
output vaultId string = vault.id
