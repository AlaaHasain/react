import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getUserPosts, createPost, likePost, unlikePost, deletePost } from '../../api/posts';
import CommentSection from '../../components/CommentSection';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState([]);  // Ensure posts is initialized as an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCommentId, setExpandedCommentId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    postsCount: 0,
    likesCount: 0
  });
  const navigate = useNavigate();
  
  // Get actual user data from user.user object
  const userData = user?.user || {};
  const token = user?.token || '';

  // Fetch user's posts on component mount
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        const response = await getUserPosts(userData.id, token);
        
        // Extract posts from the response - the API returns { posts: [...] } 
        const postsArray = Array.isArray(response.posts) ? response.posts : 
                        (Array.isArray(response) ? response : []);
        
        setPosts(postsArray);
        
        // Calculate stats
        const totalLikes = postsArray.reduce((sum, post) => sum + (post.likes_count || 0), 0);
        setStats({
          postsCount: postsArray.length,
          likesCount: totalLikes
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userData.id) {
      fetchUserPosts();
    }
  }, [userData.id, token]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle post submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      const response = await createPost(postContent, token);
      
      // Ensure posts is an array before adding the new post
      const currentPosts = Array.isArray(posts) ? posts : [];
      setPosts([response, ...currentPosts]);
      setPostContent('');
      
      // Update stats
      setStats({
        ...stats,
        postsCount: stats.postsCount + 1
      });
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle like/unlike post
  const handleLikePost = async (postId, isLiked) => {
    try {
      // Ensure posts is an array before mapping
      const currentPosts = Array.isArray(posts) ? posts : [];
      
      // Optimistically update UI first
      setPosts(currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
            is_liked: !isLiked
          };
        }
        return post;
      }));
      
      // Then make API call
      if (isLiked) {
        try {
          await unlikePost(postId, token);
        } catch (err) {
          console.log('Unlike operation error handled gracefully:', err.message);
        }
      } else {
        await likePost(postId, token);
      }
      
      // Update stats - ensure posts is an array
      const safePostsArray = Array.isArray(posts) ? posts : [];
      const updatedPosts = safePostsArray.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      });
      
      const totalLikes = updatedPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      setStats({
        ...stats,
        likesCount: totalLikes
      });
    } catch (err) {
      if (!isLiked) {
        console.error('Error liking post:', err);
        
        // Revert the optimistic update - ensure posts is an array
        const safePostsArray = Array.isArray(posts) ? posts : [];
        setPosts(safePostsArray.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: isLiked ? post.likes_count : post.likes_count - 1,
              is_liked: isLiked
            };
          }
          return post;
        }));
      }
    }
  };

  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedCommentId(expandedCommentId === postId ? null : postId);
  };
  
  // Handle comment count update
  const handleCommentAdded = (postId, commentCount) => {
    // Ensure posts is an array before mapping
    const safePostsArray = Array.isArray(posts) ? posts : [];
    setPosts(safePostsArray.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: commentCount
        };
      }
      return post;
    }));
  };

  // Show delete confirmation
  const confirmDeletePost = (postId) => {
    setShowDeleteConfirm(postId);
  };

  // Cancel delete
  const cancelDeletePost = () => {
    setShowDeleteConfirm(null);
  };

  // Delete a post after confirmation
  const handleDeletePost = async (postId) => {
    try {
      setDeletingPostId(postId);
      await deletePost(postId, token);
      
      // Ensure posts is an array before filtering
      const safePostsArray = Array.isArray(posts) ? posts : [];
      const updatedPosts = safePostsArray.filter(post => post.id !== postId);
      setPosts(updatedPosts);
      
      // Update stats
      setStats({
        ...stats,
        postsCount: stats.postsCount - 1,
        likesCount: updatedPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
      });
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeletingPostId(null);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="home-layout">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <div className="sidebar-header">
          <div className="app-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2C6.486,2,2,6.486,2,12s4.486,10,10,10s10-4.486,10-10S17.514,2,12,2z" />
              <path fill="#fff" d="M13 7L11 7 11 11 7 11 7 13 11 13 11 17 13 17 13 13 17 13 17 11 13 11z" />
            </svg>
            <span>NexusSphere</span>
          </div>
        </div>
        
        <div className="sidebar-content">
          <nav className="main-nav">
            <Link to="/home" className="nav-item">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
              <span className="nav-text">Home</span>
            </Link>
            <Link to="/explore" className="nav-item">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <span className="nav-text">Explore</span>
            </Link>
            <Link to="/profile" className="nav-item active">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="nav-text">Profile</span>
            </Link>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            {userData?.image_url ? (
              <img src={userData.image_url} alt={`${userData?.name || "User"}'s avatar`} className="user-avatar" />
            ) : (
              <div className="user-avatar" aria-hidden="true">
                <span>{userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
            )}
            <div className="user-info">
              <div className="user-name">{userData?.name || "User"}</div>
              <div className="user-handle">@{userData?.username || (userData?.name || "user").toLowerCase().replace(/\s+/g, '')}</div>
            </div>
          </div>
          
          <button className="logout-button" onClick={handleLogout} aria-label="Log out">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              {userData?.image_url ? (
                <img src={userData.image_url} alt={`${userData?.name || "User"}'s profile`} />
              ) : (
                <div className="avatar-placeholder">
                  <span>{userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{userData?.name || "User"}</h1>
              <p className="profile-handle">@{userData?.username || (userData?.name || "user").toLowerCase().replace(/\s+/g, '')}</p>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-value">{stats.postsCount}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{stats.likesCount}</span>
                  <span className="stat-label">Likes</span>
                </div>
              </div>
              <div className="profile-actions">
                <Link to="/profile/edit" className="profile-button">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="post-composer">
          {userData?.image_url ? (
            <img src={userData.image_url} alt={`${userData?.name || "User"}'s avatar`} className="post-composer-avatar" />
          ) : (
            <div className="post-composer-avatar" aria-hidden="true">
              <span>{userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
            </div>
          )}
          <div className="post-composer-input">
            <form onSubmit={handlePostSubmit}>
              <textarea
                placeholder="Share your thoughts..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                aria-label="Post content"
              ></textarea>
              <div className="post-composer-actions">
                <div className="post-composer-tools">
                  {/* Image icon button removed */}
                </div>
                <button 
                  type="submit" 
                  className="post-button" 
                  disabled={!postContent.trim()}
                  aria-label="Share post"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="post-feed">
          {error && <div className="error-message" role="alert">{error}</div>}
          
          {loading ? (
            <div className="posts-loading-container">
              <div className="dot-loader">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <p>Loading posts...</p>
            </div>
          ) : !Array.isArray(posts) ? (
            <div className="error-message">Error loading posts. Please try again.</div>
          ) : posts.length === 0 ? (
            <div className="no-posts-message">No posts yet! Create your first post.</div>
          ) : (
            posts.map(post => {
              // Get current user info for posts that lack user data
              const postUser = post.user || {
                id: userData.id,
                name: userData.name,
                image_url: userData.image_url
              };
              
              const isExpanded = expandedCommentId === post.id;
              const canDeletePost = true; // User can always delete their own posts on their profile
              
              return (
                <div className="post" key={post.id}>
                  {postUser?.image_url ? (
                    <img 
                      src={postUser.image_url} 
                      alt={`${postUser?.name || "User"}'s avatar`} 
                      className="post-avatar" 
                    />
                  ) : (
                    <div className="post-avatar">
                      <span>{postUser?.name ? postUser.name.charAt(0).toUpperCase() : 'U'}</span>
                    </div>
                  )}
                  <div className="post-content">
                    <div className="post-header">
                      <div className="post-user-info">
                        <span className="post-author">{postUser?.name || "User"}</span>
                        <span className="post-handle">@{postUser?.username || (postUser?.name || "user").toLowerCase().replace(/\s+/g, '')}</span>
                        <span className="post-time">· {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {canDeletePost && (
                        <button 
                          className="delete-post-btn"
                          onClick={() => confirmDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          aria-label="Delete post"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="post-body">{post.body}</div>
                    
                    {/* Delete confirmation popup */}
                    {showDeleteConfirm === post.id && (
                      <div className="delete-confirm-popup">
                        <p>Delete this post?</p>
                        <div className="delete-confirm-actions">
                          <button 
                            className="delete-confirm-btn delete-yes" 
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPostId === post.id}
                          >
                            {deletingPostId === post.id ? 'Deleting...' : 'Yes, delete'}
                          </button>
                          <button 
                            className="delete-confirm-btn delete-no" 
                            onClick={cancelDeletePost}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="post-actions">
                      <button
                        className={`post-action comment-action ${isExpanded ? 'active' : ''}`}
                        onClick={() => toggleComments(post.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} comments (${post.comments_count || 0})`}
                      >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span>{post.comments_count || 0}</span>
                      </button>
                      
                      <button 
                        className="post-action share-action"
                        aria-label={`Share post (${post.shares_count || 0})`}
                      >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13"></path>
                          <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                        </svg>
                        <span>{post.shares_count || 0}</span>
                      </button>
                      
                      <button 
                        className={`post-action ${post.is_liked ? 'liked' : ''}`}
                        onClick={() => handleLikePost(post.id, post.is_liked)}
                        aria-label={`${post.is_liked ? 'Unlike' : 'Like'} post (${post.likes_count || 0})`}
                        aria-pressed={post.is_liked}
                      >
                        {post.is_liked ? (
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        )}
                        <span>{post.likes_count || 0}</span>
                      </button>
                    </div>
                    
                    {/* Comment Section (expanded when clicked) */}
                    {isExpanded && (
                      <div className="post-comments bg-gray-50 rounded-xl shadow-inner p-4 mt-2 space-y-3">
                        <CommentSection 
                          postId={post.id} 
                          token={token} 
                          currentUser={userData}
                          onCommentAdded={(count) => handleCommentAdded(post.id, count)} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <div className="right-panel">
          <h3 className="panel-header">Stats</h3>
          <div className="user-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 4v7H5.17l-.59.59-.58.58V4h11m1-2H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm5 4h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1z" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.postsCount}</span>
                <span className="stat-label">Total Posts</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.likesCount}</span>
                <span className="stat-label">Total Likes</span>
              </div>
            </div>
          </div>
          <div className="panel-divider"></div>
          <div className="user-meta">
            <div className="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 4.25l-7.07 4.42c-.32.2-.74.2-1.06 0L4.4 8.25c-.25-.16-.4-.43-.4-.72 0-.67.73-1.07 1.3-.72L12 11l6.7-4.19c.57-.35 1.3.05 1.3.72 0 .29-.15.56-.4.72z" />
              </svg>
              <span>{userData.email}</span>
            </div>
            {userData.phone && (
              <div className="meta-item">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
                <span>{userData.phone}</span>
              </div>
            )}
            <div className="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
              <span>Joined on {new Date(userData.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <nav className="main-nav mobile">
          <Link to="/home" className="nav-item mobile">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span>Home</span>
          </Link>
          <Link to="/explore" className="nav-item mobile">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <span>Search</span>
          </Link>
          <Link to="/profile" className="nav-item mobile active">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span>Profile</span>
          </Link>
          <a onClick={handleLogout} className="nav-item mobile"  aria-label="Logout">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </div>
            <span>Logout</span>
          </a>
        </nav>
      </div>
    </div>
  );
};

export default ProfilePage;