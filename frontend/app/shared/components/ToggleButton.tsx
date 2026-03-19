import React, { useState } from 'react';

const ToggleButton: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);

    const handleToggle = () => {
        setDarkMode(prev => !prev);
        console.log('Changed mode');
    };
    return (
        <button className="toggle-btn" onClick={handleToggle}>
            {darkMode ? (
              <svg
                id="sun-icon"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 6.343l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                ></path>
              </svg>
            ) : (
              <svg
                id="moon-icon"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                ></path>
              </svg>
            )}
        </button>
    );
}

export default ToggleButton;