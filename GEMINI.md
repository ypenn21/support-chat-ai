# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

* **Primary Goal:** This project is a Chrome extension that provides AI-powered support automation to agents. The initial MVP will focus on platforms like Coinbase and Robinhood. It uses Google Vertex AI's Gemini models to generate response suggestions in real-time (Suggestion Mode) or respond autonomously to customer messages (YOLO Mode).
* **Business Domain:** Customer Support, AI-powered Automation, Fintech.
* **Reference Docs:** For more detailed design and architecture, refer to the documents in the `/docs` folder, especially `project-design.md` and `tech-stack.md`.

## 2. Core Technologies & Stack

* **Languages:**
    *   **Python 3.11:** For the backend API.
    *   **TypeScript:** For the Chrome extension frontend and logic.
* **Frameworks & Runtimes:**
    *   **FastAPI:** For the asynchronous Python backend API.
    *   **React 18:** For the extension's popup and options pages.
    *   **Vite:** As the build tool and development server for the Chrome extension.
    *   **Node.js:** As the runtime environment for the extension's development and build processes.
* **Databases:**
    *   **Google Firestore:** Used for analytics and feedback collection (optional, as per documentation).
* **Key Libraries/Dependencies:**
    *   **Backend:** `google-cloud-aiplatform` (for Vertex AI), `pydantic` (for data validation), `uvicorn` (as the ASGI server).
    *   **Frontend:** `react`, `@crxjs/vite-plugin` (for extension development), `tailwindcss` (for styling), `zustand` (for state management).
* **Package Manager(s):**
    *   **pip:** For the Python backend (with `requirements.txt`).
    *   **npm:** For the TypeScript/React frontend (with `package.json`).

## 3. Architectural Patterns

* **Overall Architecture:** The system uses a three-tier architecture:
    1.  **Chrome Extension (Frontend):** Injected into support chat websites, it observes the DOM, extracts conversation context, and displays AI suggestions or sends automated responses.
    2.  **FastAPI Backend (Middleware):** Deployed on Google Cloud Run, it serves as the bridge between the extension and the AI model. It handles API requests, processes context, and communicates with Vertex AI.
    3.  **Google Vertex AI (AI Service):** The core intelligence, generating responses based on the prompts constructed by the backend.
* **Directory Structure Philosophy:**
    *   `/extension`: Contains all source code for the Chrome extension (React UI, content scripts, background service worker).
    *   `/backend`: Contains all source code for the Python FastAPI application.
    *   `/docs`: Contains detailed project documentation, including architecture diagrams and design decisions.
    *   `/.gemini`, `/.claude`: Holds configuration and context files for AI development assistants.
    *   `/tests`: Subdirectories within `backend` and `extension` contain unit and integration tests.

## 4. Coding Conventions & Style Guide

* **Formatting:**
    *   **Python (Backend):** Follows **PEP 8**. Uses `black` for code formatting (100-char line length) and `isort` for import sorting, as configured in `pyproject.toml`.
    *   **TypeScript (Frontend):** Uses `prettier` for code formatting. Key rules from `.prettierrc`: 2-space indentation, single quotes, no semicolons, 100-char print width.
* **Naming Conventions:**
    *   `variables`, `functions`: `camelCase` in TypeScript, `snake_case` in Python.
    *   `classes`, `components`: `PascalCase` in both TypeScript (React components) and Python.
    *   `files`: `kebab-case` or `PascalCase` (`.tsx`) in the frontend; `snake_case` in the backend.
* **API Design:** The backend exposes a RESTful API. Endpoints are defined in `backend/app/api/routes/`. It uses standard HTTP verbs and JSON for request/response bodies, with data models validated by Pydantic.
* **Error Handling:** The backend uses FastAPI's exception handling. The frontend has a dedicated `error-handler.ts` utility, suggesting a structured approach to managing errors.

## 5. Key Files & Entrypoints

* **Main Entrypoint(s):**
    *   **Backend:** `backend/app/main.py` initializes the FastAPI application.
    *   **Extension:** `extension/public/manifest.json` is the manifest file that defines the extension's components, including the background service worker (`background/index.ts`), content scripts (`content/index.ts`), and UI pages.
* **Configuration:**
    *   **Backend:** Environment variables are loaded from a `.env` file into a Pydantic `Settings` object defined in `backend/app/core/config.py`. An example is in `.env.example`.
    *   **Frontend:** Environment variables are managed via `.env` files (e.g., `VITE_API_URL`), loaded by Vite.
* **CI/CD Pipeline:** No CI/CD pipeline configuration file (e.g., `.github/workflows/main.yml`) was found in the project structure. Deployment is documented via manual `gcloud` and `docker` commands in the `README.md`.

## 6. Development & Testing Workflow

* **Local Development Environment:**
    *   **Extension:** Run `npm install` then `npm run dev` in the `/extension` directory.
    *   **Backend:** After creating a virtual environment, run `pip install -r requirements.txt` then `uvicorn app.main:app --reload` in the `/backend` directory.
* **Testing:**
    *   **Extension:** Run tests via `npm test` (which executes `vitest`).
    *   **Backend:** Run tests via `pytest`. Test files are located in the `tests/` directory.
* **CI/CD Process:** There is no automated CI/CD process defined. The `README.md` provides instructions for manual deployment to Google Cloud Run.

## 7. Specific Instructions for AI Collaboration

* **Contribution Guidelines:** Follow the instructions in the `README.md`: Fork the repository, create a feature branch, run tests and linting, and then submit a pull request.
* **Infrastructure (IaC):** There is no formal Infrastructure as Code directory. However, the `README.md` and `GEMINI.md` contain `gcloud` CLI commands for deploying the backend to Cloud Run. Changes to these commands can affect the cloud infrastructure and should be reviewed carefully.
* **Security:** Security is a critical requirement. Do not store conversation data permanently. Never hardcode secrets or API keys; use environment variables and Secret Manager as documented. All API inputs must be validated using Pydantic models.
* **Dependencies:**
    *   **Frontend:** To add a new dependency, run `npm install <package-name>` in the `/extension` directory and ensure it is added to the correct dependency list in `package.json`.
    *   **Backend:** Add the new dependency to `requirements.txt` and run `pip install -r requirements.txt`.
* **Commit Messages:** The commit history should be analyzed to determine the conventional style. A common standard is the [Conventional Commits specification](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`).
