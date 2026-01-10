import { useState, useEffect } from 'react';
import styles from '@/styles/admin/video-sources.module.css';

interface VideoSource {
  id: string;
  name: string;
  path: string;
  type: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export default function VideoSourcesAdmin() {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [testingPath, setTestingPath] = useState('');
  const [testResult, setTestResult] = useState<{
    accessible: boolean;
    videoCount?: number;
    error?: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    type: 'local' as 'local' | 'network',
    priority: 0,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/video-sources');
      const data = await res.json();
      
      setSources(data.sources || []);
      setConfigured(data.hasConfiguredSources);
    } catch (error) {
      console.error('Error fetching sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDirectory = async () => {
    if (!testingPath) return;

    try {
      const res = await fetch('/api/admin/video-sources/test-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: testingPath }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        accessible: false,
        error: 'Failed to test directory',
      });
    }
  };

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.path) {
      alert('Name and path are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/video-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert('Video source added successfully!');
        setFormData({ name: '', path: '', type: 'local', priority: 0 });
        setShowForm(false);
        setTestingPath('');
        setTestResult(null);
        fetchSources();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Failed to add source');
      console.error(error);
    }
  };

  const deleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video source?')) return;

    try {
      const res = await fetch(`/api/admin/video-sources/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert('Video source deleted successfully!');
        fetchSources();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Failed to delete source');
      console.error(error);
    }
  };

  const toggleSource = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/video-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await res.json();

      if (data.success) {
        fetchSources();
      }
    } catch (error) {
      console.error('Error toggling source:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📁 Video Sources Configuration</h1>
        <p>Configure which directories the website reads videos from</p>
      </div>

      {!configured && (
        <div className={styles.noSourcesAlert}>
          <div className={styles.alertIcon}>⚠️</div>
          <div className={styles.alertContent}>
            <h3>No Video Sources Configured</h3>
            <p>
              The website is not currently reading videos from any directory.
              Please add at least one video source below to enable video streaming.
            </p>
          </div>
        </div>
      )}

      {configured && (
        <div className={styles.configuredAlert}>
          <div className={styles.alertIcon}>✅</div>
          <div className={styles.alertContent}>
            <h3>Video Sources Active</h3>
            <p>{sources.filter(s => s.isActive).length} active source(s) configured</p>
          </div>
        </div>
      )}

      <div className={styles.sourcesList}>
        <div className={styles.listHeader}>
          <h2>Configured Sources ({sources.length})</h2>
          <button
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Cancel' : '+ Add New Source'}
          </button>
        </div>

        {showForm && (
          <div className={styles.formContainer}>
            <h3>Add Video Source</h3>
            <form onSubmit={addSource} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Source Name *</label>
                <input
                  type="text"
                  placeholder="e.g., SSD Drive 1, External HDD, Network Storage"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Directory Path *</label>
                <div className={styles.pathInput}>
                  <input
                    type="text"
                    placeholder="e.g., /mnt/videos, D:\Videos, /media/external/anime"
                    value={formData.path}
                    onChange={(e) =>
                      setFormData({ ...formData, path: e.target.value })
                    }
                    required
                  />
                </div>
                <p className={styles.helpText}>
                  Enter the full path to the directory containing your video files
                </p>
              </div>

              <div className={styles.testSection}>
                <h4>Test Directory Access</h4>
                <div className={styles.testInput}>
                  <input
                    type="text"
                    placeholder="Paste path here to test"
                    value={testingPath}
                    onChange={(e) => setTestingPath(e.target.value)}
                  />
                  <button type="button" onClick={testDirectory}>
                    Test
                  </button>
                </div>
                {testResult && (
                  <div
                    className={`${styles.testResult} ${
                      testResult.accessible
                        ? styles.testSuccess
                        : styles.testError
                    }`}
                  >
                    {testResult.accessible ? (
                      <>
                        <span>✅ Directory accessible</span>
                        <span>Videos found: {testResult.videoCount}</span>
                      </>
                    ) : (
                      <>
                        <span>❌ Error: {testResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'local' | 'network',
                      })
                    }
                  >
                    <option value="local">Local Drive</option>
                    <option value="network">Network/NAS</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    title="Lower number = higher priority. Sources are scanned in priority order."
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitButton}>
                ➕ Add Source
              </button>
            </form>
          </div>
        )}

        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎬</div>
            <p>No video sources configured yet</p>
            <p className={styles.emptySubtext}>
              Add your first video source to enable video streaming
            </p>
          </div>
        ) : (
          <div className={styles.sourcesGrid}>
            {sources.map((source) => (
              <div
                key={source.id}
                className={`${styles.sourceCard} ${
                  !source.isActive ? styles.inactive : ''
                }`}
              >
                <div className={styles.sourceHeader}>
                  <h4>{source.name}</h4>
                  <span
                    className={`${styles.badge} ${
                      source.isActive ? styles.activeBadge : styles.inactiveBadge
                    }`}
                  >
                    {source.isActive ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>

                <div className={styles.sourceInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Path:</span>
                    <code className={styles.value}>{source.path}</code>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.label}>Type:</span>
                    <span className={styles.value}>
                      {source.type === 'local' ? '💾 Local Drive' : '🌐 Network'}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.label}>Priority:</span>
                    <span className={styles.value}>{source.priority}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.label}>Added:</span>
                    <span className={styles.value}>
                      {new Date(source.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${styles.toggleBtn}`}
                    onClick={() => toggleSource(source.id, source.isActive)}
                    title={source.isActive ? 'Disable' : 'Enable'}
                  >
                    {source.isActive ? '🔴 Disable' : '🟢 Enable'}
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => deleteSource(source.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.infoBox}>
        <h3>💡 How It Works</h3>
        <ul>
          <li>
            <strong>Add Sources:</strong> Configure directories where your videos are stored
          </li>
          <li>
            <strong>Multiple Drives:</strong> Support multiple SSDs, HDDs, or network storage
          </li>
          <li>
            <strong>Priority:</strong> Sources are scanned in priority order (lower number = higher priority)
          </li>
          <li>
            <strong>Active/Inactive:</strong> Toggle sources on/off without deleting them
          </li>
          <li>
            <strong>Supported Formats:</strong> MP4, MKV, AVI, MOV, FLV, WebM, M4V, 3GP, OGV
          </li>
        </ul>
      </div>
    </div>
  );
}
