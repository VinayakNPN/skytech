import { Configuration } from '@azure/msal-node';
import dotenv from 'dotenv';

dotenv.config();

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || 'dummy-client-id',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'dummy-tenant-id'}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'dummy-client-secret',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        // console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Info
    }
  }
};
