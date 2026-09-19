# Chronicles — Interactive Historical Timeline Engine
trychronos.vercel.app

Chronicles is a full-stack historical timeline application that lets users explore curated historical timelines, compare different historical periods side-by-side, and dynamically generate new timelines for any topic using the Google Gemini AI API.

---

## 1. Overview

Understanding history through traditional text books or scattered web articles often makes it difficult to grasp the chronological sequence of events and see how different civilizational milestones connect.

**Chronicles** solves this by providing:
- **Interactive Chronological Views**: Visual vertical timeline interfaces where historical milestones are sorted strictly by chronological order.
- **Pre-loaded & Curated Timelines**: In-depth timelines covering Ancient, Medieval, Modern Indian History, World History, and modern technical milestones like the LLM revolution.
- **On-Demand AI Synthesis**: When a user searches for a topic that is not in the database, the backend queries Google's Gemini AI model to discover, rank, and synthesize historical events in structured format.
- **Read-Through Database Caching**: Generated timelines are automatically persisted in PostgreSQL (or local H2), making subsequent requests for the same topic instantaneous without re-calling the AI.
- **Side-by-Side Comparison Engine**: An interactive dual-column comparison view that synchronizes two distinct timelines by era and year to analyze synchronous global developments.

---

## 2. Key Features

- **Dynamic AI Timeline Generation**: Users can enter any historical or modern topic in the search bar. If no stored timeline exists, the backend uses the Gemini API to discover and return the top 6–10 significant events.
- **Strict Chronological Invariant**: Events are parsed and sorted by their true historical year (including BCE/CE notation and intra-year month/day ordering) so timelines are always chronologically accurate.
- **Read-Through Database Caching**: Synthesized events are automatically saved to PostgreSQL. Subsequent searches for the same topic are served directly from the database with zero AI latency.
- **Curated Pre-Built Timelines**: Built-in comprehensive timelines covering major eras such as the Indus Valley Civilization, Vedic Period, Mauryan Empire, Mughal Empire, Freedom Struggle, Space Age, and LLM History.
- **Dual-Timeline Comparison Engine**: Allows users to select two timelines and view synchronized events side-by-side to understand what was happening across different regions or domains during the same time period.
- **Event Detail Drawer**: Clicking any milestone opens a slide-out panel showing an expanded historical overview, causes and catalysts, key historical figures, consequences, and clickable citations.
- **Direct Reference Links**: Every event provides direct search/reference links to Wikipedia and Google Scholar monographs for academic verification.
- **Category and Era Filtering**: Quickly filter available timelines across Ancient, Medieval, Modern, and World history categories.
- **Responsive Dark Mode Interface**: Built with modern typography, smooth scroll animations, and an astrolabe-inspired hourglass aesthetic.

---

## 3. How the System Works

```
User Action (Search / Select)
       │
       ▼
React Frontend (Vite + TypeScript)
       │
       ▼  HTTP REST Request (GET / POST)
Spring Boot Backend (Java 21)
       │
       ├──► 1. Check Database (PostgreSQL / H2)
       │       │
       │       ├── If ≥ 6 events exist ──► Return Cached Timeline (Instant)
       │       │
       │       └── If < 6 events exist ──► Call Google Gemini API
       │                                         │
       │                                         ▼
       │                                  Validate & Sort Events
       │                                         │
       │                                         ▼
       │                                  Save to Database
       │                                         │
       ▼                                         ▼
Frontend renders interactive timeline with milestone cards and detail drawer
```

1. **User Request**: The user selects a pre-built timeline or types a new query in the search bar.
2. **Frontend Routing**: The React application checks whether local pre-built data is available or sends an HTTP request to the Spring Boot REST API (`/api/v1/timelines/generate` or `/api/v1/timelines/{slug}`).
3. **Backend Cache Lookup**: `TimelineService` queries `EventRepository` to check if events for this topic already exist in the database.
4. **AI Generation (On Cache Miss)**: If fewer than 6 events exist, `GeminiService` sends a structured prompt with a strict JSON schema (`responseSchema`) to Google's Gemini API.
5. **Validation & Sorting**: The backend validates every event (ensuring valid non-empty fields and parseable dates), converts BCE/CE dates to signed numerical years, sorts them in strict chronological order, and persists them to the database.
6. **UI Rendering**: The frontend receives the structured `TimelineResponse` and displays it using interactive cards on the central chronological timeline spine.

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Browser"]
        UI["React 19 + TypeScript (Vite)"]
        Components["Timeline Spine / Comparison Engine / Event Drawer"]
    end

    subgraph HostingFrontend["Frontend Hosting (Vercel)"]
        VercelCDN["Vercel Edge Network / Static Assets"]
    end

    subgraph BackendApp["Backend Server (Railway)"]
        Controller["TimelineController (REST API)"]
        TService["TimelineService (Validation & Sorting)"]
        GService["GeminiService (Prompt & Schema)"]
        Repo["EventRepository (Spring Data JPA)"]
    end

    subgraph ExternalAI["AI Provider"]
        GeminiAPI["Google Gemini API (v1beta REST)"]
    end

    subgraph Database["Database (Railway / Local)"]
        PostgresDB[("PostgreSQL Database / H2 File")]
    end

    UI <--> VercelCDN
    UI -- "REST API (JSON over HTTPS)" --> Controller
    Controller --> TService
    TService --> Repo
    Repo <--> PostgresDB
    TService -- "On Cache Miss" --> GService
    GService -- "HTTPS / Structured JSON" --> GeminiAPI
