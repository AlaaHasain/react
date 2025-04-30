import React, { useEffect, useState, useContext } from 'react';
import { getAllPosts, createPost, likePost, unlikePost } from '../api/posts';
import { AuthContext } from '../context/AuthContext';
import CommentSection from './CommentSection';

const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPostContent, setNewPostContent] = useState('');
    const [postError, setPostError] = useState(null);
    const [expandedCommentId, setExpandedCommentId] = useState(null);
    const { isAuthenticated } = useContext(AuthContext);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            // Get the token from local storage or the user context
            const token = localStorage.getItem('token');
            const data = await getAllPosts(token);
            setPosts(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch posts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        
        if (!newPostContent.trim()) {
            setPostError('Post content cannot be empty');
            return;
        }

        try {
            setPostError(null);
            setLoading(true);
            const token = localStorage.getItem('token');
            await createPost(newPostContent, token);
            setNewPostContent(''); // Clear the form
            fetchPosts(); // Refresh the posts list
        } catch (err) {
            setPostError(err.message || 'Failed to create post. Please try again.');
            console.error('Error creating post:', err);
        } finally {
            setLoading(false);
        }
    };

    // Toggle comment section visibility
    const toggleComments = (postId) => {
        setExpandedCommentId(expandedCommentId === postId ? null : postId);
    };
  
    // Handle comment count update
    const handleCommentAdded = (postId, commentCount) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments_count: commentCount
                };
            }
            return post;
        }));
    };

    // Handle like/unlike post
    const handleLikePost = async (postId, isLiked) => {
        try {
            // Optimistically update UI first
            setPosts(posts.map(post => {
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
            const token = localStorage.getItem('token');
            if (isLiked) {
                await unlikePost(postId, token);
            } else {
                await likePost(postId, token);
            }
        } catch (err) {
            console.error('Error handling like/unlike:', err);
            
            // Revert the optimistic update if there was an error
            setPosts(posts.map(post => {
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
    };

    if (loading && posts.length === 0) return (
        <div className="posts-loading-container">
            <div className="dot-loader">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>
            <p>Loading posts...</p>
        </div>
    );

    return (
        <div className="post-list">
            <h2>Posts</h2>
            
            {isAuthenticated && (
                <div className="create-post-form">
                    <h3>Create a New Post</h3>
                    <form onSubmit={handleCreatePost}>
                        <div className="form-group">
                            <textarea 
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="What's on your mind?"
                                rows="4"
                            />
                        </div>
                        {postError && <div className="error-message">{postError}</div>}
                        <button type="submit" disabled={loading}>
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </form>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
            
            <div className="posts">
                {posts.length === 0 ? 
                    <p>No posts yet. Be the first to share something!</p> :
                    posts.map(post => {
                        const isExpanded = expandedCommentId === post.id;
                        return (
                            <div key={post.id} className="post-item">
                                <h3>{post.user?.name || 'Unknown user'}</h3>
                                <p>{post.body}</p>
                                <div className="post-meta">
                                    <span>{new Date(post.created_at).toLocaleString()}</span>
                                    <span className="post-username">@{post.user?.username || (post.user?.name || "user").toLowerCase().replace(/\s+/g, '')}</span>
                                    
                                    {/* Post actions */}
                                    <div className="post-actions">
                                        <button
                                            className={`post-action comment-action ${isExpanded ? 'active' : ''}`}
                                            onClick={() => toggleComments(post.id)}
                                            aria-expanded={isExpanded}
                                            aria-label={`${isExpanded ? 'Hide' : 'Show'} comments (${post.comments_count || 0})`}
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                                            </svg>
                                            <span className="comment-count">{post.comments_count || 0}</span>
                                        </button>
                                        
                                        <button 
                                            className={`post-action ${post.is_liked ? 'liked' : ''}`}
                                            onClick={() => handleLikePost(post.id, post.is_liked)}
                                            aria-label={`${post.is_liked ? 'Unlike' : 'Like'} post (${post.likes_count || 0})`}
                                            aria-pressed={post.is_liked}
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                            <span>{post.likes_count || 0}</span>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Comment Section (expanded when clicked) */}
                                {isExpanded && (
                                    <div className="post-comments bg-gray-50 rounded-xl shadow-inner p-4 mt-2 space-y-3">
                                        <CommentSection 
                                            postId={post.id} 
                                            token={localStorage.getItem('token')}
                                            currentUser={JSON.parse(localStorage.getItem('userData') || '{}').user}
                                            onCommentAdded={(count) => handleCommentAdded(post.id, count)} 
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default PostList;