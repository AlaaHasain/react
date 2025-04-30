import { API_URL } from './auth';

/**
 * Search for posts and users based on a query
 */
export const searchContent = async (query, token) => {
  const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Search failed');
  }

  // Process posts to add is_liked property and other metadata
  if (data.posts && data.posts.length > 0) {
    // Get current user for adding like info
    let currentUser = {};
    try {
      const userResponse = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        currentUser = userData.user;
      }
    } catch (err) {
      console.error("Error fetching current user data:", err);
    }

    // Process each post to add additional data
    for (let i = 0; i < data.posts.length; i++) {
      const post = data.posts[i];
      
      try {
        // Add comments count
        try {
          const commentsResponse = await fetch(`${API_URL}/posts/${post.id}/comments`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            data.posts[i].comments_count = commentsData.length;
          }
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
          data.posts[i].comments_count = 0;
        }
        
        // Check if the current user has liked this post
        try {
          const likesResponse = await fetch(`${API_URL}/posts/${post.id}/likes`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            
            // Count how many likes this post has
            data.posts[i].likes_count = likesData.length;
            
            // Check if the current user has liked this post
            if (currentUser.id) {
              data.posts[i].is_liked = likesData.some(like => like.user_id === currentUser.id);
            }
          }
        } catch (error) {
          console.error(`Error fetching likes for post ${post.id}:`, error);
          // Provide default values if we can't get like information
          data.posts[i].likes_count = data.posts[i].likes_count || 0;
          data.posts[i].is_liked = false;
        }

        // If this post is by the current user, use their profile data
        if (post.user && post.user.id === currentUser.id) {
          data.posts[i].user.image_url = currentUser.image_url || data.posts[i].user.image_url;
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
      }
    }
  }

  // Process users to add additional information like profile images
  if (data.users && data.users.length > 0) {
    // Use the current user's data for the logged-in user if it's in the results
    let currentUser = {};
    try {
      const userResponse = await fetch(`${API_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        currentUser = userData.user;
      }
    } catch (err) {
      console.error("Error fetching current user data:", err);
    }

    // Process each user to ensure they have profile data
    for (let i = 0; i < data.users.length; i++) {
      const user = data.users[i];
      
      // If this is the current user, use their profile data
      if (user.id === currentUser.id) {
        data.users[i] = { ...user, ...currentUser };
      }
      
      // Make sure each user has an image_url (even if it's null/undefined)
      if (!data.users[i].hasOwnProperty('image_url')) {
        data.users[i].image_url = null;
      }
      
      // Add post count for each user if available
      try {
        // Filter all posts to count how many belong to this user
        if (data.posts && data.posts.length > 0) {
          const userPosts = data.posts.filter(post => post.user_id === user.id);
          data.users[i].posts_count = userPosts.length;
        } else {
          data.users[i].posts_count = 0;
        }
      } catch (error) {
        console.error(`Error calculating post count for user ${user.id}:`, error);
        data.users[i].posts_count = 0;
      }
    }
  }

  return data;
};