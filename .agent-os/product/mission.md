# Volteus Product Mission

> **Last Updated:** 2025-01-08  
> **Version:** 1.0.0  
> **Based on:** Todd's AV Management Tool + Volteus Foundation

## Pitch

Volteus is a comprehensive business management platform that helps AV companies streamline their operations from lead to project completion by providing an all-in-one solution for quotes, project management, and customer relations. Built on a modern, scalable foundation with enterprise-grade infrastructure.

## Users

### Primary Customers

- **Small to Medium AV Companies:** Teams that need a unified system to manage sales, operations, and client relationships without juggling multiple disconnected software tools.
- **Growing AV Businesses:** Companies ready to scale beyond spreadsheets and email-based workflows.

### User Personas

**Todd Church (Business Owner/Director)**
- **Role:** Business Owner / Director at Clearpoint Technology + Design
- **Context:** Oversees all aspects of the company, from sales and quoting to project execution and financial health.
- **Pain Points:** Lack of a single view of the business pipeline, information getting lost between different tools (CRM, spreadsheets, email), difficulty tracking project profitability.
- **Goals:** Gain a clear, real-time overview of the business, improve team efficiency, and provide a seamless experience for customers.

**AV Team Member (Sales/Project Management)**
- **Role:** Salesperson / Project Manager
- **Context:** Responsible for creating quotes for clients and/or managing projects once a sale is made.
- **Pain Points:** Building quotes is time-consuming and manual, tracking project status is difficult, communication with clients is fragmented across email and phone calls.
- **Goals:** Create accurate and professional quotes quickly, manage projects effectively from a central hub, and have a clear record of all project-related activities.

## The Problem

### Disconnected Workflow & Inefficiency

Managing an AV business currently involves using a patchwork of disconnected tools for lead management (CRM/spreadsheets), quoting (Word/Excel), project management (Trello/Asana), and client communication (email). This fragmentation leads to duplicated data entry, lost information, project delays, and a disjointed customer experience. It creates significant administrative overhead that detracts from core business activities.

**Our Solution:** Provide a single, integrated platform that unifies the entire business lifecycle from the initial lead to final project delivery, built on modern infrastructure with enterprise reliability.

## User Roles & Permissions

This application features Role-Based Access Control (RBAC) to ensure users only have access to the information and actions relevant to their roles:

- **Super Admin (Business Owner):** Unrestricted access to all features, settings, and data across the entire system. Can manage user accounts and system-level configurations.
- **Project Manager:** Can manage users and company settings, access all projects, quotes, and customer data. Can create and modify quotes and projects.
- **Sales Rep:** Can create and manage leads, quotes, and customer accounts. Can view projects they are assigned to.
- **Lead Technician:** Can view project details, update task statuses, and add notes to projects they are assigned to. Has read-only access to relevant quote details.
- **Technician:** Limited access to assigned project tasks and updates. Cannot create or modify quotes.

## Differentiators

### Modern Enterprise Foundation
Built on Next.js 14, Supabase, and modern development practices with comprehensive testing, quality tools, and Agent OS methodology. This ensures scalability, reliability, and maintainability.

### All-in-One Integrated Platform
Unlike using separate CRM, quoting software, and project management tools, Volteus provides a single source of truth for all business activities. This eliminates data silos and streamlines the entire workflow.

### Professional Clearpoint Branding
Consistent brand implementation with Clearpoint Technology + Design's official color palette, Montserrat typography, and professional design standards throughout the application.

### Google Workspace Integration
Native integration with Google Workspace for authentication provides a secure and frictionless login experience for teams already using Google.

## Application Pages

Core pages providing dedicated workspaces for key business functions:

- **Login Page:** Secure entry point with Google Workspace authentication
- **Dashboard:** High-level overview of business metrics and recent activity
- **Customers:** Customer account management with contact hierarchy
- **Product Library:** Centralized product/service database with CSV import
- **Leads:** CRM-style interface for managing sales opportunities  
- **Quotes:** Comprehensive quote builder with PDF generation
- **Projects:** Project management hub tracking jobs from start to finish
- **Reports:** Business performance analytics and reporting
- **Settings:** User profiles and system administration

## Key Features

### Core Features (Implemented)
- **Google Workspace Authentication:** Secure login using existing Google accounts
- **Customer Account Management:** Hierarchical customer accounts with multiple contacts
- **Product & Service Library:** Centralized database with CSV import/export
- **Professional UI:** Consistent Clearpoint branding and design system
- **Comprehensive Testing:** Unit tests, API testing, and quality assurance

### Core Features (Planned from Todd's System)
- **Comprehensive Quote Builder:** Create, customize, and send detailed quotes
- **Project Management:** Convert quotes to projects, track statuses, assign tasks
- **Lead Management:** Track potential jobs from initial contact to quote creation
- **Email Integration:** Send quotes and updates directly from the application
- **PDF Generation:** Professional quote and report generation

### Advanced Features (Future)
- **Advanced Analytics:** Business intelligence and performance dashboards
- **AI-Powered Assistance:** Scope of work generation, task automation
- **Advanced Integrations:** Extended Google Workspace and third-party tool integration
- **Mobile Optimization:** Responsive design optimized for field work

## Technical Foundation

### Infrastructure
- **Frontend:** Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Testing:** Vitest, unit testing, API testing
- **Development:** Agent OS methodology, comprehensive quality tools
- **Deployment:** Modern CI/CD pipeline, version control best practices

### Quality Standards
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Testing:** Comprehensive test coverage for critical functionality
- **Documentation:** Agent OS spec-driven development
- **Performance:** Optimized loading, search, and data management
- **Security:** Row-level security, proper authentication, data validation
