export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface Episode {
  id: string;
  title: string;
  description?: string;
  episodeNumber: number;
  seriesTitle: string;
  thumbnail?: string;
  duration?: number;
  uploadedAt?: string;
  transcoded?: boolean;
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [videos, setVideos] = useState<Episode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch user info to get role
    const fetchUserAndVideos = async () => {
      try {
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserRole(userData.data?.role || null);
        }

        // Fetch available videos/episodes
        const videosResponse = await fetch('/api/videos', {
          credentials: 'include',
        });

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setVideos(videosData.data || []);
        } else {
          setError('Failed to load videos');
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndVideos();
  }, [router]);

  // Organize videos by series
  const organizedVideos = useMemo(() => {
    const organized: Record<string, Episode[]> = {};
    
    videos.forEach((video) => {
      if (!organized[video.seriesTitle]) {
        organized[video.seriesTitle] = [];
      }
      organized[video.seriesTitle].push(video);
    });

    // Sort videos within each series
    Object.keys(organized).forEach((series) => {
      organized[series].sort((a, b) => a.episodeNumber - b.episodeNumber);
    });

    return organized;
  }, [videos]);

  // Get featured video (most recent transcoded or first)
  const featuredVideo = useMemo(() => {
    const transcodedVideos = videos.filter((v) => v.transcoded !== false);
    return transcodedVideos.length > 0 ? transcodedVideos[0] : videos[0];
  }, [videos]);

  // Get recent videos
  const recentVideos = useMemo(() => {
    return videos.slice(0, 12).sort((a, b) => {
      const aDate = new Date(a.uploadedAt || 0).getTime();
      const bDate = new Date(b.uploadedAt || 0).getTime();
      return bDate - aDate;
    });
  }, [videos]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#141414',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
      <Navbar userRole={userRole} />
      
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Hero Banner */}
      {featuredVideo && <HeroBanner featured={featuredVideo} />}

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px' }}>
        {videos.length > 0 ? (
          <>
            {/* New & Popular Section */}
            {recentVideos.length > 0 && (
              <ContentRow title="New & Popular" items={recentVideos} />
            )}

            {/* Series Sections */}
            {Object.entries(organizedVideos).map(([seriesTitle, seriesVideos]) => (
              <ContentRow
                key={seriesTitle}
                title={seriesTitle}
                items={seriesVideos.slice(0, 15)}
              />
            ))}
          </>
        ) : (
          <div
            style={{
              backgroundColor: '#221f1f',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              marginTop: '40px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📹</div>
            <h2
              style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '12px',
              }}
            >
              No Videos Yet
            </h2>
            <p
              style={{
                color: '#b3b3b3',
                fontSize: '16px',
              }}
            >
              No videos yet. Ask the admin to upload more.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
