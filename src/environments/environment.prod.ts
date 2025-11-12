export const environment = {
  production: true,
  
  // API Configuration
  apiBaseUrl: 'https://budget-planner-container.jollyisland-dddd3064.southindia.azurecontainerapps.io/',
  
  // Authentication & Session Configuration
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  sessionStorageKey: 'budget_planner_session',
  
  // HTTP Configuration
  httpTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelayMs: 2000,
  
  // Feature Flags
  features: {
    portfolioIntegration: true,
    offlineMode: false,
    advancedAnalytics: false
  },
  
  // Logging Configuration
  enableLogging: false,
  logLevel: 'error' // 'debug' | 'info' | 'warn' | 'error'
};
