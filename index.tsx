
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Chart from 'chart.js/auto';

import appStyles from './App.module.css';
import tutorStyles from './PersonalizedAITutor.module.css';
import progressStyles from './ProgressFeedback.module.css';

// Problem Data (taken from the provided PDF)
const problems = [
  {
    id: 1,
    title: "HMMT Feb 2025 - Guts Round, Problem 1",
    text: "Call a 9-digit number a cassowary if it uses each of the digits 1 through 9 exactly once. Compute the number of cassowaries that are prime.",
    answer: "0",
    solution: "Every cassowary is divisible by 3, as the sum of its digits is 1+2+...+9 = 45. Since all such numbers are divisible by 3 and and greater than 3, none of them are prime. So, there are 0 prime cassowaries.",
    hints: [
      "Think about what properties a 'cassowary' number has regarding its digits.",
      "Consider divisibility rules. Is there a divisibility rule that applies to all cassowary numbers?",
      "The sum of digits 1 through 9 is 45. What does this imply about the divisibility of any cassowary number?",
      "If a number is divisible by a number other than 1 and itself, and is greater than that divisor, can it be prime?"
    ],
    topic: "Number Theory"
  },
  { id: 2, title: "HMMT Feb 2025 - Problem 2", text: "Compute...", solution: "...", answer: "1/4", hints: [], topic: "Algebra" },
  { id: 3, title: "HMMT Feb 2025 - Problem 3", text: "Jacob rolls two fair six-sided dice...", solution: "...", answer: "5/12", hints: [], topic: "Probability" },
  { id: 4, title: "HMMT Feb 2025 - Problem 4", text: "Let ∆ABC be an equilateral triangle...", solution: "...", answer: "√3", hints: [], topic: "Geometry" },
  { id: 5, title: "HMMT Feb 2025 - Problem 5", text: "Compute the largest possible radius of a circle...", solution: "...", answer: "2√2 - 2", hints: [], topic: "Geometry" },
  { id: 6, title: "HMMT Feb 2025 - Problem 6", text: "Let ∆ABC be an equilateral triangle. Point D lies on segment BC...", solution: "...", answer: "2√13", hints: [], topic: "Geometry" },
  { id: 7, title: "HMMT Feb 2025 - Problem 7", text: "The number (9^9 - 8^8)/1001 is an integer...", solution: "...", answer: "231", hints: [], topic: "Number Theory" },
  { id: 8, title: "HMMT Feb 2025 - Problem 8", text: "A checkerboard is a rectangular grid...", solution: "...", answer: "9", hints: [], topic: "Combinatorics" },
  { id: 9, title: "HMMT Feb 2025 - Problem 9", text: "Let P and Q be points selected uniformly...", solution: "...", answer: "5/6", hints: [], topic: "Probability" },
  { id: 10, title: "HMMT Feb 2025 - Problem 10", text: "A square of side length 1 is dissected...", solution: "...", answer: "2 + 3√2", hints: [], topic: "Geometry" },
];

interface Problem {
  id: number;
  title: string;
  text: string;
  answer: string;
  solution: string;
  hints: string[];
  topic: string;
}

/**
 * @summary Provides an interactive AI-powered tutoring experience for math olympiad problems.
 * @description This component displays a math problem, allows users to input text and drawing solutions,
 * request hints, and submit their solutions for feedback from an AI tutor (Gemini API).
 * It manages state for the current problem, user inputs, hints, and AI-generated feedback.
 */
