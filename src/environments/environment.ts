// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  
  // API Configuration
  apiBaseUrl: 'http://localhost:8080/',
  
  // Authentication & Session Configuration
  sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  sessionStorageKey: 'budget_planner_session',
  
  // HTTP Configuration
  httpTimeout: 30000, // 30 seconds
  retryAttempts: 2,
  retryDelayMs: 1000,
  
  // Feature Flags
  features: {
    portfolioIntegration: true,
    offlineMode: false,
    advancedAnalytics: false
  },
  
  // Logging Configuration
  enableLogging: true,
  logLevel: 'debug' // 'debug' | 'info' | 'warn' | 'error'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
