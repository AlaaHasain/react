import React from 'react';

const Comment = ({ comment }) => {
  const commentUser = comment.user || {};
  
  return (
    <div className="comment">
      <div className="comment-avatar">
        {commentUser?.image_url ? (
          <img src={commentUser.image_url} alt={commentUser.name} />
        ) : (
          <div className="default-avatar"></div>
        )}
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">{commentUser.name || 'User'}</span>
          <span className="comment-time">
            {comment.created_at ? new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          </span>
        </div>
        <div className="comment-body">{comment.body}</div>
      </div>
    </div>
  );
};

export default Comment;