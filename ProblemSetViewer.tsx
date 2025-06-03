// In ProblemSetViewer.tsx
import React, { useState, useEffect } from 'react';
import styles from './ProblemSetViewer.module.css'; // To be created later

// Assuming Problem interface is available or re-defined/imported
// For now, let's re-define it for clarity if not using a shared types file.
// Ideally, this would come from a shared types.ts
interface Problem {
  id: number;
  title: string;
  text: string;
  answer: string;
  solution: string;
  hints: string[];
  topic: string;
  competition?: string;
  day?: string;
  sourceUrl?: string;
}

interface ProblemSetViewerProps {
  problems: Problem[];
  onSelectProblem: (problemId: number) => void; // Callback to App to handle problem selection
}

const ProblemSetViewer: React.FC<ProblemSetViewerProps> = ({ problems, onSelectProblem }) => {
  // State for filter criteria (examples, more can be added)
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterCompetition, setFilterCompetition] = useState<string>('');

  // State for the list of problems to display after filtering
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>(problems);

  const topics = React.useMemo(() => {
    const allTopics = problems.map(p => p.topic);
    return ['All Topics', ...new Set(allTopics)].filter(Boolean);
  }, [problems]);

  const competitions = React.useMemo(() => {
    const allCompetitions = problems.map(p => p.competition).filter(Boolean);
    return ['All Competitions', ...new Set(allCompetitions)];
  }, [problems]);

  useEffect(() => {
    let filtered = problems;
    if (filterTopic && filterTopic !== 'All Topics') {
        filtered = filtered.filter(p => p.topic === filterTopic);
    }
    if (filterCompetition && filterCompetition !== 'All Competitions') {
        filtered = filtered.filter(p => p.competition === filterCompetition);
    }
    setDisplayedProblems(filtered);
  }, [problems, filterTopic, filterCompetition]);

  // Placeholder render
  return (
    <div className={styles.viewerContainer}>
      <h2>Problem Sets</h2>
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label htmlFor="topic-filter" className={styles.filterLabel}>Filter by Topic:</label>
          <select
            id="topic-filter"
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className={styles.filterSelect}
          >
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="competition-filter" className={styles.filterLabel}>Filter by Competition:</label>
          <select
            id="competition-filter"
            value={filterCompetition}
            onChange={(e) => setFilterCompetition(e.target.value)}
            className={styles.filterSelect}
          >
            {competitions.map(comp => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.problemList}>
        {displayedProblems.length > 0 ? (
          displayedProblems.map(problem => (
            <div
              key={problem.id}
              onClick={() => onSelectProblem(problem.id)}
              className={styles.problemItem}
              role="button" // Accessibility: indicate it's clickable
              tabIndex={0}  // Accessibility: make it focusable
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectProblem(problem.id); }} // Accessibility
            >
              <h4 className={styles.problemTitle}>{problem.title}</h4>
              <div className={styles.problemMeta}>
                <span className={styles.metaItem}>
                  <strong>Competition:</strong> {problem.competition || 'General'}
                </span>
                {problem.day && (
                  <span className={styles.metaItem}>
                    <strong>Day:</strong> {problem.day}
                  </span>
                )}
                <span className={styles.metaItem}>
                  <strong>Topic:</strong> {problem.topic}
                </span>
              </div>
              {/* Optionally, a short snippet of problem.text could be shown here if desired */}
              {/* <p className={styles.problemSnippet}>{problem.text.substring(0, 100)}...</p> */}
            </div>
          ))
        ) : (
          <p>No problems match your current filters.</p>
        )}
      </div>
    </div>
  );
};

export default ProblemSetViewer;
