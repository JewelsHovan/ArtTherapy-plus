/**
 * Application configuration
 *
 * Loads and validates environment variables.
 * Exports a typed config object for use throughout the application.
 */

/**
 * Configuration interface
 */
export interface Config {
  /** Server configuration */
  server: {
    port: number;
    nodeEnv: string;
    isProduction: boolean;
  };
  /** Database configuration */
  database: {
    url: string;
  };
  /** Azure Blob Storage configuration */
  storage: {
    connectionString: string;
    containerName: string;
    publicUrl: string;
  };
  /** JWT configuration */
  jwt: {
    secret: string;
  };
  /** OpenAI configuration */
  openai: {
    apiKey: string;
  };
  /** Microsoft OAuth configuration */
  microsoft: {
    clientId: string;
  };
  /** OpenRouter configuration (optional - enables multi-model image generation) */
  openrouter?: {
    apiKey: string;
    baseUrl: string;
  };
}

/**
 * Load and validate environment variables
 */
function loadConfig(): Config {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ];

  // In production, also require Azure storage config
  if (isProduction) {
    requiredVars.push(
      'AZURE_STORAGE_CONNECTION_STRING',
      'AZURE_STORAGE_CONTAINER_NAME',
      'AZURE_STORAGE_PUBLIC_URL'
    );
  }

  // Check for missing required variables
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    server: {
      port: parseInt(process.env.PORT || '8787', 10),
      nodeEnv,
      isProduction,
    },
    database: {
      url: process.env.DATABASE_URL!,
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'images',
      publicUrl: process.env.AZURE_STORAGE_PUBLIC_URL || '',
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '1068db0a-2e86-4094-aa91-b55bca8ac09a',
    },
    // OpenRouter is optional - only configured if API key is present
    openrouter: process.env.OPENROUTER_API_KEY
      ? {
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: 'https://openrouter.ai/api/v1',
        }
      : undefined,
  };
}

// Export singleton config instance
export const config = loadConfig();
