import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import Alert from '@/components/Alert';
import LoadingSpinner from '@/components/LoadingSpinner';

// Import HLS.js from local file (no CDN)
import Hls from 'hls.js';

interface EpisodeDetails {
  id: string;
  title: string;
  description?: string;
  episodeNumber: number;
  seriesTitle: string;
  duration?: number;
  resolutions?: string[]; // e.g., ['360p', '720p', '1080p']
}

export default function Player() {
  const { currentTheme } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [episodeDetails, setEpisodeDetails] = useState<EpisodeDetails | null>(null);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<string>('auto');

  // Load HLS.js dynamically (fallback if ES6 module import fails)
  useEffect(() => {
    if (!window.Hls && typeof Hls === 'undefined') {
      // Try to load from public folder
      const script = document.createElement('script');
      script.src = '/js/hls.min.js';
      script.onload = () => {
        console.log('HLS.js loaded from /public/js/hls.min.js');
      };
      script.onerror = () => {
        setError('Failed to load HLS.js library');
      };
      document.head.appendChild(script);
    }
  }, []);

  // Fetch episode details and stream URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('episodeId');
    setEpisodeId(id);

    if (!id) {
      setError('No episode ID provided');
      setLoading(false);
      return;
    }

    const fetchEpisodeData = async () => {
      try {
        // Fetch episode details
        const detailsResponse = await fetch(`/api/videos/${id}`, {
          credentials: 'include',
        });

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          setEpisodeDetails(detailsData.data);
        }

        // Fetch stream URL
        const streamResponse = await fetch(`/api/videos/${id}/stream`, {
          credentials: 'include',
        });

        if (streamResponse.ok) {
          const streamData = await streamResponse.json();
          // The stream endpoint returns the .m3u8 playlist URL
          setStreamUrl(streamData.url || `/api/videos/${id}/stream`);
        } else if (streamResponse.status === 404) {
          setError('Video not found or not yet transcoded');
        } else {
          setError('Failed to load video stream');
        }
      } catch (err) {
        console.error('Error fetching episode data:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodeData();

    return () => {
      // Cleanup HLS instance on unmount
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Setup HLS.js streaming
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const setupHLS = () => {
      try {
        // Check if HLS is supported
        if (Hls.isSupported() && streamUrl.includes('.m3u8')) {
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            autoStartLoad: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000, // 60 MB
            maxBufferHole: 0.5,
            highWaterMarkThreshold: 0,
            highWaterMarkMovingAverageThreshold: 0.5,
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.5,
            abrMaxWithRealBitrate: true,
            maxStarvationDelay: 4,
            maxLoadingDelay: 4,
            minAutoBitrate: 0,
            startLevel: 0,
            testBandwidth: true,
            initialLiveManifestSize: 1,
            levelLoadingTimeOut: 10000,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 4,
            fragLoadingMaxRetry: 6,
            fragLoadingMaxRetryTimeout: 64000,
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hlsRef.current = hls;

          // Handle HLS events
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest loaded');
            // Auto-play if user allowed it
            video.play().catch(() => {
              // Autoplay was prevented, user must click play
              console.log('Autoplay prevented');
            });
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError('Network error: Failed to load video');
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError('Media error: Video cannot be played');
                  break;
                default:
                  setError('Error loading video stream');
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari, iOS)
          video.src = streamUrl;
        } else {
          setError('Your browser does not support HLS video streaming');
        }
      } catch (err) {
        console.error('HLS setup error:', err);
        setError('Failed to setup video player');
      }
    };

    setupHLS();

    // Send watch position every 10 seconds
    let timer: any;
    const sendPos = async () => {
      if (!episodeId) return;
      const pos = Math.floor(video.currentTime);
      try {
        await fetch('/api/watch/position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId,
            lastPositionSec: pos,
          }),
          credentials: 'include',
        });
      } catch (err) {
        // Silently fail - don't interrupt playback
        console.log('Failed to save watch position');
      }
    };

    const onTime = () => {
      clearTimeout(timer);
      timer = setTimeout(sendPos, 10000);
    };

    video.addEventListener('timeupdate', onTime);

    return () => {
      video.removeEventListener('timeupdate', onTime);
      clearTimeout(timer);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, episodeId]);

  return (
    <div style={{ backgroundColor: currentTheme.colors.background, minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <LoadingSpinner />
          </div>
        ) : streamUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                controls
                playsInline
                width="100%"
                className="w-full"
                style={{ backgroundColor: '#000' }}
              />
            </div>

            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: currentTheme.colors.sidebar }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: currentTheme.colors.primary }}
              >
                {episodeDetails?.seriesTitle || 'Video'} - Episode {episodeDetails?.episodeNumber || episodeId}
              </h2>
              <p style={{ color: currentTheme.colors.text }} className="mt-2">
                {episodeDetails?.title || 'No title available'}
              </p>
              {episodeDetails?.description && (
                <p style={{ color: currentTheme.colors.text }} className="mt-2 opacity-75">
                  {episodeDetails.description}
                </p>
              )}
              <div style={{ color: currentTheme.colors.text }} className="mt-4 text-sm opacity-75">
                {episodeDetails?.duration && (
                  <p>Duration: {Math.floor(episodeDetails.duration / 60)} minutes</p>
                )}
                <p>Your watch position is automatically saved</p>
              </div>
            </div>
          </div>
        ) : (
          <Alert type="error" message="Unable to load video stream" />
        )}
      </div>
    </div>
  );
}