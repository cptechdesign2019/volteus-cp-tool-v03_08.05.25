# Page Brief: Quotes

> **Phase:** 3
> **Status:** Not Started

## Core Requirements

This page is one of the most complex and critical parts of the application.

### Quotes Dashboard

- When navigating to the Quotes page, the user should first see a dashboard view.
- This dashboard should display existing quotes as individual "cards," providing a quick overview.
- **Quote Statuses:** The system must support the following five statuses:
  1.  `Draft`
  2.  `Sent`
  3.  `Pending Changes`
  4.  `Accepted`
  5.  `Expired`

### Quote Creation Workflow

The process for creating a new quote should follow a clear, multi-step workflow:
1.  **Setup:** Initial quote configuration (e.g., selecting a customer, naming the quote).
2.  **Build:** The main quote construction phase.
3.  **Review:** A final check of the completed quote.
4.  **Send:** Delivering the quote to the customer.

### Quote Builder Sections

The "Build" step must be divided into four distinct sections:
1.  **Equipment:** Adding products from the Product Library.
2.  **Labor:** Adding labor charges and services.
3.  **Scope of Work:** A detailed description of the work to be performed (potential for AI assistance).
4.  **Review & Send:** Final review before sending.

_Further specific details will be defined during active development._