const PersonalizedAITutor: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<Problem>(problems[0]);
  const [userTextSolution, setUserTextSolution] = useState<string>("");
  const [drawingDataUrl, setDrawingDataUrl] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string>("");
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(-1);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const ai = useRef<GoogleGenAI | null>(null);

  /**
   * @summary Initializes the GoogleGenAI client.
   * @effect Creates a new GoogleGenAI instance if API_KEY is available in environment variables.
   * Sets an error message in feedbackText if the API key is not found.
   */
  useEffect(() => {
    // Vite specific environment variable for API Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (apiKey) {
      ai.current = new GoogleGenAI({ apiKey });
    } else {
      console.error("VITE_GEMINI_API_KEY environment variable not set. AI features will be disabled.");
      setFeedbackText("AI Tutor is currently unavailable: API Key not configured.");
    }
  }, []);
  
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  /**
   * @summary Handles the start of a drawing action on the canvas.
   * @param {React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>} e - The mouse or touch event.
   * @effect Sets `isDrawing` ref to true and records the starting position.
   */
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getMousePos(e);
    if (pos) {
      lastPos.current = pos;
    }
  }, [getCanvasContext]);

  /**
   * @summary Handles the drawing action on the canvas as the mouse or touch moves.
   * @param {React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>} e - The mouse or touch event.
   * @effect Draws a line from the last recorded position to the current event position.
   */
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const ctx = getCanvasContext();
    const pos = getMousePos(e);
    if (!ctx || !pos || !lastPos.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [getCanvasContext]);

  /**
   * @summary Handles the end of a drawing action on the canvas.
   * @effect Sets `isDrawing` ref to false, clears `lastPos`, and updates `drawingDataUrl` with the canvas content.
   */
  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    if (canvasRef.current) {
      setDrawingDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  }, []);
  
  /**
   * @summary Calculates the mouse/touch position relative to the canvas.
   * @param {React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>} e - The mouse or touch event.
   * @returns {{x: number, y: number} | null} The coordinates relative to the canvas, or null if canvas is not available.
   */
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e.nativeEvent) {
      clientX = e.nativeEvent.touches[0].clientX;
      clientY = e.nativeEvent.touches[0].clientY;
    } else {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  /**
   * @summary Clears the drawing canvas.
   * @effect Clears the canvas content and resets `drawingDataUrl` to null.
   */
  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawingDataUrl(null);
    }
  };

  /**
   * @summary Provides the next available hint for the current problem.
   * @effect Updates `hintText` and `currentHintIndex` state.
   */
  const handleGetHint = () => {
    if (currentHintIndex < currentProblem.hints.length - 1) {
      const newHintIndex = currentHintIndex + 1;
      setCurrentHintIndex(newHintIndex);
      setHintText(currentProblem.hints[newHintIndex]);
    } else {
      setHintText("No more hints available for this problem.");
    }
  };

  /**
   * @summary Submits the user's solution (text and/or drawing) to the AI for feedback.
   * @description Constructs a prompt with the problem, correct solution, and student's attempt.
   * Sends this to the Gemini API and updates `feedbackText` with the response.
   * Manages `isLoadingFeedback` state.
   * @async
   */
  const handleSubmitSolution = async () => {
    if (!ai.current) {
      setFeedbackText("AI Tutor is currently unavailable: API Key not configured.");
      return;
    }
    if (!userTextSolution.trim() && !drawingDataUrl) {
      setFeedbackText("Please provide a solution (text or drawing) before submitting.");
      return;
    }

    setIsLoadingFeedback(true);
    setFeedbackText("Generating feedback, please wait...");

    let prompt = `You are an AI Math Olympiad tutor. The student is working on the following problem:
Problem:
"${currentProblem.text}"
(Topic: ${currentProblem.topic})

The correct solution is:
"${currentProblem.solution}"
The correct answer is: "${currentProblem.answer}"

The student has submitted the following solution:
Text:
"${userTextSolution || '(No text solution provided)'}"
`;

    const contentParts: any[] = [{ text: prompt }];
    
    if (drawingDataUrl) {
      contentParts.push({text: "\nStudent's Drawing:"});
      contentParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: drawingDataUrl.split(',')[1], 
        },
      });
    } else {
        contentParts.push({text: "\n(No drawing was submitted for this solution.)"});
    }

    contentParts.push({text: `\nPlease provide feedback on the student's solution. Focus on:
1. Correctness: How close is their answer and method to the correct one? Identify any mathematical errors.
2. Efficiency & Elegance: Is the solution direct and well-reasoned, or could it be more concise or elegant?
3. Clarity & Presentation: Is the solution clearly explained and easy to follow? Is the notation correct?
4. Completeness: Did the student address all parts of the problem?

Provide constructive criticism, highlight strong points, and suggest areas for improvement. If the student made a drawing, comment on how it aids (or doesn't aid) their solution. Be encouraging. Structure your feedback clearly.`});

    try {
      const response: GenerateContentResponse = await ai.current.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ parts: contentParts }],
      });
      setFeedbackText(response.text);
    } catch (error) {
      console.error("Error getting feedback from Gemini API:", error);
      setFeedbackText("Sorry, an error occurred while generating feedback. Please try again.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };
  
  /**
   * @summary Sets the initial width and height of the drawing canvas based on its parent container.
   * @effect Resizes the canvas element. This runs once on component mount.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        const rect = canvas.parentElement?.getBoundingClientRect();
        canvas.width = rect ? rect.width : 300; 
        canvas.height = 200; 
    }
  }, []);


  return (
    <div className={tutorStyles.aiTutorContainer}>
      <h3 className={tutorStyles.heading}>{currentProblem.title}</h3> {/* Assuming .heading or similar for h3 if specific styles applied beyond tag */ }
      <p className={tutorStyles.problemText} role="document" aria-live="polite">{currentProblem.text}</p>
      
      <div className={tutorStyles.workspaceContainer}>
        <h4 className={tutorStyles.subHeading}>Your Workspace</h4> {/* Assuming .subHeading or similar for h4 */ }
        <div className={tutorStyles.solutionInputArea}>
          <label htmlFor="text-solution">Type your solution:</label>
          <textarea
            id="text-solution"
            value={userTextSolution}
            onChange={(e) => setUserTextSolution(e.target.value)}
            placeholder="Explain your steps here..."
            rows={6}
            aria-label="Text solution input area"
          />
        </div>
        <div className={tutorStyles.drawingArea}>
          <label htmlFor="drawing-canvas">Sketch your ideas (optional):</label>
          <canvas
            id="drawing-canvas" // ID can remain for JS hooks like ref
            className={tutorStyles.drawingCanvas} // Apply class for styling
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            aria-label="Drawing canvas for sketching solutions"
          />
          <button onClick={clearCanvas} className={`${appStyles.secondaryButton} ${tutorStyles.clearButton}`} aria-label="Clear drawing canvas">Clear Drawing</button> {/* Example of combining module styles if needed, or just one */}
        </div>
      </div>

      <div className={tutorStyles.controlsArea}>
        <button 
          onClick={handleGetHint} 
          className={appStyles.secondaryButton}
          aria-controls="hint-display-area"
        >
          Get Hint
        </button>
        <button 
          onClick={handleSubmitSolution} 
          className={appStyles.actionButton}
          disabled={isLoadingFeedback}
          aria-controls="feedback-display-area"
        >
          {isLoadingFeedback ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>

      {hintText && (
        <div id="hint-display-area" className={tutorStyles.hintArea} role="alert">
          <strong>Hint:</strong> {hintText}
        </div>
      )}

      {feedbackText && (
        <div id="feedback-display-area" className={tutorStyles.feedbackArea} role="alert">
          <strong>AI Tutor Feedback:</strong>
          <pre>{feedbackText}</pre>
        </div>
      )}
    </div>
  );
};

