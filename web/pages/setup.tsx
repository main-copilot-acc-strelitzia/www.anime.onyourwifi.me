'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/video-setup.module.css';

interface SetupStatus {
  configured: boolean;
  sourceCount: number;
  activeSourceCount: number;
  message: string;
}

export default function VideoSetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch('/api/admin/video-sources/status/check');
      const data = await res.json();
      setStatus(data);

      // If configured, redirect to home or player
      if (data.configured) {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (status?.configured) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <div className={styles.icon}>✅</div>
          <h1>Video Sources Configured!</h1>
          <p>
            Your website is ready to stream videos from {status.activeSourceCount} source(s).
          </p>
          <p className={styles.redirectText}>Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.setupCard}>
        <div className={styles.headerSection}>
          <div className={styles.icon}>🎬</div>
          <h1>Video Setup Required</h1>
          <p className={styles.subtitle}>
            Configure your video sources to start streaming
          </p>
        </div>

        <div className={styles.statusBox}>
          <div className={styles.statusItem}>
            <span className={styles.label}>Status:</span>
            <span className={`${styles.value} ${styles.unconfigured}`}>
              ⚠️ Not Configured
            </span>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.label}>Message:</span>
            <span className={styles.message}>{status?.message}</span>
          </div>
        </div>

        <div className={styles.stepsContainer}>
          <h2>Setup Steps</h2>

          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h3>Access Admin Panel</h3>
              <p>
                Log in with your main admin account and navigate to the admin dashboard.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h3>Configure Video Sources</h3>
              <p>
                Go to <strong>Settings → Video Sources</strong> and add your first video directory.
              </p>
              <p className={styles.hint}>
                💡 You can add multiple sources (multiple SSDs, external drives, network storage, etc.)
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h3>Specify Directory Path</h3>
              <p>
                Enter the full path to your video directory:
              </p>
              <ul className={styles.examples}>
                <li>Linux/Mac: <code>/mnt/videos</code> or <code>/home/user/videos</code></li>
                <li>Windows: <code>D:\Videos</code> or <code>E:\External\Anime</code></li>
                <li>NAS/Network: <code>/media/nas/videos</code></li>
              </ul>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h3>Set Priority (Optional)</h3>
              <p>
                If you have multiple sources, lower numbers have higher priority.
              </p>
              <p className={styles.hint}>
                📊 The website will scan sources in priority order to find videos.
              </p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>5</div>
            <div className={styles.stepContent}>
              <h3>Verify & Activate</h3>
              <p>
                The system will automatically detect video files. Ensure the directory is accessible.
              </p>
              <p className={styles.hint}>
                ✅ The website supports: MP4, MKV, AVI, MOV, FLV, WebM, M4V, 3GP, OGV
              </p>
            </div>
          </div>
        </div>

        <div className={styles.adminButtonContainer}>
          <Link href="/admin/video-sources">
            <a className={styles.adminButton}>
              🔧 Go to Admin Panel
            </a>
          </Link>
        </div>

        <div className={styles.infoSection}>
          <h3>📌 Important Notes</h3>
          <ul>
            <li>
              <strong>Multiple Sources:</strong> Add multiple directories to combine videos from different drives or locations
            </li>
            <li>
              <strong>Auto-Detection:</strong> The system will automatically scan directories for video files
            </li>
            <li>
              <strong>Priority System:</strong> Sources are scanned in priority order. Set priorities for optimal performance
            </li>
            <li>
              <strong>Enable/Disable:</strong> You can enable or disable sources without deleting them
            </li>
            <li>
              <strong>File Organization:</strong> Organize videos in subdirectories with consistent naming for better UX
            </li>
          </ul>
        </div>

        <div className={styles.faqSection}>
          <h3>❓ FAQ</h3>
          <div className={styles.faqItem}>
            <strong>Q: Can I add multiple video sources?</strong>
            <p>
              Yes! You can add as many directories as you want from different drives, network locations, or storage devices.
            </p>
          </div>
          <div className={styles.faqItem}>
            <strong>Q: What if videos are on different drives?</strong>
            <p>
              Add each drive as a separate video source. The website will automatically aggregate videos from all active sources.
            </p>
          </div>
          <div className={styles.faqItem}>
            <strong>Q: What video formats are supported?</strong>
            <p>
              MP4, MKV, AVI, MOV, FLV, WebM, M4V, 3GP, and OGV are supported.
            </p>
          </div>
          <div className={styles.faqItem}>
            <strong>Q: How do I change the video source later?</strong>
            <p>
              Go to Admin → Video Sources and add, remove, or modify sources anytime.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.backgroundAnimation}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.particle} />
        ))}
      </div>
    </div>
  );
}
