import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: 'general' | 'anime' | 'support' | 'events' | 'off-topic';
  replies: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

const CATEGORIES = [
  { id: 'general', label: 'General Discussion', icon: '💬' },
  { id: 'anime', label: 'Anime Talk', icon: '🎌' },
  { id: 'support', label: 'Support', icon: '🆘' },
  { id: 'events', label: 'Events', icon: '🎉' },
  { id: 'off-topic', label: 'Off-Topic', icon: '🌀' },
];

export default function CommunityPage() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Fetch posts
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/community/posts?category=${selectedCategory}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setPosts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      addToast({
        type: 'error',
        message: 'Title and content are required',
      });
      return;
    }

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: selectedCategory,
        }),
      });

      if (response.ok) {
        addToast({
          type: 'success',
          message: 'Post created successfully!',
        });
        setNewPostTitle('');
        setNewPostContent('');
        setShowNewPost(false);
        fetchPosts();
      } else {
        addToast({
          type: 'error',
          message: 'Failed to create post',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Error creating post',
      });
    }
  };

  const handlePostClick = (postId: string) => {
    router.push(`/community/post/${postId}`);
  };

  const bgColor =
    currentTheme === 'leblanc'
      ? 'bg-slate-900'
      : currentTheme === 'luffy'
        ? 'bg-red-950'
        : 'bg-gray-100';

  const textColor =
    currentTheme === 'leblanc'
      ? 'text-slate-100'
      : currentTheme === 'luffy'
        ? 'text-red-50'
        : 'text-gray-900';

  const accentColor =
    currentTheme === 'leblanc'
      ? 'bg-purple-600 hover:bg-purple-700'
      : currentTheme === 'luffy'
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-blue-600 hover:bg-blue-700';

  return (
    <>
      <Navbar />
      <main className={`${bgColor} ${textColor} min-h-screen py-8 px-4`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Community Forum</h1>
            <p className="text-lg opacity-75">
              Join our community and discuss anime, updates, and more!
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? accentColor
                      : currentTheme === 'leblanc'
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : currentTheme === 'luffy'
                          ? 'bg-red-800 hover:bg-red-700'
                          : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {isLoggedIn && (
              <button
                onClick={() => setShowNewPost(!showNewPost)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${accentColor} ${textColor}`}
              >
                {showNewPost ? '✕ Cancel' : '+ New Post'}
              </button>
            )}
          </div>

          {/* New Post Form */}
          {showNewPost && isLoggedIn && (
            <div className={`mb-8 p-6 rounded-lg ${currentTheme === 'leblanc' ? 'bg-slate-800' : currentTheme === 'luffy' ? 'bg-red-900' : 'bg-white'}`}>
              <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="What's on your mind?"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      currentTheme === 'leblanc'
                        ? 'bg-slate-700 border-slate-600'
                        : currentTheme === 'luffy'
                          ? 'bg-red-800 border-red-700'
                          : 'bg-gray-100 border-gray-300'
                    } ${textColor} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Message</label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      currentTheme === 'leblanc'
                        ? 'bg-slate-700 border-slate-600'
                        : currentTheme === 'luffy'
                          ? 'bg-red-800 border-red-700'
                          : 'bg-gray-100 border-gray-300'
                    } ${textColor} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full ${accentColor} ${textColor} py-2 rounded-lg font-semibold transition-all`}
                >
                  Post to Community
                </button>
              </form>
            </div>
          )}

          {!isLoggedIn && showNewPost && (
            <Alert type="info" message="Please log in to create a post" />
          )}

          {/* Posts List */}
          {loading ? (
            <LoadingSpinner />
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className={`p-6 rounded-lg cursor-pointer transition-all transform hover:scale-102 ${
                    post.pinned
                      ? currentTheme === 'leblanc'
                        ? 'bg-purple-900 border-2 border-purple-500'
                        : currentTheme === 'luffy'
                          ? 'bg-red-900 border-2 border-red-500'
                          : 'bg-blue-100 border-2 border-blue-500'
                      : currentTheme === 'leblanc'
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : currentTheme === 'luffy'
                          ? 'bg-red-900 hover:bg-red-800'
                          : 'bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      {post.pinned && <span className="text-yellow-400 text-sm">📌 Pinned</span>}
                      <h3 className="text-xl font-bold">{post.title}</h3>
                      <p className="text-sm opacity-75">
                        by <span className="font-semibold">{post.author}</span> •{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="mb-4 opacity-90 line-clamp-2">{post.content}</p>

                  <div className="flex justify-between text-sm opacity-75">
                    <span>👁️ {post.views} views</span>
                    <span>💬 {post.replies} replies</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${currentTheme === 'leblanc' ? 'bg-slate-800' : currentTheme === 'luffy' ? 'bg-red-900' : 'bg-white'} rounded-lg`}>
              <p className="text-lg opacity-75">No posts yet in this category.</p>
              {isLoggedIn && (
                <p className="text-sm opacity-50 mt-2">Be the first to start the conversation!</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