interface ProgressEntry {
  problemId: number;
  problemTitle: string;
  status: 'correct' | 'incorrect' | 'partial';
  topic: string;
}

/**
 * @summary Displays user's progress through charts and provides AI-generated summaries.
 * @description This component visualizes problem-solving accuracy overall and by topic using Chart.js.
 * It also allows users to request an AI-generated summary of their performance from the Gemini API.
 * Manages state for progress data, AI summary, and loading states.
 */
const ProgressFeedback: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const topicChartRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartInstance = useRef<Chart | null>(null);
  const topicChartInstance = useRef<Chart | null>(null);
  
  const ai = useRef<GoogleGenAI | null>(null);

  /**
   * @summary Initializes the GoogleGenAI client for the ProgressFeedback component.
   * @effect Creates a new GoogleGenAI instance if API_KEY is available. Logs an error if not.
   */
  useEffect(() => {
    // Vite specific environment variable for API Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (apiKey) {
      ai.current = new GoogleGenAI({ apiKey });
    } else {
      console.error("VITE_GEMINI_API_KEY environment variable not set for ProgressFeedback. AI features will be disabled.");
    }
  }, []);

  /**
   * @summary Loads mock progress data on component mount.
   * @effect Populates `progressData` state with sample data.
   * TODO: Replace with actual progress data fetching or integration.
   */
  useEffect(() => {
    const mockData: ProgressEntry[] = problems.slice(0, 10).map(p => ({
      problemId: p.id,
      problemTitle: p.title,
      status: 'correct',
      topic: p.topic || "General", // Fallback topic
    }));
    setProgressData(mockData);
  }, []);

  /**
   * @summary Renders or updates the overall accuracy doughnut chart.
   * @description Uses Chart.js to display the distribution of correct, incorrect, and partial answers.
   * @effect Creates or updates a Chart.js instance referenced by `accuracyChartInstance`.
   */
  const renderAccuracyChart = useCallback(() => {
    if (!accuracyChartRef.current || progressData.length === 0) return;

    if (accuracyChartInstance.current) {
      accuracyChartInstance.current.destroy();
    }

    const ctx = accuracyChartRef.current.getContext('2d');
    if (!ctx) return;

    const correctCount = progressData.filter(p => p.status === 'correct').length;
    const incorrectCount = progressData.filter(p => p.status === 'incorrect').length;
    const partialCount = progressData.filter(p => p.status === 'partial').length;

    accuracyChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Correct', 'Incorrect', 'Partial'],
        datasets: [{
          label: 'Overall Accuracy',
          data: [correctCount, incorrectCount, partialCount],
          backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
          borderColor: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Overall Problem Accuracy' }
        }
      }
    });
  }, [progressData]);

  /**
   * @summary Renders or updates the performance by topic bar chart.
   * @description Uses Chart.js to display the percentage of correct answers for each topic.
   * @effect Creates or updates a Chart.js instance referenced by `topicChartInstance`.
   */
  const renderTopicChart = useCallback(() => {
    if (!topicChartRef.current || progressData.length === 0) return;

    if (topicChartInstance.current) {
      topicChartInstance.current.destroy();
    }
    
    const ctx = topicChartRef.current.getContext('2d');
    if (!ctx) return;

    const topicStats: { [key: string]: { correct: number, total: number } } = {};
    progressData.forEach(p => {
      if (!topicStats[p.topic]) {
        topicStats[p.topic] = { correct: 0, total: 0 };
      }
      if (p.status === 'correct') {
        topicStats[p.topic].correct++;
      }
      topicStats[p.topic].total++;
    });

    const labels = Object.keys(topicStats);
    const data = labels.map(topic => (topicStats[topic].correct / topicStats[topic].total) * 100);

    topicChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '% Correct by Topic',
          data: data,
          backgroundColor: '#79cdf0',
          borderColor: '#005f73',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Accuracy (%)' } } },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Performance by Topic' }
        }
      }
    });
  }, [progressData]);

  /**
   * @summary Manages the rendering and cleanup of progress charts.
   * @effect Calls `renderAccuracyChart` and `renderTopicChart` when `progressData` changes.
   * Cleans up Chart.js instances on component unmount.
   */
  useEffect(() => {
    renderAccuracyChart();
    renderTopicChart();
    
    // Cleanup charts on component unmount
    return () => {
        if (accuracyChartInstance.current) accuracyChartInstance.current.destroy();
        if (topicChartInstance.current) topicChartInstance.current.destroy();
    }
  }, [progressData, renderAccuracyChart, renderTopicChart]);

  /**
   * @summary Fetches an AI-generated summary of the student's progress.
   * @description Constructs a prompt with the student's performance data and sends it to the Gemini API.
   * Updates `aiSummary` with the response. Manages `isLoadingSummary` state.
   * @async
   */
  const handleGetAISummary = async () => {
    if (!ai.current) {
      setAiSummary("AI Advisor is currently unavailable: API Key not configured.");
      return;
    }
    if (progressData.length === 0) {
      setAiSummary("No progress data available to analyze.");
      return;
    }

    setIsLoadingSummary(true);
    setAiSummary("Generating AI summary, please wait...");

    let performanceDetails = "The student has attempted the following problems:\n";
    progressData.forEach(p => {
      performanceDetails += `- ${p.problemTitle} (Topic: ${p.topic}): ${p.status}\n`;
    });

    const prompt = `You are an encouraging AI academic advisor for a math olympiad student.
The student has achieved the following results on a set of 10 problems:
${performanceDetails}

Since the student answered all 10 problems correctly, this is an excellent performance!

Based on this perfect score for this set of problems, please provide:
1.  A positive and encouraging summary of their progress, congratulating them on their success.
2.  Highlight their strengths (e.g., consistency, accuracy across the different topics encountered like ${[...new Set(progressData.map(p=>p.topic))].join(', ')}).
3.  Suggest specific and actionable next steps for this high-achieving student. This could include:
    *   Tackling more complex or advanced problems within the topics they've shown mastery in.
    *   Exploring new, related advanced mathematical topics relevant to olympiads.
    *   Focusing on strategies like speed, efficiency of solutions, or writing rigorous proofs if these are areas for further refinement even with correct answers.
    *   Participating in mock contests under timed conditions to simulate the real olympiad environment.
    *   Suggesting specific types of challenging problems or resources they might find stimulating.

Be very positive and motivational. Structure your feedback clearly.`;

    try {
      const response: GenerateContentResponse = await ai.current.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: [{ parts: [{text: prompt}] }],
      });
      setAiSummary(response.text);
    } catch (error) {
      console.error("Error getting AI summary from Gemini API:", error);
      setAiSummary("Sorry, an error occurred while generating the AI summary. Please try again.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className={progressStyles.progressFeedbackContainer}>
      <h4 className={progressStyles.heading}>Your Performance Overview</h4> {/* Assuming .heading or similar for h4 */}
      {progressData.length > 0 ? (
        <>
          <div className={progressStyles.chartsContainer}>
            <div className={progressStyles.chartWrapper} aria-label="Overall Accuracy Chart">
              <canvas ref={accuracyChartRef} id="accuracyChart"></canvas>
            </div>
            <div className={progressStyles.chartWrapper} aria-label="Performance by Topic Chart">
              <canvas ref={topicChartRef} id="topicChart"></canvas>
            </div>
          </div>
          <button 
            onClick={handleGetAISummary} 
            className={appStyles.actionButton}
            disabled={isLoadingSummary}
            aria-controls="ai-summary-display-area"
          >
            {isLoadingSummary ? 'Generating Summary...' : 'Get AI Progress Summary'}
          </button>
          {aiSummary && (
            <div id="ai-summary-display-area" className={progressStyles.aiSummaryArea} role="status">
              <strong>AI Advisor Summary:</strong>
              <pre>{aiSummary}</pre>
            </div>
          )}
        </>
      ) : (
        <p>No progress data yet. Complete some problems in the AI Tutor section to see your progress!</p>
      )}
    </div>
  );
};

