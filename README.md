# 🎓 CampusMarketplace

> A mobile-first community marketplace built with **React Native (Expo)** and **Supabase**, developed as the practical artefact for the **Project Management 3 (PRM370/371/372S)** group project — *"Community Store Project"*

---

## 📋 Table of Contents

- [🎓 CampusMarketplace](#-campusmarketplace)
  - [📋 Table of Contents](#-table-of-contents)
  - [1. Introduction](#1-introduction)
  - [2. Project Objectives](#2-project-objectives)
  - [3. Project Scope](#3-project-scope)
    - [In-Scope](#in-scope)
    - [Out-of-Scope (Current Build)](#out-of-scope-current-build)
  - [4. System Constraints \& Assumptions](#4-system-constraints--assumptions)
    - [Constraints](#constraints)
    - [Assumptions](#assumptions)
  - [5. Expected Outcomes](#5-expected-outcomes)
  - [6. Design \& Prototype](#6-design--prototype)
  - [7. Tech Stack](#7-tech-stack)
  - [8. Core Features Implemented](#8-core-features-implemented)
  - [9. Project Structure](#9-project-structure)
  - [10. User Roles](#10-user-roles)


---

## 1. Introduction

Modern university campuses and their surrounding communities often struggle to access affordable goods, services, and sustainable trading options. Students looking for second-hand textbooks or affordable electronics, and local vendors wanting to reach that audience, are currently underserved by fragmented, low-trust channels like informal social media groups or generic external marketplaces.

**CampusMarketplace** is a mobile-first ecosystem that connects **students, faculty/staff, vendors, and residents** on a single trusted platform. Trust is designed in from the ground up:

* **Verified Identities:** Student sign-up is tied to university credentials, vendor accounts are verified, and every profile carries a distinct role.
* **Community Hub:** Beyond e-commerce, the app features a bulletin board for events, announcements, services, and lost & found.

The app is managed as a real Agile software project.

## 2. Project Objectives

* **Build a Trusted Campus Marketplace:** Enable safe trading of goods and services for students, staff, vendors, and local residents.
* **Establish Identity & Trust Mechanisms:** Provide role-based accounts, verification workflows, and administrative oversight.
* **Extend Commerce into Community Life:** Integrated bulletin board for general announcements, events, local services, and lost & found posts.
* **Deliver a Deployable Mobile Application:** Target iOS, Android, and Web via Expo to satisfy the PRM370/372S practical brief.
* **Apply Agile Project Management:** Execute iterative sprint planning, backlog management, task tracking, and retrospectives.
* **Produce PM Deliverables:** Generate comprehensive documentation (Charter, Risk Register, WBS, RACI, Quality & Transition Plans).
* **Navigate Real Technical Constraints:** Gain hands-on experience handling auth, payments, database security (RLS), and cloud storage.

---

## 3. Project Scope

### In-Scope
* **Client App:** React Native / Expo cross-platform app (iOS, Android, Web).
* **Backend:** Supabase (Auth, Postgres, Row Level Security, Storage, Edge Functions).
* **Multi-Role Profiles:** Distinct setups for Student, Staff, Vendor/Business, and Resident accounts.
* **Marketplace Core:** Listing creation, categorized browsing, product details, cart, and checkout workflows.
* **Payments:** Checkout integrations for Card, EFT, and PayFast.
* **Community Board:** Post creation and discovery for Announcements, Events, Services, and Lost & Found.
* **Real-Time Messaging:** In-app buyer–seller chat powered by live backend subscriptions.
* **Admin Tools:** Dashboard for user moderation, platform management, and verification reviews.

### Out-of-Scope (Current Build)
* Native push notifications and automated SMS alerts.
* In-app escrow or formal dispute-resolution workflows.
* Automated AI-driven fraud detection.
* Multi-campus / multi-tenant architecture (currently scoped to a single campus).
* Native iOS/Android App Store submissions (focused on Expo development/testing builds).

---

## 4. System Constraints & Assumptions

### Constraints
* **Academic Timeline:** Strict 6–7 month cycle across three weighted project terms (10% each).
* **Methodology:** Mandatory evidence of Agile practices (sprint boards, backlogs, retrospectives).
* **Fixed Stack:** Pinned to Expo SDK ~57, React Native 0.86, and React 19.
* **Cloud Dependency:** Fully dependent on active Supabase services (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

### Assumptions
* Users have access to a smartphone or browser with an active internet connection.
* Students provide valid university identification upon sign-up.
* Payment processing is handled via secure hosted provider flows without storing raw card data on the app's servers.

---

## 5. Expected Outcomes

* A fully functional cross-platform application capable of end-to-end user transactions, chat, and community posting.
* A secure, role-aware database protected by granular Row Level Security (RLS) policies.
* A complete portfolio of project management documentation across all three academic terms.
* A 10-minute video walkthrough demonstrating full system capabilities for the Term 3 final evaluation.

---

## 6. Design & Prototype

An interactive Figma prototype covering the app's core flows is available here:

🔗 [CampusMarketplace — Figma Prototype](https://www.figma.com/proto/6nZEkPUxk3kO67MQCXB9To/Campus-Marketplace?node-id=1-2&p=f&t=csKOgLOAwJwyw3hA-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2&show-proto-sidebar=1)

---

## 7. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Client** | React Native 0.86, React 19, Expo ~57 |
| **Navigation** | React Navigation (Bottom Tabs + Stack) |
| **Backend** | Supabase (Auth, Postgres DB, RLS, Storage, Edge Functions) |
| **State Management** | React Context API (`AuthContext`, `CartContext`, `ThemeContext`) |
| **Local Storage** | AsyncStorage |
| **Media Handling** | `expo-image-picker`, `expo-file-system`, `base64-arraybuffer` |
| **Email Service** | Resend (custom domain via Supabase SMTP) |
| **Language** | TypeScript |

---

## 8. Core Features Implemented

* 🔐 **Authentication:** Email/password sign-up, email verification, and OTP password resets.
* 👤 **Profile System:** Role-based onboarding for Students, Staff, Vendors, and Residents.
* 🛍️ **Marketplace:** Search, category filtering, listing management, cart, and checkout.
* 📌 **Bulletin Board:** Interactive community feed for events, services, and lost & found items.
* 💬 **Live Chat:** Real-time messaging between buyers and sellers.
* 🛡️ **Admin Panel:** Protected interface (`AdminGuard`) for user management and verification approval.
* 🎨 **Design System:** Custom theme featuring Cream (`#FDEEE0`) and Terracotta (`#C75C3E`) visual identity.

---

## 9. Project Structure

```text
CampusMarketplace/
├── App.tsx
├── app.json
├── src/
│   ├── components/      # ProductCard, CartItem, CategoryChip, AdminGuard
│   ├── context/         # AuthContext, CartContext, ThemeContext
│   ├── hooks/           # useAuth, useCart, useImagePicker, useTheme
│   ├── lib/
│   │   ├── api/         # Domain-split API modules (auth, product, chat, etc.)
│   │   ├── supabase.ts
│   │   ├── chatSubscriptions.ts
│   │   └── email.ts
│   ├── navigation/      # AuthNavigator, MainNavigator
│   ├── screens/         # 23 screens across Auth, Market, Bulletin, Chat, Admin
│   ├── types/
│   └── utils/
```

## 10. User Roles

| Role | Access & Capabilities |
| :--- | :--- |
| **Student** | Verified via student number/course. Buy, sell, and post to the bulletin board. |
| **Staff** | Faculty/staff profile configured with department and position attributes. |
| **Vendor** | Verified business profile with store details, business type, and address. |
| **Resident** | Local community account for general buying, selling, and posting. |
| **Admin** | Restricted access for platform moderation, content review, and verification checks. |