```

---

## 5. Technology Stack

| Layer / Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Spring Boot | 3.3.4 | Core backend REST API framework |
| **Programming Language** | Java | 21 (LTS) | Backend business logic, sorting algorithms, and records |
| **Data Access** | Spring Data JPA / Hibernate | 6.5.3 | Object-relational mapping and repository abstractions |
| **Database (Production)** | PostgreSQL | 15+ | Persistent cloud relational storage on Railway |
| **Database (Local Dev)** | H2 Database | 2.2.x | Zero-configuration embedded file database for local development |
| **AI Integration** | Google Gemini API | v1beta | LLM model for historical event discovery and synthesis |
| **HTTP Client** | Spring `RestClient` | Built-in | Non-blocking synchronous HTTP client for external AI API calls |
| **Build Tool (Backend)** | Apache Maven | 3.9+ | Backend dependency management and packaging |
| **Frontend Framework** | React | 19.2.8 | Declarative component-based user interface |
| **Frontend Language** | TypeScript | 6.0.2 | Static typing and interface contracts across the UI |
| **Build Tool (Frontend)** | Vite | 8.3.0 | Fast local development server and optimized production bundler |
| **Styling** | Tailwind CSS | 4.3.3 | Utility-first CSS framework for responsive layout and styling |
| **Iconography** | Lucide React | 1.45.0 | Clean SVG icon set |
| **Containerization** | Docker | Multi-stage | Multi-stage build with Eclipse Temurin 21 JRE runtime for cloud deployment |
| **Cloud Hosting** | Railway & Vercel | Cloud PaaS | Backend + DB hosted on Railway; Frontend hosted on Vercel |

---

## 6. Project Structure

```text
chronos/
├── .env.example                          # Configuration template for environment variables
├── Dockerfile                            # Multi-stage production container build (Maven + JRE 21)
│
├── backend/                              # Spring Boot Java Application
│   ├── pom.xml                           # Maven dependencies and Surefire plugin setup
│   └── src/
│       ├── main/
│       │   ├── java/com/chronicles/
│       │   │   ├── ChroniclesApplication.java # Spring Boot entrypoint, .env loader, CORS config
│       │   │   ├── config/
│       │   │   │   └── GeminiConfig.java      # RestClient bean and connection timeout settings
│       │   │   ├── controller/
│       │   │   │   └── TimelineController.java# REST endpoints (/api/v1/timelines/...)
│       │   │   ├── dto/
│       │   │   │   └── TimelineDtos.java      # Immutable Java Records for requests, responses & dates
│       │   │   ├── model/
│       │   │   │   ├── TimelineEvent.java     # JPA entity representing a historical milestone
│       │   │   │   └── Source.java            # JPA embeddable class for citations & references
│       │   │   ├── repository/
│       │   │   │   └── EventRepository.java   # Spring Data JPA interface for database queries
│       │   │   └── service/
│       │   │       ├── GeminiService.java     # Gemini API integration with structured JSON schema
│       │   │       └── TimelineService.java   # Read-through cache, date parser, and chronological sorter
│       │   └── resources/
│       │       └── application.yml            # Spring profiles (local H2 vs prod PostgreSQL)
│       └── test/                              # JUnit 5 & Mockito test suite
│
└── frontend/                             # React + TypeScript + Vite Application
    ├── package.json                      # Frontend dependencies & build scripts
    ├── vite.config.ts                    # Vite configuration
    ├── index.html                        # HTML entry point and metadata
    ├── public/
    │   └── favicon.svg                   # Custom Chronos hourglass SVG icon
    └── src/
        ├── App.tsx                       # Main application state, navigation, and modal handlers
        ├── index.css                     # Global styles and design tokens
        ├── components/
        │   ├── MasterRoadmap.tsx         # Catalog view with search, filter chips, and era groupings
        │   ├── VerticalTimeline.tsx      # Central interactive chronological timeline spine
        │   ├── ComparisonEngine.tsx      # Dual-timeline side-by-side comparative engine
        │   ├── EventDetailDrawer.tsx     # Slide-over event drawer with detailed analysis & citations
        │   └── HomeHero.tsx              # Landing search hero section
        ├── data/
        │   └── defaultTimelines.ts       # Rich pre-loaded offline historical datasets
        ├── services/
        │   └── api.ts                    # Fetch API client connecting to Spring Boot backend
        └── types/
            └── timeline.ts               # TypeScript interfaces matching backend models
