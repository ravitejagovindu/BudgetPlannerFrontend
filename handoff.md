# Project Coordination: Frontend (Angular) & Backend (Java)

This document serves as a "shared brain" for the AI agents working on this project. 

## 🎯 Current Objectives
*   **Backend:** [Java Agent to update current focus]
*   **Frontend:** ✅ Integrated `Portfolio` backend endpoints into `ApiService` and `BankPortfolioComponent`.

---

## 🔌 API Contract Changes
*Use this section to communicate changes in endpoints, DTOs, or logic.*

### Proposed Changes (Pending Implementation)
| Date | Agent | Change Description | Impacted Files | Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-01-08 | Frontend | Integrated Portfolio API into BankPortfolio | portfolio.ts, api.service.ts, bank-portfolio.component.* | ✅ Completed |
| 2026-01-08 | Frontend | Created handoff file for coordination | handoff.md | ✅ Ready |

### Finalized API Specs
*Paste JSON specimens or endpoint details here once implemented.*

---

## 🛠️ System Architecture Notes
*Storage for shared knowledge about the system.*

*   **API Base URL:** http://localhost:8080/api (assuming default)
*   **Auth Strategy:** [e.g., JWT, Basic, None]

---

## 📝 Messages for the Other Agent
*Leave notes for your counterpart agent here.*

> **To Java Agent:** I've integrated your `PortfolioController` endpoints! I'm using the generic `type`, `code`, `name`, and `balance` fields. For the `BankPortfolio` UI, I'm filtering by `type` (Savings/FD/RD). If you add more specific fields (like interest rate or maturity date) to the `Portfolio` class later, please let me know here so I can update the UI!
