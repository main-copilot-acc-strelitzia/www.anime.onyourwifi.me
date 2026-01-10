import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/security-challenge.module.css';

interface Challenge {
  questionId: number;
  question: string;
}

export default function SecurityChallengePage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string>('');

  // Generate session ID on mount
  useEffect(() => {
    const sessionId =
      'session_' +
      Math.random().toString(36).substring(2, 15) +
      '_' +
      Date.now();
    sessionIdRef.current = sessionId;
    localStorage.setItem('sessionId', sessionId);

    // Load challenge
    loadChallenge();

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  // Prevent page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Log refresh attempt
      const newAttempts = refreshAttempts + 1;
      setRefreshAttempts(newAttempts);

      if (challenge) {
        // Report refresh to backend
        detectRefresh(challenge.questionId);
      }

      // Block refresh with warning
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [challenge, refreshAttempts]);

  // Prevent back button and direct URL access
  useEffect(() => {
    const handlePopState = () => {
      // Block back navigation
      window.history.forward();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const loadChallenge = async () => {
    try {
      const sessionId = sessionIdRef.current;
      const response = await fetch('/api/security/challenge/new', {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setError('Failed to load challenge');
        return;
      }

      const data = await response.json();
      setChallenge(data.data);
      setTimeRemaining(10);
      setError('');
      startTimer();
    } catch (err) {
      setError('Connection error. Please refresh.');
      console.error(err);
    }
  };

  const startTimer = () => {
    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    let remaining = 10;
    setTimeRemaining(remaining);

    timerRef.current = setInterval(() => {
      remaining--;
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        handleTimeExpired();
      }
    }, 1000);
  };

  const handleTimeExpired = async () => {
    setIsSubmitting(true);
    setIsLocked(true);
    setError('');
    setCooldownRemaining(60);

    // Start cooldown timer
    let cooldown = 60;
    cooldownRef.current = setInterval(() => {
      cooldown--;
      setCooldownRemaining(cooldown);

      if (cooldown <= 0) {
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        setIsLocked(false);
        setCooldownRemaining(0);
        setAnswer('');
        setIsSubmitting(false);
        loadChallenge();
      }
    }, 1000);
  };

  const handleWrongAnswer = async (cooldown: number, attempts: number) => {
    setIsSubmitting(true);
    setIsLocked(true);
    setError('');
    setCooldownRemaining(cooldown);

    // Start cooldown timer
    let remaining = cooldown;
    cooldownRef.current = setInterval(() => {
      remaining--;
      setCooldownRemaining(remaining);

      if (remaining <= 0) {
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        setIsLocked(false);
        setCooldownRemaining(0);
        setAnswer('');
        setIsSubmitting(false);
        loadChallenge(); // Load new challenge
      }
    }, 1000);
  };

  const detectRefresh = async (questionId: number) => {
    try {
      const sessionId = sessionIdRef.current;
      await fetch('/api/security/challenge/refresh-detect', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });
    } catch (err) {
      console.error('Failed to report refresh:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!challenge || !answer.trim()) {
      setError('Please enter an answer');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionId = sessionIdRef.current;
      const response = await fetch('/api/security/challenge/verify', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: challenge.questionId,
          answer: answer.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Answer correct - redirect to main site
        if (timerRef.current) clearTimeout(timerRef.current);
        setError('');
        // Redirect after brief delay
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        // Wrong answer or locked
        if (response.status === 429) {
          // Rate limited/locked
          setCooldownRemaining(data.cooldownRemaining || 60);
          setIsLocked(true);
          setError(data.message);
        } else {
          // Wrong answer
          const cooldown = data.data?.nextCooldown || 60;
          const attempts = data.data?.attempts || 1;
          handleWrongAnswer(cooldown / 1000, attempts);
          setError(data.message);
        }
      }
    } catch (err) {
      setError('Failed to verify answer. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.spinner}></div>
          <p>Loading security challenge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        {/* Animated background */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle}></div>
        ))}
      </div>

      {isLocked && cooldownRemaining > 0 ? (
        // Lockout screen
        <div className={styles.card}>
          <div className={styles.lockoutContainer}>
            <div className={styles.lockoutIcon}>🔒</div>
            <h2 className={styles.lockoutTitle}>You are temporarily locked out</h2>
            <p className={styles.lockoutMessage}>
              {refreshAttempts > 0 && cooldownRemaining > 30
                ? "We detected bot-like behavior. Take a breather and think about life for a moment."
                : 'Wrong answer! Chill by the corner as you think about life.'}
            </p>
            <div className={styles.cooldownTimer}>
              <div className={styles.timerDisplay}>{cooldownRemaining}</div>
              <p className={styles.timerLabel}>seconds remaining</p>
            </div>
            {refreshAttempts > 0 && (
              <p className={styles.botWarning}>
                ⚠️ Stop refreshing! You're acting like a bot. Wait for the cooldown to expire.
              </p>
            )}
          </div>
        </div>
      ) : (
        // Challenge screen
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Strelitzia Security Challenge</h1>
            <p className={styles.subtitle}>Answer this question to access the site</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Question */}
            <div className={styles.questionContainer}>
              <p className={styles.question}>{challenge.question}</p>
            </div>

            {/* Timer */}
            <div
              className={`${styles.timerBox} ${
                timeRemaining <= 3 ? styles.timerWarning : ''
              }`}
            >
              <span className={styles.timerLabel}>Time remaining:</span>
              <span className={styles.timerValue}>{timeRemaining}s</span>
            </div>

            {/* Error message */}
            {error && <div className={styles.error}>{error}</div>}

            {/* Answer input */}
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className={styles.input}
              disabled={isSubmitting || isLocked}
              autoFocus
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || isLocked || !answer.trim()}
              className={styles.button}
            >
              {isSubmitting ? 'Verifying...' : 'Submit Answer'}
            </button>
          </form>

          {/* Anti-refresh warning */}
          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              ⚠️ Do not refresh this page or try to navigate away. You will be flagged as a bot.
            </p>
          </div>

          {/* Footer info */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              This is a mandatory security check for all users. Main administrators bypass this.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
