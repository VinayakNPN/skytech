# Skytech Program Management System (SPMS)

> Enterprise Manufacturing Workflow & Program Management Platform

![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Status](https://img.shields.io/badge/status-Planning-orange)
![License](https://img.shields.io/badge/license-Private-red)

---

# Overview

Skytech Program Management System (SPMS) is an enterprise-grade web application designed for **Skytech Switchgear Pvt. Ltd.** to digitize and streamline the complete manufacturing lifecycle of electrical panels and switchgear systems.

The system replaces manual workflows, Excel sheets, paper checklists, and disconnected departmental communication with a centralized platform that enables real-time project tracking, employee management, workflow monitoring, inventory coordination, reporting, and after-sales service.

This application is designed as a scalable production software that can evolve into a complete ERP solution.

---

# Business Workflow

Every customer order follows the manufacturing workflow shown below.

```text
Customer Inquiry
        │
        ▼
Design & Costing
        │
        ▼
Quotation / Offer
        │
        ▼
Client Approval
        │
        ▼
Mechanical Department
        │
        ▼
Assembly & Busbar
        │
        ▼
Electrical Department
        │
        ▼
Testing Department
        │
        ▼
Ready for Dispatch
        │
        ▼
Accounts
        │
        ▼
Support & Service
```

Each department contains predefined tasks that must be completed before the workflow moves to the next stage.

---

# Project Goals

- Digitize the complete manufacturing process
- Track every customer order in real time
- Monitor department-wise progress
- Manage employees and responsibilities
- Improve communication between departments
- Reduce manual paperwork
- Generate reports and analytics
- Maintain audit history of every action
- Build a scalable foundation for future ERP modules

---

# Core Modules

## Dashboard

- Company Overview
- Running Orders
- Department Progress
- Pending Tasks
- Delayed Jobs
- Employee Status
- Notifications
- Analytics

---

## Authentication

- Microsoft Entra ID (Azure AD)
- JWT Authentication
- Session Management
- Role-Based Access Control (RBAC)

---

## Employee Management

- Employee Directory
- Departments
- Designations
- Attendance
- Leave Management
- Roles & Permissions
- Performance Tracking

---

## Customer Management

- Customers
- Contacts
- Projects
- Orders
- Communication History

---

## Order Management

- Create Orders
- Order Timeline
- Project Progress
- Workflow Assignment
- Priority Management
- Attachments
- Order History

---

## Workflow Engine

- Workflow Templates
- Department Stages
- Task Templates
- Task Assignment
- Status Tracking
- Department Handover
- Remarks
- Approvals

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

---

## Inventory Management

- Material Requests
- Purchase Orders
- Vendors
- Material Allocation
- Material History
- Stock Monitoring

---

## File Management

- Drawings
- BOQ
- CAD Files
- PDF Documents
- Images
- Reports

---

## Reporting

- Employee Reports
- Project Reports
- Department Reports
- Inventory Reports
- Attendance Reports
- Excel Export
- PDF Export

---

## Notifications

- Task Assignment
- Deadline Reminders
- Workflow Updates
- Department Completion
- Email Notifications

---

## Audit Logs

Every critical operation will be logged.

Examples

- Login
- Order Created
- Task Updated
- Employee Assigned
- Department Completed
- Workflow Changed

---

# Technology Stack

## Frontend

- Next.js
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Zustand
- React Hook Form
- Zod

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT
- Multer (File Upload)
- Nodemailer
- Microsoft Graph API

---

## Database

- PostgreSQL

---

## Authentication

- Microsoft Entra ID
- OAuth 2.0
- JWT
- Role-Based Access Control

---

## Storage

- Azure Blob Storage (Planned)

---

## Deployment

### Frontend

- Vercel

### Backend

- Railway / Render / DigitalOcean

### Database

- PostgreSQL (Neon or Supabase)

---


# High-Level Architecture

```text
                        Users
                           │
                           ▼
                React.js Frontend (Vite)
                           │
             HTTPS / REST API / JWT
                           │
                           ▼
             Node.js + Express Backend
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
     PostgreSQL      AWS S3          Microsoft Graph
      (Prisma)                               API
```

---

# User Roles

- Admin
- HR
- Design Dept.
- Mechanical Dept.
- Assembly Dept.
- Electrical Dept.
- Testing Dept.
- Store Dept.
- Accounts Dept.
- Service Dept.

---

# Development Principles

- Feature-Based Architecture
- Modular Design
- SOLID Principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Strong Type Safety
- Reusable Components
- Database-Driven Workflow
- Clean Code Practices

---

# Security

- HTTPS
- JWT Authentication
- Microsoft OAuth Login
- RBAC
- Input Validation (Zod)
- Password Hashing (if local users are added)
- Secure File Uploads
- Audit Logging

---

# Project Status

| Item | Status |
|------|--------|
| Requirement Analysis | ✅ Completed |
| System Design | 🚧 In Progress |
| Database Design | ⏳ Pending |
| API Development | ⏳ Pending |
| Frontend Development | ⏳ Pending |
| Testing | ⏳ Pending |
| Deployment | ⏳ Pending |

---

# License

**Private & Confidential**

This software is developed exclusively for **Skytech Switchgear Pvt. Ltd.**

Unauthorized copying, modification, or distribution is prohibited.

---

# Maintainers

**Developer:** Vinayak  
**Client:** Skytech Switchgear Pvt. Ltd.  
**Version:** v1.0.0  
**Last Updated:** July 2026