"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.msalConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.msalConfig = {
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
