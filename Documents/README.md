# Skytech Program Management System

> Enterprise Manufacturing Workflow & Employee Management Platform

---

## Overview

Skytech Program Management System is an enterprise-grade web application developed for Skytech Switchgear Pvt. Ltd. to digitize and streamline the complete manufacturing lifecycle—from customer inquiry to after-sales service.

The application replaces manual tracking using Excel sheets, paper checklists, and disconnected departmental communication with a centralized workflow management platform.

Every customer order progresses through predefined departments, where each department completes its assigned tasks before handing over the job to the next department.

The system provides real-time visibility into project status, employee workload, department progress, inventory movement, and service activities.

---

## Business Workflow

```text
Inquiry
    ↓
Design & Costing
    ↓
Quotation
    ↓
Client Approval
    ↓
Mechanical Department
    ↓
Assembly & Busbar
    ↓
Electrical
    ↓
Testing
    ↓
Dispatch
    ↓
Accounts
    ↓
Support & Service
```

Each department contains predefined tasks that must be completed before the workflow moves to the next phase.

---

## Objectives

- Digitize the complete manufacturing workflow
- Improve collaboration between departments
- Track every customer order in real time
- Monitor employee productivity
- Reduce manual paperwork
- Provide management dashboards
- Maintain complete audit history
- Improve reporting and accountability

---

# Core Modules

## Authentication

- Microsoft Entra ID Authentication
- Role Based Access Control
- Session Management

---

## Dashboard

- Company Overview
- Running Orders
- Department Progress
- Employee Status
- Pending Tasks
- Delayed Jobs
- KPIs
- Notifications

---

## Employee Management

- Employee Directory
- Departments
- Designations
- Attendance
- Leave Management
- Roles & Permissions

---

## Customer Management

- Customer Database
- Contact Information
- Projects
- Previous Orders

---

## Order Management

- Create Orders
- Track Order Progress
- Order Timeline
- Order Status
- Priority Management

---

## Workflow Management

- Configurable Workflow Templates
- Department-wise Stages
- Task Assignment
- Task Completion
- Stage Approval
- Workflow History

---

## Department Management

- Design & Costing
- Mechanical
- Assembly & Busbar
- Electrical
- Testing
- Store
- Accounts
- Support & Service

Each department has predefined task templates.

---

## Inventory Management

- Material Requests
- Purchase Orders
- Stock Management
- Material Allocation
- Material Handover

---

<!-- ## File Management

- Drawing Uploads
- BOQ
- CAD Files
- Documents
- Reports
- Attachments

--- -->

## Reporting

- Progress Reports
- Employee Reports
- Department Reports
- Inventory Reports
- Service Reports
- Export to Excel/PDF

---

## Notifications

- Task Assignment
- Task Completion
- Due Dates
- Delayed Orders
- Email Notifications

---

## Audit Logs

Every important action performed inside the system will be logged.

Examples:

- Order Created
- Task Completed
- Status Changed
- Employee Assigned
- Workflow Updated

---

# Functional Specifications & Requirements

## 1. SkyTech Management System

### Core Features & Modules
- **Dashboard**
  - Announcement notification on navbar [Continuous Flow]
- **Attendance & HR**
  - Attendance
  - Leave
  - Salary
  - Tasks
- **Active Programmes / Running Jobs**
  - Excel Upload - Excel Read in Running Job, Delete Job option after delivery
  - If job failed, we can add remarks, and for follow up as well
- **Inquiry & Internal Data**
  - Inquiry / Internal Data - Restricted access
- **QR Code & Document Management**
  - QR code generation, Link generation, Document management
- **Project Information**
  - Project Information - Delete Option on Website that deletes the particular project's data from website.
- **Reporting & Product Data**
  - View Reports
  - Quantity, BOM, price, stock limit

---

## 2. Inventory Management System

### Core Components
- Inventory Dashboard
- Job Master
- Item Master

### Stock & Tracking
- Stock IN
- Stock OUT
- Job-Wise

### Options
- Item Add/Delete
- Stock IN
- Stock OUT

---

# Technology Stack

## Frontend

- Next.js 15
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod

---

## Backend

- Next.js Route Handlers
- TypeScript
- Prisma ORM
- PostgreSQL

---

## Authentication

- Auth.js
- Microsoft Entra ID
- OAuth 2.0

---

## Database

- PostgreSQL

---

## Storage

- AWS S3 Bucket

---

## Deployment

Frontend

- Vercel

Backend

- Vercel Functions / Dedicated Server (future) / AWS / Render

Database

- PostgreSQL

---

# High-Level Architecture

```text
                    Browser
                       │
                       ▼
              Next.js Application
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
 Authentication               API Routes
         │                           │
         └─────────────┬─────────────┘
                       ▼
                    Prisma ORM
                       │
                       ▼
                  PostgreSQL
                       │
        ┌──────────────┴─────────────┐
        ▼                            ▼
   Azure Blob                 Notification Services
```

---

# User Roles

- Admin
- HR
- Design Dept.
- Mechanical Dept.
- Bubar Dept.
- Electrical Dept.
- Testing Dept.
- Store Dept.
- Accounts Dept.
- Service Dept.


---

# Folder Structure

```
src/

app/

components/

features/

lib/

hooks/

services/

types/

utils/

prisma/

docs/

public/
```

---

# Development Principles

- Feature-first architecture
- Reusable components
- Strict TypeScript
- Database-driven workflows
- No hardcoded business logic
- Responsive UI
- Audit logging
- Secure authentication
- Role-based authorization

---

# Documentation

The project documentation is available inside the `/Documents` directory.

- Software Requirement Specification
- System Architecture
- Database Design
- API Specification
- Development Roadmap
- Workflow Engine
- Deployment Guide
- Coding Standards
- Meeting Notes
- Changelog

---


---

# License

Confidential Proprietary Software

Developed exclusively for Skytech Switchgear Pvt. Ltd.

Unauthorized copying, distribution, or modification is prohibited.

---