```

---

## 7. Backend Architecture & Implementation

The backend follows a standard 3-tier layered architecture (`Controller → Service → Repository`).

### 1. Controllers (`com.chronicles.controller`)
- **`TimelineController`**: Exposes REST endpoints for fetching catalog summaries, retrieving single timelines, and initiating dynamic generation.

### 2. Services (`com.chronicles.service`)
- **`TimelineService`**:
  - **Read-Through Cache**: Checks `EventRepository` before querying Gemini. If 6 or more valid events exist, it skips external API calls.
  - **Date Parsing (`extractYear`)**: Extracts 4-digit years (e.g., `1789`, `2017`) and handles ancient BCE/BC dates (e.g., `250 BCE` → `-250`).
  - **Intra-Year Ordering (`extractMonthDay`)**: Parses month names and ISO dates so events in the same calendar year are ordered properly.
  - **Chronological Sorting**: Sorts events using signed integer year comparisons with month/day secondary comparisons.
  - **Validation (`validateEvents`)**: Filters out events with missing titles, invalid dates, or empty descriptions, and deduplicates identical titles.
- **`GeminiService`**:
  - Encapsulates HTTP communication with `https://generativelanguage.googleapis.com/v1beta`.
  - Configures strict `responseSchema` so the model always returns structured JSON matching `TimelineResponse`.

### 3. Data Transfer Objects (`com.chronicles.dto`)
- Uses modern Java `record` types (`TimelineRequest`, `TimelineResponse`, `TimelineEventDto`, `SourceDto`) for immutable data structures.

---

## 8. Frontend Architecture & Implementation

The frontend is built using **React 19**, **TypeScript**, and **Tailwind CSS v4** with **Vite** for fast builds.

### Key Components:
1. **`MasterRoadmap.tsx`**:
   - The primary catalog view showing prebuilt timelines and database records.
   - Includes real-time search with instant dropdown suggestions, quick category filters (Ancient, Medieval, Modern, World), and an AI generation prompt bar.
2. **`VerticalTimeline.tsx`**:
   - The core visualization. Renders events along a central vertical axis.
   - Displays milestone cards with era badges, formatted dates (e.g., `326 BCE`, `1947 CE`), concise summaries, and category tags.
3. **`ComparisonEngine.tsx`**:
   - Allows users to pick any two timelines and view them simultaneously.
   - Aligns events chronologically so the user can observe synchronous developments in different parts of the world.
4. **`EventDetailDrawer.tsx`**:
   - A slide-over panel that appears when any event is clicked.
   - Displays in-depth historical context, causes, key historical figures, consequences, historical significance, and source links.
5. **`api.ts`**:
   - Centralized network layer using native `fetch` with fallback handling when the backend is offline.

---

## 9. AI & Gemini Integration

### Why Gemini is Used
While the application comes pre-loaded with curated datasets, users may want to explore arbitrary historical subjects (e.g., *"History of Quantum Computing"*, *"Space Race"*, *"French Revolution"*). Gemini provides dynamic topic discovery and historiographical synthesis.

### How Gemini is Called
- **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
- **Configured Model**: `gemini-1.5-flash` (or `gemini-2.0-flash` / `gemini-2.5-flash`).
- **Structured Schema**: The request includes a `responseSchema` definition that forces Gemini to return valid JSON containing:
  - `topic` (string)
  - `description` (string)
  - `events` (array of objects with `title`, `date`, `description`, and `sources`)

