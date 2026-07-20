# SkyTech SPMS — Technical Specifications & Database Architecture

> **Document Version**: v1.0  
> **System Scope**: Technical Architecture, Database Schemas, API Specs, and Cloud Deployment Guidelines  
> **Target Platform**: Node.js Express Backend & Next.js 15 App Router Frontend  

---

## 1. System Architecture Overview

SkyTech SPMS is architected as a decoupled full-stack TypeScript application:

```text
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                     │
│   (App Router, React 19, TailwindCSS, Lucide Icons)     │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP REST API
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND                     │
│  (Node.js, Express, TypeScript, Prisma ORM 5.22 LTS)    │
└────────────────────────────┬────────────────────────────┘
                             │ Prisma Client
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                      │
│   (Development: SQLite / Production: PostgreSQL EC2)   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Specifications

### Frontend Application (`/Frontend`)
- **Framework**: Next.js 15 (App Router) & React 19
- **Styling**: TailwindCSS with custom design system tokens (Dark Navy `#0B1728`, Brand Blue `#1D89F5`)
- **Iconography**: `lucide-react`
- **State Management**: React State Hooks (`useState`, `useEffect`, `useRef`) with `localStorage` persistence

### Backend API Server (`/Backend`)
- **Runtime**: Node.js & TypeScript (`ts-node`, `tsc`)
- **Framework**: Express.js with `cors` and `dotenv`
- **ORM Client**: Prisma ORM v5.22.0 (`@prisma/client`)
- **Database Engine**: SQLite for local zero-config testing (`dev.db`), PostgreSQL ready

---

## 3. Complete Database Schema (Prisma)

Below is the active relational database schema defined in `Backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Client Inquiries & Proposals
model Inquiry {
  id            String    @id @default(uuid())
  inquiryCode   String    @unique
  client        String
  project       String
  amount        Float
  contactPerson String?
  email         String?
  phone         String?
  date          DateTime  @default(now())
  status        String    // "Inquiry Received", "Offer Sent", "Confirmed", "Unconfirmed"
  remarks       String?
  weeksAgo      Int       @default(1)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orders        Order[]
  wbsTasks      WBSTask[]
}

// 2. Confirmed Orders & Jobs
model Order {
  id           String            @id @default(uuid())
  orderNumber  String            @unique
  inquiryId    String?
  inquiry      Inquiry?          @relation(fields: [inquiryId], references: [id])
  clientName   String
  projectName  String
  panels       String            
  priority     String            // "High", "Medium", "Low"
  currentStage String            
  progress     Int               @default(0)
  startDate    DateTime
  deadline     DateTime
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  phaseRemarks    PhaseRemark[]
  phaseChecklists PhaseChecklist[]
  materials       MaterialRequest[]
}

// 3. Work Breakdown Structure (WBS)
model WBSPhase {
  id        String    @id @default(uuid())
  wbsCode   String    @unique
  name      String
  badge     String
  owner     String
  tasks     WBSTask[]
}

model WBSTask {
  id          String   @id @default(uuid())
  wbsCode     String
  name        String
  phaseId     String
  phase       WBSPhase @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  inquiryId   String?
  inquiry     Inquiry? @relation(fields: [inquiryId], references: [id], onDelete: SetNull)
  owner       String
  planHours   Float
  actualHours Float    @default(0)
  status      String   // "DONE", "IN PROGRESS", "NOT STARTED"
  progress    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 4. Department Checklists & Remarks
model PhaseRemark {
  id        String   @id @default(uuid())
  orderId   String?
  order     Order?   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  phaseId   String   
  remark    String
  updatedAt DateTime @updatedAt
}

model PhaseChecklist {
  id        String   @id @default(uuid())
  orderId   String?
  order     Order?   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  phaseId   String   
  taskId    Int
  taskName  String
  completed Boolean  @default(false)
}

// 5. Employees & Microsoft SSO
model Employee {
  id          String   @id @default(uuid())
  empCode     String   @unique
  name        String
  email       String   @unique
  microsoftId String?  @unique // Prepared for Microsoft OAuth SSO
  department  String
  designation String
  role        String   // "Admin", "Engineer", "Supervisor", "Operator", "Viewer"
  status      String   // "Active", "On Leave", "Suspended"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  attendances Attendance[]
}

model Attendance {
  id          String   @id @default(uuid())
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  date        DateTime @default(now())
  clockIn     String?
  clockOut    String?
  status      String   
}

// 6. Material Inventory
model MaterialRequest {
  id            String   @id @default(uuid())
  requestCode   String   @unique
  orderId       String?
  order         Order?   @relation(fields: [orderId], references: [id], onDelete: SetNull)
  itemName      String
  quantity      Int
  requestedBy   String
  requestedDate DateTime @default(now())
  status        String   
}
```

---

## 4. Microsoft OAuth SSO & Cloud Deployment Guidelines

### Microsoft OAuth 2.0 Integration Plan
- Use `@azure/msal-node` and `@azure/msal-react` packages.
- Map incoming Azure Entra ID `oid` / `userPrincipalName` to the `Employee.microsoftId` and `Employee.email` columns.
- Authenticated requests pass a JWT Bearer token containing staff RBAC roles (`Admin`, `Engineer`, `Supervisor`, `Operator`).

### AWS EC2 & Cloud Database Deployment
1. Provision an **AWS EC2 instance** running Ubuntu Linux / Amazon Linux 2023.
2. Install Node.js runtime and PM2 process manager (`pm2 start dist/server.js`).
3. Point `DATABASE_URL` in `.env` to a PostgreSQL cloud database (AWS RDS PostgreSQL or Supabase):
   ```env
   DATABASE_URL="postgresql://user:password@db-hostname:5432/skytech_db?schema=public"
   ```
4. Run `npx prisma db push` on the EC2 server to migrate schemas seamlessly.
