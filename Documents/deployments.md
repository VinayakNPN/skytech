# Deployment Guide

This document outlines the deployment strategy and procedures for the Skytech Program Management System (SPMS).

## Infrastructure Overview

- **Cloud Provider:** AWS (Amazon Web Services)
- **Servers:** EC2 Instances
- **OS:** Ubuntu 22.04 LTS
- **Reverse Proxy:** Nginx
- **Process Manager:** PM2 (for Node.js Backend)

## EC2 Deployment Configuration

We use an automated bash script for deploying the application on an AWS EC2 instance. This script handles:

1. System updates and dependency installation (Node.js, Git, Nginx, PM2, Docker).
2. Cloning/Pulling the latest code from the repository.
3. Setting up environment variables.
4. Building the Next.js/Vite frontend.
5. Building the Node.js backend.
6. Configuring Nginx reverse proxy.
7. Managing services with PM2.

### Prerequisites

- AWS EC2 Instance (t3.micro or higher recommended).
- Security Group configured to allow HTTP (80), HTTPS (443), and SSH (22).
- Domain name mapped to the EC2 Elastic IP.

### Deployment Script Location

The automated deployment scripts are stored in the `/deploy` or `backend` scripts folder (based on project structure).

### Continuous Integration / Continuous Deployment (CI/CD)

- Future updates will be pushed via GitHub Actions to automate the EC2 deployment process upon merging to the `main` branch.

## Environment Variables

Ensure `.env.production` is correctly set on the server for both Frontend and Backend before triggering the build.

### Frontend
- `VITE_API_URL`: Backend API URL (e.g., `https://api.yourdomain.com`)

### Backend
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secure secret key for authentication.
- `PORT`: Usually `5000` or `8080`.

## Monitoring and Logs

- **Backend Logs:** Managed via PM2. Command: `pm2 logs`
- **Nginx Logs:** Available at `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