### Backend Processing
1. The response JSON is parsed into `TimelineResponse`.
2. Every milestone passes through `validateEvents()` to verify format and non-empty content.
3. Events are sorted chronologically in Java.
4. Validated milestones are saved to PostgreSQL inside a dedicated `@Transactional` method.
5. The API key is stored securely in environment variables and is never exposed to the frontend or printed in client logs.

---

## 10. Database Architecture

The application uses **Spring Data JPA** with **PostgreSQL** in production and **H2** during local development.

### Entities

#### `TimelineEvent` Entity (`timeline_events` table)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(255) / PK | Unique identifier (UUID string) |
| `topic` | VARCHAR(255) | Normalized topic slug (e.g., `indus-valley-civilization`) |
| `title` | VARCHAR(255) | Title of the milestone event |
| `event_date` | VARCHAR(255) | Formatted date string (e.g., `2500 BCE`, `July 14, 1789`) |
| `description` | TEXT (columnDefinition) | Comprehensive historical explanation |

#### `Source` Embeddable (`timeline_event_sources` table)
Mapped via `@ElementCollection` linked by `event_id`:
| Column | Type | Description |
| :--- | :--- | :--- |
| `event_id` | VARCHAR(255) / FK | References `timeline_events(id)` |
| `title` | VARCHAR(255) | Name of the book, paper, or monograph |
| `url` | VARCHAR(255) | Direct URL or archive link |
| `publisher` | VARCHAR(255) | Academic press or archive publisher |

---

## 11. API Documentation

| Method | Endpoint | Description | Request Body | Response Summary |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/timelines` | Retrieves all stored timelines grouped by topic (Read-only, DB only) | None | `200 OK` with JSON array of `TimelineResponse` |
| `GET` | `/api/v1/timelines/{idOrSlug}` | Retrieves a single stored timeline by topic slug or ID (Read-only) | None | `200 OK` with `TimelineResponse` or `404 Not Found` |
| `POST` | `/api/v1/timelines/generate` | Synthesizes a timeline (Checks DB first; calls Gemini if missing) | `{"topic": "french-revolution"}` | `201 Created` with `TimelineResponse` |

### Example Request (`POST /api/v1/timelines/generate`)
```json
{
  "topic": "space-race"
}
```

### Example Response (`201 Created`)
```json
{
  "id": "c7a8b123-4567-89ab-cdef-0123456789ab",
  "slug": "space-race",
  "title": "Space Race",
  "topic": "space-race",
  "description": "Historical thesis and chronological milestone analysis for space-race.",
  "events": [
    {
      "id": "e1-4567-89ab",
      "title": "Launch of Sputnik 1",
      "date": "October 4, 1957",
      "description": "The Soviet Union launched the first artificial satellite into low Earth orbit.",
      "displayDate": "October 4, 1957",
      "year": 1957,
      "sources": [
        {
          "title": "NASA History Series",
          "url": "https://en.wikipedia.org/wiki/Sputnik_1",
          "publisher": "NASA"
        }
      ]
    }
  ]
}
```

---

## 12. Local Setup & Installation

### Prerequisites
- **Java Development Kit (JDK)**: Version 21 or higher
- **Node.js**: Version 18.x or higher (and `npm`)
- **Git**: For version control
- *(Optional)* **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/app/apikey) for dynamic generation

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/sahaj-raj/chronos.git
cd chronos
```

---

### Step 2: Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Open `.env` and set your configuration:
```properties
# Google Gemini AI API Key (Required for dynamic AI generation)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Spring profile for local development (uses zero-setup local H2 database)
SPRING_PROFILES_ACTIVE=local
PORT=8080
FRONTEND_URL=http://localhost:5173
```

---

### Step 3: Run the Backend (Spring Boot)

Open a terminal in the `backend` folder:
```bash
cd backend
# On Windows:
.\mvnw.cmd clean spring-boot:run
# On Linux / macOS:
./mvnw clean spring-boot:run
```
The backend will start at `http://localhost:8080`.
*(Optional: H2 Database console is accessible at `http://localhost:8080/h2-console` with JDBC URL `jdbc:h2:file:./data/chronos`)*

---

### Step 4: Run the Frontend (React + Vite)

Open a second terminal in the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`. Open this URL in your web browser.

---

## 13. Environment Variables Reference

| Variable | Used By | Purpose | Default / Example |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend | API key for Google Gemini model access | *(Set in .env)* |
| `GEMINI_MODEL` | Backend | Gemini model identifier | `gemini-1.5-flash` |
| `SPRING_PROFILES_ACTIVE` | Backend | Activates database profile (`local` for H2, `prod` for PostgreSQL) | `local` |
| `DATABASE_URL` | Backend | PostgreSQL connection URL in production | `postgresql://user:pass@host:5432/db` |
| `PORT` / `SERVER_PORT` | Backend | HTTP server listening port | `8080` |
| `FRONTEND_URL` | Backend | Allowed CORS origin for frontend requests | `http://localhost:5173` |
| `VITE_API_URL` | Frontend | Base URL of the Spring Boot backend API | `http://localhost:8080` |

