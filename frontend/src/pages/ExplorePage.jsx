import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { searchContent } from '../api/search';
import { likePost, unlikePost, deletePost } from '../api/posts';
import CommentSection from '../components/CommentSection';

const ExplorePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCommentId, setExpandedCommentId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  
  // Get user data and token
  const userData = user?.user || {};
  const token = user?.token || '';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults({ posts: [], users: [] });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await searchContent(debouncedQuery, token);
        
        console.log('Search results:', results); // Debugging
        
        // Process user profiles to ensure image_url is correctly set
        const processedUsers = results.users ? results.users.map(user => {
          // console.log(user)
          // Make sure image_url is properly set for display
          return {
            ...user,
            image_url: user.image_url || null,
            profile_image: user.profile_image || user.image_url || null // Handle both possible field names
          };
        }) : [];
        
        // Process posts to ensure user images are correctly set
        const processedPosts = results.posts ? results.posts.map(post => {
          
          if (post.user) {
            return {
              ...post,
              user: {
                ...post.user,
                image_url: post.user.image_url || post.user.profile_image || null, // Handle both possible field names
                profile_image: post.user.profile_image || post.user.image_url || null
              }
            };
          }
          return post;
        }) : [];
        
        console.log('Processed users:', processedUsers); // Debugging
        console.log('Processed posts:', processedPosts); // Debugging
        
        setSearchResults({
          ...results,
          users: processedUsers,
          posts: processedPosts
        });
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message || 'Failed to perform search');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, token]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Toggle comment section visibility
  const toggleComments = (postId) => {
    setExpandedCommentId(expandedCommentId === postId ? null : postId);
  };

  // Handle like/unlike post
  const handleLikePost = async (postId, isLiked) => {
    try {
      // Optimistically update UI first
      setSearchResults(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              is_liked: !isLiked
            };
          }
          return post;
        })
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
    } catch (err) {
      if (!isLiked) {
        console.error('Error liking post:', err);
        
        // Revert the optimistic update
        setSearchResults(prev => ({
          ...prev,
          posts: prev.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                likes_count: post.likes_count - 1,
                is_liked: false
              };
            }
            return post;
          })
        }));
      }
    }
  };
  
  // Handle comment count update
  const handleCommentAdded = (postId, commentCount) => {
    setSearchResults(prev => ({
      ...prev,
      posts: prev.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments_count: commentCount
          };
        }
        return post;
      })
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
      
      // Remove the deleted post from the UI
      setSearchResults(prev => ({
        ...prev,
        posts: prev.posts.filter(post => post.id !== postId)
      }));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeletingPostId(null);
      setShowDeleteConfirm(null);
    }
  };

  // Check if the current user owns a post
  const isPostOwner = (post) => {
    return userData.id && post.user && userData.id === post.user.id;
  };

  if (loading && debouncedQuery && !searchResults.posts.length && !searchResults.users.length) {
    return (
      <div className="loading-screen">
        <div className="dot-loader">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  // Helper function to get profile image URL for a user
  const getUserImageUrl = (user) => {
    if (!user) return null;
    return user.image_url || null;
  };

  // Helper function to display a profile image or fallback to initials
  const renderUserAvatar = (user, className = "post-avatar") => {
    const imageUrl = user?.image_url || null;
    const userName = user?.name || "User";
    const userInitial = userName.charAt(0).toUpperCase();
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={`${userName}'s avatar`} 
          className={className}
          onError={(e) => {
            e.target.onerror = null;
            // If image fails to load, replace with initial fallback
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class="${className}"><span>${userInitial}</span></div>`;
          }}
        />
      );
    } else {
      return (
        <div className={className}>
          <span>{userInitial}</span>
        </div>
      );
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
            <Link to="/explore" className="nav-item active">
              <div className="nav-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </div>
              <span className="nav-text">Explore</span>
            </Link>
            <Link to="/profile" className="nav-item">
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
        <div className="header">Explore</div>
        
        <div className="search-container">
          <div className="search-input-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"></path>
            </svg>
            <input
              type="text"
              placeholder="Search for posts, people, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>
          {loading && debouncedQuery && (
            <div className="search-loading">
              <div className="dot-loader small">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}
        
        <div className="search-results">
          {!debouncedQuery && (
            <div className="search-prompt">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <h2>Discover what's happening</h2>
              <p>Search for posts, people, or topics you're interested in.</p>
            </div>
          )}

          {debouncedQuery && !loading && searchResults.posts.length === 0 && searchResults.users.length === 0 && (
            <div className="no-results">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
              </svg>
              <h2>No results found</h2>
              <p>Try different keywords or check your spelling.</p>
            </div>
          )}

          {searchResults.posts.length > 0 && (
            <div className="post-feed">
              {searchResults.posts.map(post => {
                const postUser = post.user || {
                  id: post.user_id,
                  name: "User",
                  image_url: null
                };
                
                const isExpanded = expandedCommentId === post.id;
                const canDeletePost = isPostOwner(post);
                
                return (
                  <div className="post" key={post.id}>
                    {postUser?.image_url ? (
                      <img 
                        src={postUser.image_url} 
                        alt={`${postUser?.name || "User"}'s avatar`} 
                        className="post-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const initialChar = postUser?.name ? postUser.name.charAt(0).toUpperCase() : 'U';
                          e.target.parentNode.innerHTML = `<div class="post-avatar"><span>${initialChar}</span></div>`;
                        }}
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
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <div className="right-panel">
          {debouncedQuery && searchResults.users && searchResults.users.length > 0 ? (
            <>
              <h3 className="panel-header">People</h3>
              <div className="search-users-list">
                {searchResults.users.map(user => (
                  <Link to={`/profile/${user.id}`} className="search-user" key={user.id}>
                    <div className="search-user-avatar">
                      {user.image_url ? (
                        <img 
                          src={user.image_url} 
                          alt={`${user.name}'s profile`} 
                          className="user-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const initialChar = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="user-initial-fallback" 
                        style={{display: user.image_url ? 'none' : 'flex'}}
                      >
                        <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                      </div>
                    </div>
                    <div className="search-user-info">
                      <div className="search-user-name">{user.name}</div>
                      <div className="search-user-handle">@{user.username || user.name.toLowerCase().replace(/\s+/g, '')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : debouncedQuery ? (
            <div className="no-users-found">
              <h3 className="panel-header">People</h3>
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <p>No users found matching "{debouncedQuery}"</p>
              </div>
            </div>
          ) : (
            <div className="explore-tips">
              <h3 className="panel-header">Search Tips</h3>
              <ul className="tips-list">
                <li>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Search for people by name or username</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Find posts by content or topic</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>Use keywords for better results</span>
                </li>
              </ul>
            </div>
          )}
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
          <Link to="/explore" className="nav-item mobile active">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <span>Search</span>
          </Link>
          <Link to="/profile" className="nav-item mobile">
            <div className="nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span>Profile</span>
          </Link>
          <a onClick={handleLogout} className="nav-item mobile" aria-label="Logout">
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

export default ExplorePage;