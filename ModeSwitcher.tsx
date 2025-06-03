// In ModeSwitcher.tsx
import React from 'react';
import styles from './ModeSwitcher.module.css'; // Create this CSS module later

type AppMode = 'math' | 'cs' | 'physics' | 'bio' | 'chem';

interface ModeSwitcherProps {
  currentMode: AppMode;
  setCurrentMode: (mode: AppMode) => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ currentMode, setCurrentMode }) => {
  const modes: { value: AppMode; label: string }[] = [
    { value: 'math', label: 'Math Mode' },
    { value: 'cs', label: 'Computer Science Mode' },
    { value: 'physics', label: 'Physics Mode' },
    { value: 'bio', label: 'Biology Mode' },
    { value: 'chem', label: 'Chemistry Mode' },
  ];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMode(event.target.value as AppMode);
  };

  return (
    <div className={styles.modeSwitcherContainer}>
      <label htmlFor="mode-select" className={styles.modeLabel}>Select Mode:</label>
      <select
        id="mode-select"
        value={currentMode}
        onChange={handleChange}
        className={styles.modeSelect}
      >
        {modes.map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModeSwitcher;