> [!NOTE]
> Never commit real API keys or database passwords to version control. The `.env` file is excluded in `.gitignore`.

---

## 14. Deployment Architecture

```
[User Browser]
      │
      ├── (HTTPS) ──► Vercel (React Frontend Single Page App)
      │
      └── (HTTPS) ──► Railway (Spring Boot Container via Dockerfile)
                            │
                            ├──► Railway PostgreSQL Database
                            └──► Google Gemini AI API
```

1. **Frontend on Vercel**: The React application is built via `npm run build` and served from Vercel's global CDN. Environment variable `VITE_API_URL` points to the Railway backend domain.
2. **Backend on Railway**: The Spring Boot backend is packaged using the multi-stage `Dockerfile` (Maven builder + Eclipse Temurin 21 JRE).
3. **Database on Railway**: A managed PostgreSQL instance is connected via the `DATABASE_URL` environment variable automatically provided by Railway.

---

## 15. Example Usage Scenario

1. **Exploring Pre-Built Timelines**:
   - The user opens the home page and clicks on **"Indus Valley Civilization"**.
   - The interactive timeline renders 8 milestones spanning from the Early Harappan Phase (3300 BCE) to the Mature Harappan period and post-urban collapse.
2. **Generating a New Topic**:
   - The user searches for **"History of Microprocessors"**.
   - The system checks PostgreSQL and finds no existing records.
   - The backend dispatches a structured prompt to `gemini-1.5-flash`.
   - Gemini returns milestone events (Intel 4004, 8086, ARM architecture, etc.).
   - The backend validates the entries, extracts years (`1971`, `1978`, `1985`), sorts them chronologically, and saves them to PostgreSQL.
   - The frontend renders the new timeline immediately.
3. **Comparing Timelines**:
   - The user clicks **"Compare Timelines"** and selects **"Mauryan Empire"** and **"Ancient Rome"**.
   - The system renders a synchronized dual-column view showing developments in both civilizations across the 3rd to 1st centuries BCE.

---

## 16. Advantages

- **Cost & Latency Efficient**: Uses database caching so popular topics only incur an AI API cost once.
- **Strict Chronological Correctness**: Eliminates AI hallucinated date disorder by parsing and sorting dates in backend Java code.
- **Zero-Setup Local Development**: Automatically falls back to local H2 file storage when no external database is configured.
- **Structured Schema Safety**: Uses Gemini's `responseSchema` parameter to ensure responses adhere strictly to the expected JSON format.
- **Academic Citation Verification**: Every milestone contains source citations with direct reference links to Wikipedia and Google Scholar.

---

## 17. Limitations

- **Rate Limits on Free AI Tier**: Dynamic generation depends on Google Gemini API availability and rate quotas.
- **Historical Ambiguity**: For ancient events with uncertain exact dates (e.g., approximate centuries), the parser maps to the closest estimated numerical year.
- **Single Generation Pass**: Milestones are synthesized in a single structured generation call rather than an iterative multi-agent consensus loop.

---

## 18. Future Scope

- **User Accounts & Bookmarks**: Adding user authentication (JWT/OAuth) to save customized timelines and personal historical notes.
- **Interactive Map / Geospatial View**: Plotting event locations on an interactive world map alongside the timeline spine.
- **Timeline Export**: Exporting generated timelines to PDF or image formats for study and research reference.
- **Interactive Quiz / Flashcards**: Auto-generating educational recall quizzes from timeline milestones.

---

## 19. Academic Project Information

- **Course**: B.Tech Computer Science & Engineering (Semester Project)
- **Domain**: Full-Stack Web Development, Applied Generative AI & Historiographical Data Systems
- **Core Concepts Applied**:
  - 3-Tier Layered Backend Architecture (`Controller → Service → Repository`)
  - RESTful API design with Spring Boot 3 & Java 21 Records
  - Relational Database Modeling & Object-Relational Mapping with JPA / Hibernate
  - Read-Through Caching Pattern for external API cost reduction
  - LLM Structured Prompting & JSON Schema Validation
  - Modern Component-Driven Frontend Architecture with React 19 & TypeScript
