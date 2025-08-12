# Spec Requirements Document

> Spec: Setup Supabase
> Created: 2025-07-30
> Status: Completed

## Overview

This spec covers the initial setup and configuration of our Supabase project. The goal is to establish a secure, scalable, and locally runnable backend environment that will serve as the foundation for the entire AV Management Tool.

## User Stories

### Developer Experience

- As a developer, I want to initialize Supabase locally with a single command, so that I can quickly set up my development environment.
- As a developer, I want a clear and documented database schema, so that I can easily understand and interact with the data structure.
- As a developer, I want environment variables for Supabase keys to be managed securely and accessible to the Next.js application, so that I can connect the frontend to the backend without hardcoding sensitive information.

## Spec Scope

1.  **Initialize Supabase Project:** Use the Supabase CLI to initialize the project for local development.
2.  **Define Initial Database Schema:** Create the first migration script to define the core tables (`users`, `customers`, `products`, etc.).
3.  **Configure Environment Variables:** Set up `.env.local` to securely store and manage Supabase API keys.
4.  **Create Supabase Client:** Implement a singleton pattern for the Supabase client to be used throughout the Next.js application.

## Out of Scope

-   Deploying the Supabase project to the cloud.
-   Implementing Row-Level Security (RLS) policies (this will be handled in a separate, subsequent spec).
-   Seeding the database with initial data (this will be handled after the schema is finalized).

## Expected Deliverable

1.  The Supabase project can be started locally using the Supabase CLI (`supabase start`).
2.  A new folder `supabase/migrations` will exist containing the initial SQL schema file.
3.  The Next.js application can successfully connect to the local Supabase instance using a shared Supabase client.

## Spec Documentation

- **Tasks:** @software-projects/av-management-tool-v1/.agent-os/specs/01_setup-supabase/tasks.md
- **Technical Specification:** @software-projects/av-management-tool-v1/.agent-os/specs/01_setup-supabase/sub-specs/technical-spec.md
- **Database Schema:** @software-projects/av-management-tool-v1/.agent-os/specs/01_setup-supabase/sub-specs/database-schema.md
- **Tests Specification:** @software-projects/av-management-tool-v1/.agent-os/specs/01_setup-supabase/sub-specs/tests.md