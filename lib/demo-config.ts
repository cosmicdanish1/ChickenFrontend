// Demo Configuration
// Set DEMO_MODE to true to show limited features for client demo
// Set to false to show all features

export const DEMO_MODE = true

// Features visible in demo mode
export const DEMO_FEATURES = {
  // Always visible
  login: true,
  logout: true,
  
  // Master Entries - visible in demo
  masters: true,
  farmers: true,
  retailers: true,
  vehicles: true,
  
  // Users - visible in demo
  users: true,
  
  // Settings - visible in demo
  settings: true,
  
  // Hidden features (Coming Soon)
  dashboard: false,
  inventory: false,
  purchases: false,
  sales: false,
  mortality: false,
  expenses: false,
  reports: false,
  financialAnalytics: false,
  products: false,
}

// Check if a feature is available
export function isFeatureAvailable(feature: keyof typeof DEMO_FEATURES): boolean {
  if (!DEMO_MODE) return true
  return DEMO_FEATURES[feature] ?? false
}

// Get demo message
export function getDemoMessage(): string {
  return "This feature is coming soon! We're working hard to bring you the complete experience."
}
