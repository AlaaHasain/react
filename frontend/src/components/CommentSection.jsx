import React, { useState, useEffect } from 'react';
import { getPostComments, addComment, deleteComment } from '../api/posts';

const CommentSection = ({ postId, token, currentUser, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, [postId, token]);

  // Fetch comments for the post
  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getPostComments(postId, token);
      setComments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await addComment(postId, newComment, token);
      
      // Add the new comment to the comments array
      setComments([...comments, comment]);
      
      // Reset the input field
      setNewComment('');
      
      // Call the callback to update parent component
      if (onCommentAdded) {
        onCommentAdded(comments.length + 1);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete comment
  const confirmDeleteComment = (commentId) => {
    setShowDeleteConfirm(commentId);
  };

  // Cancel delete
  const cancelDeleteComment = () => {
    setShowDeleteConfirm(null);
  };

  // Delete a comment after confirmation
  const handleDeleteComment = async (commentId) => {
    try {
      setDeletingId(commentId);
      await deleteComment(commentId, token);
      // Remove the comment from the UI
      setComments(comments.filter(comment => comment.id !== commentId));
      // Update the comment count in parent component
      if (onCommentAdded) {
        onCommentAdded(comments.length - 1);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  // Check if the current user owns a comment
  const isCommentOwner = (comment) => {
    return currentUser && comment.user && currentUser.id === comment.user.id;
  };

  return (
    <div className="comment-section">
      {loading && comments.length === 0 ? (
        <div className="comment-loading">Loading comments...</div>
      ) : (
        <>
          {error && <div className="comment-error">{error}</div>}
          
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">No comments yet. Be the first to comment!</div>
            ) : (
              comments.map((comment) => (
                <div className="comment" key={comment.id}>
                  <div className="comment-avatar">
                    {comment.user?.image_url ? (
                      <img 
                        src={comment.user.image_url} 
                        alt={`${comment.user.name}'s avatar`}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <span>{comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="comment-content">
                    <div className="comment-header">
                      <div>
                        <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                        <span className="comment-username">@{comment.user?.username || (comment.user?.name || "user").toLowerCase().replace(/\s+/g, '')}</span>
                      </div>
                      <div className="comment-actions">
                        <span className="comment-time">
                          {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isCommentOwner(comment) && (
                          <button 
                            className="delete-comment-btn"
                            onClick={() => confirmDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            aria-label="Delete comment"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="comment-body">{comment.body}</div>
                    
                    {/* Delete confirmation popup */}
                    {showDeleteConfirm === comment.id && (
                      <div className="delete-confirm-popup">
                        <p>Delete this comment?</p>
                        <div className="delete-confirm-actions">
                          <button 
                            className="delete-confirm-btn delete-yes" 
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                          >
                            {deletingId === comment.id ? 'Deleting...' : 'Yes, delete'}
                          </button>
                          <button 
                            className="delete-confirm-btn delete-no" 
                            onClick={cancelDeleteComment}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="comment-input-wrapper">
              {currentUser?.image_url ? (
                <img 
                  src={currentUser.image_url} 
                  alt="Your avatar"
                  className="user-comment-avatar"
                />
              ) : (
                <div className="avatar-placeholder user-comment-avatar">
                  <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
                </div>
              )}
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                disabled={submitting}
                className="comment-input"
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="comment-submit-button"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default CommentSection;