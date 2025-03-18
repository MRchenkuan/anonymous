let userAddress = '';

async function init() {
    const response = await fetch('/api/identity');
    const data = await response.json();
    userAddress = data.address;
    document.getElementById('userAddress').textContent = userAddress;
    loadPosts();
}

async function loadPosts() {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';
    
    for (const post of posts) {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    }
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'p-4 bg-white rounded shadow';
    div.innerHTML = `
        <p class="text-gray-600">作者: ${post.author}</p>
        <p class="mt-2">${post.content}</p>
        <p class="text-sm text-gray-500 mt-2">${new Date(post.timestamp).toLocaleString()}</p>
        <div class="mt-4">
            <input type="text" placeholder="写评论..." class="p-2 border rounded w-full" />
            <button onclick="addComment('${post.id}')" class="mt-2 px-4 py-1 bg-gray-500 text-white rounded">评论</button>
        </div>
        <div class="comments mt-4"></div>
    `;
    loadComments(post.id, div.querySelector('.comments'));
    return div;
}

async function createPost() {
    const content = document.getElementById('newPost').value;
    if (!content) return;

    await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    document.getElementById('newPost').value = '';
    loadPosts();
}

async function loadComments(postId, container) {
    const response = await fetch(`/api/posts/${postId}/comments`);
    const comments = await response.json();
    
    container.innerHTML = comments.map(comment => `
        <div class="ml-4 mt-2 p-2 bg-gray-50 rounded">
            <p class="text-gray-600">作者: ${comment.author}</p>
            <p class="mt-1">${comment.content}</p>
            <p class="text-xs text-gray-500">${new Date(comment.timestamp).toLocaleString()}</p>
        </div>
    `).join('');
}

async function addComment(postId) {
    const input = event.target.parentElement.querySelector('input');
    const content = input.value;
    if (!content) return;

    await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    input.value = '';
    loadComments(postId, event.target.parentElement.nextElementSibling);
}

init();