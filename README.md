# Olympiad Prep AI Assistant

This project is a web application designed to help students prepare for math olympiads. It features:
*   A Personalized AI Tutor to work through problems with hints and AI-generated feedback.
*   A Progress & Feedback section to track performance and get AI-driven summaries.

## Project Structure

Key files and directories:

*   `index.html`: The main HTML entry point.
*   `index.tsx`: The main React application file containing all components (`App`, `PersonalizedAITutor`, `ProgressFeedback`).
*   `App.module.css`: CSS Modules for the main `App` component and global-like styles.
*   `PersonalizedAITutor.module.css`: CSS Modules for the `PersonalizedAITutor` component.
*   `ProgressFeedback.module.css`: CSS Modules for the `ProgressFeedback` component.
*   `vite.config.ts`: Vite configuration file, including Vitest setup.
*   `jest.config.ts`: Jest configuration file (currently unused, superseded by Vitest).
*   `jest.setup.ts`: Jest setup file (potentially reusable by Vitest).
*   `package.json`: Project dependencies and scripts.
*   `tsconfig.json`: TypeScript configuration.
*   `README.md`: This file.

## Running the Project

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Set up Environment Variables:**
    This project requires an API key for Google GenAI (Gemini). You'll need to set this environment variable. Create a `.env.local` file in the root of the project with the following content:

    ```env
    VITE_GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
    ```
    Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual Google GenAI API key.

    *(Note: The application code has been updated to use `import.meta.env.VITE_GEMINI_API_KEY` as is standard for Vite projects.)*

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:5173` (or another port if 5173 is busy). Open this URL in your web browser.

### Running Tests

Tests are configured using Vitest. You can run them with:
```bash
npm test
```
Or, for the UI mode:
```bash
npm run test:ui
```

**Note on Sandbox Execution**: Due to potential limitations in some sandboxed development environments where `npm install` might not correctly set up CLI executables (like `vitest`), `npm test` could fail if the `vitest` command is not found. In a standard local development environment, these commands should work as expected.

## Development Notes

*   **Styling**: The project uses CSS Modules for component-scoped styling.
*   **State Management**: Primarily uses React's `useState`, `useRef`, and `useCallback` hooks.
*   **API Interaction**: Uses `@google/genai` for communication with the Gemini API.
*   **Charting**: Uses `Chart.js` for displaying progress charts.
*   **JSDoc**: Components and major functions include JSDoc comments for better understanding.

## Future Enhancements (Potential)
*   User authentication and persistent storage for progress.
*   Wider range of problem types and difficulty levels.
*   More sophisticated drawing tools.
*   Integration with actual Olympiad event calendars.
*   More detailed and adaptive feedback from the AI tutor.