/**
 * @summary Main application component.
 * @description Serves as the root component that lays out the different sections of the application,
 * including the AI Tutor, upcoming events (placeholder), and progress feedback.
 */
const App: React.FC = () => {
  return (
    // The <style> block will be removed
    <>
      <div className={appStyles.appWrapper}>
        <div className={appStyles.appContainer} role="main">
          <header className={appStyles.appHeader} role="banner">
            {/*<h1>Olympiad Prep AI Assistant</h1> */}
            {/* For h1, h2, p within appStyles.appHeader or appStyles.contentSection,
                either their styles are inherited, or they need specific classes from App.module.css,
                or App.module.css needs to use :global if we want to keep styling plain tags.
                Let's assume for now that basic tag styling is acceptable or will be handled by applying
                specific classes to these tags as a refinement step if needed.
                For example, if appHeader h1 had specific font, it would be <h1 className={appStyles.appHeaderTitle}> */}
            <h1 className={appStyles.appHeaderTitle}>Olympiad Prep AI Assistant</h1>
          </header>
          
          <section className={appStyles.contentSection} id="ai-tutor-section" aria-labelledby="ai-tutor-heading">
            <h2 className={appStyles.contentSectionTitle} id="ai-tutor-heading">Personalized AI Tutor</h2>
            <PersonalizedAITutor />
          </section>

          <section className={appStyles.contentSection} id="olympiad-events-section" aria-labelledby="olympiad-events-heading">
            <h2 className={appStyles.contentSectionTitle} id="olympiad-events-heading">Upcoming Olympiads</h2>
            <p className={appStyles.contentSectionParagraph}>Discover local and national Olympiad events. Sign up and track your participation. (Event data will be mocked initially).</p>
            <button 
              className={appStyles.actionButton}
              onClick={() => alert('Event Sign-up feature is coming soon!')}
              aria-describedby="olympiad-events-section"
            >
              Browse Events
            </button>
          </section>

          <section className={appStyles.contentSection} id="feedback-section" aria-labelledby="feedback-heading">
            <h2 className={appStyles.contentSectionTitle} id="feedback-heading">My Progress &amp; Feedback</h2>
            <ProgressFeedback />
          </section>
        </div>
      </div>
    </>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Critical: Root element #root not found in HTML. Application cannot start.');
}
// The <style> block has been removed.
