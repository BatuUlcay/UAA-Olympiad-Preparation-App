
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import Chart from 'chart.js/auto';

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

  useEffect(() => {
    if (process.env.API_KEY) {
      ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set. AI features will be disabled.");
      setFeedbackText("AI Tutor is currently unavailable: API Key not configured.");
    }
  }, []);
  
  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getMousePos(e);
    if (pos) {
      lastPos.current = pos;
    }
  }, [getCanvasContext]);

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

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    if (canvasRef.current) {
      setDrawingDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  }, []);
  
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


  const clearCanvas = () => {
    const ctx = getCanvasContext();
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawingDataUrl(null);
    }
  };

  const handleGetHint = () => {
    if (currentHintIndex < currentProblem.hints.length - 1) {
      const newHintIndex = currentHintIndex + 1;
      setCurrentHintIndex(newHintIndex);
      setHintText(currentProblem.hints[newHintIndex]);
    } else {
      setHintText("No more hints available for this problem.");
    }
  };

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
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
        const rect = canvas.parentElement?.getBoundingClientRect();
        canvas.width = rect ? rect.width : 300; 
        canvas.height = 200; 
    }
  }, []);


  return (
    <div className="ai-tutor-container">
      <h3>{currentProblem.title}</h3>
      <p className="problem-text" role="document" aria-live="polite">{currentProblem.text}</p>
      
      <div className="workspace-container">
        <h4>Your Workspace</h4>
        <div className="solution-input-area">
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
        <div className="drawing-area">
          <label htmlFor="drawing-canvas">Sketch your ideas (optional):</label>
          <canvas
            id="drawing-canvas"
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
          <button onClick={clearCanvas} className="secondary-button" aria-label="Clear drawing canvas">Clear Drawing</button>
        </div>
      </div>

      <div className="controls-area">
        <button 
          onClick={handleGetHint} 
          className="secondary-button"
          aria-controls="hint-display-area"
        >
          Get Hint
        </button>
        <button 
          onClick={handleSubmitSolution} 
          className="action-button" 
          disabled={isLoadingFeedback}
          aria-controls="feedback-display-area"
        >
          {isLoadingFeedback ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>

      {hintText && (
        <div id="hint-display-area" className="hint-area" role="alert">
          <strong>Hint:</strong> {hintText}
        </div>
      )}

      {feedbackText && (
        <div id="feedback-display-area" className="feedback-area" role="alert">
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

const ProgressFeedback: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const accuracyChartRef = useRef<HTMLCanvasElement>(null);
  const topicChartRef = useRef<HTMLCanvasElement>(null);
  const accuracyChartInstance = useRef<Chart | null>(null);
  const topicChartInstance = useRef<Chart | null>(null);
  
  const ai = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set for ProgressFeedback. AI features will be disabled.");
    }
  }, []);

  // Mock data for 10 correctly answered problems
  useEffect(() => {
    const mockData: ProgressEntry[] = problems.slice(0, 10).map(p => ({
      problemId: p.id,
      problemTitle: p.title,
      status: 'correct',
      topic: p.topic || "General", // Fallback topic
    }));
    setProgressData(mockData);
  }, []);

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

  useEffect(() => {
    renderAccuracyChart();
    renderTopicChart();
    
    // Cleanup charts on component unmount
    return () => {
        if (accuracyChartInstance.current) accuracyChartInstance.current.destroy();
        if (topicChartInstance.current) topicChartInstance.current.destroy();
    }
  }, [progressData, renderAccuracyChart, renderTopicChart]);

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
    <div className="progress-feedback-container">
      <h4>Your Performance Overview</h4>
      {progressData.length > 0 ? (
        <>
          <div className="charts-container">
            <div className="chart-wrapper" aria-label="Overall Accuracy Chart">
              <canvas ref={accuracyChartRef} id="accuracyChart"></canvas>
            </div>
            <div className="chart-wrapper" aria-label="Performance by Topic Chart">
              <canvas ref={topicChartRef} id="topicChart"></canvas>
            </div>
          </div>
          <button 
            onClick={handleGetAISummary} 
            className="action-button" 
            disabled={isLoadingSummary}
            aria-controls="ai-summary-display-area"
          >
            {isLoadingSummary ? 'Generating Summary...' : 'Get AI Progress Summary'}
          </button>
          {aiSummary && (
            <div id="ai-summary-display-area" className="ai-summary-area" role="status">
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


const App: React.FC = () => {
  return (
    <>
      <style>{`
        /* Existing styles from your screenshot - I'll keep them concise for brevity */
        .app-wrapper { padding: 20px; display: flex; justify-content: center; }
        .app-container { width: 100%; max-width: 1000px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07); display: flex; flex-direction: column; gap: 25px; padding: 25px; }
        .app-header { background-color: #79cdf0; color: white; padding: 25px; border-radius: 8px; text-align: center; }
        .app-header h1 { margin: 0; font-size: 2.2em; font-weight: 600; }
        .content-section { background-color: #e6f7ff; padding: 20px; border-radius: 8px; border: 1px solid #b3e0f2; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .content-section h2 { margin-top: 0; margin-bottom: 15px; color: #005f73; font-size: 1.6em; }
        .content-section p { color: #334e68; margin-bottom: 15px; font-size: 1.05em; line-height: 1.5; }
        
        .action-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; cursor: pointer; border: none; transition: background-color 0.2s ease-in-out, transform 0.1s ease; }
        .action-button:hover, .action-button:focus-visible { background-color: #0056b3; transform: translateY(-1px); }
        .action-button:active { transform: translateY(0px); }
        .action-button:disabled { background-color: #cccccc; cursor: not-allowed; }

        .ai-tutor-container { display: flex; flex-direction: column; gap: 20px; }
        .ai-tutor-container h3 { color: #004c5d; font-size: 1.4em; margin-bottom: 5px; }
        .problem-text { background-color: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6; margin-bottom: 15px; line-height: 1.6; }
        .workspace-container { border: 1px solid #b3e0f2; border-radius: 8px; padding: 15px; background-color: #f0f8ff; display: flex; flex-direction: column; gap: 15px; }
        .workspace-container h4 { margin-top: 0; margin-bottom: 10px; color: #005f73; }
        .solution-input-area textarea { width: calc(100% - 20px); padding: 10px; border-radius: 6px; border: 1px solid #add8e6; font-family: inherit; font-size: 1em; min-height: 100px; }
        .drawing-area { display: flex; flex-direction: column; gap: 10px; }
        .drawing-area label { font-weight: bold; color: #334e68; }
        #drawing-canvas { border: 1px dashed #79cdf0; border-radius: 6px; cursor: crosshair; touch-action: none; background-color: #ffffff; }
        .controls-area { display: flex; gap: 15px; flex-wrap: wrap; align-items: center; margin-top: 10px; }
        .secondary-button { background-color: #6c757d; color: white; padding: 10px 18px; border-radius: 6px; border:none; cursor:pointer; }
        .secondary-button:hover, .secondary-button:focus-visible { background-color: #5a6268; }
        .hint-area, .feedback-area { margin-top: 15px; padding: 15px; border-radius: 6px; line-height: 1.6; }
        .hint-area { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; }
        .feedback-area { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .feedback-area pre, .ai-summary-area pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 0.95em; }

        /* Progress & Feedback Section Styles */
        .progress-feedback-container { display: flex; flex-direction: column; gap: 20px; }
        .progress-feedback-container h4 { color: #004c5d; font-size: 1.3em; margin-bottom: 10px; }
        .charts-container { display: flex; flex-direction: row; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .chart-wrapper { 
            flex: 1; 
            min-width: 280px; /* Ensure charts are not too small */
            height: 300px; /* Fixed height for consistency */
            background-color: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #dee2e6;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .chart-wrapper canvas { max-height: 100%; }
        .ai-summary-area {
          margin-top: 15px;
          padding: 15px;
          border-radius: 6px;
          line-height: 1.6;
          background-color: #e0e7ff; /* Light purple/blue for AI summary */
          border: 1px solid #c7d2fe;
          color: #3730a3;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .app-wrapper { padding: 10px; }
          .app-container { padding: 20px; gap: 20px; }
          .app-header { padding: 20px; }
          .app-header h1 { font-size: 1.8em; }
          .content-section { padding: 15px; }
          .content-section h2 { font-size: 1.4em; }
          .ai-tutor-container h3 { font-size: 1.2em; }
          .content-section p, .problem-text { font-size: 0.95em; }
          .action-button, .secondary-button { padding: 10px 15px; font-size: 0.95em; width: 100%; /* Stack buttons on mobile */ }
          .controls-area { flex-direction: column; }
          .solution-input-area textarea { font-size: 0.95em; }
          .charts-container { flex-direction: column; } /* Stack charts on mobile */
          .chart-wrapper { height: 250px; /* Adjust height for mobile */ }
        }
      `}</style>
      <div className="app-wrapper">
        <div className="app-container" role="main">
          <header className="app-header" role="banner">
            <h1>Olympiad Prep AI Assistant</h1>
          </header>
          
          <section className="content-section" id="ai-tutor-section" aria-labelledby="ai-tutor-heading">
            <h2 id="ai-tutor-heading">Personalized AI Tutor</h2>
            <PersonalizedAITutor />
          </section>

          <section className="content-section" id="olympiad-events-section" aria-labelledby="olympiad-events-heading">
            <h2 id="olympiad-events-heading">Upcoming Olympiads</h2>
            <p>Discover local and national Olympiad events. Sign up and track your participation. (Event data will be mocked initially).</p>
            <button 
              className="action-button" 
              onClick={() => alert('Event Sign-up feature is coming soon!')}
              aria-describedby="olympiad-events-section"
            >
              Browse Events
            </button>
          </section>

          <section className="content-section" id="feedback-section" aria-labelledby="feedback-heading">
            <h2 id="feedback-heading">My Progress &amp; Feedback</h2>
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
