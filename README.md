<h1>Talkify - Real-Time Chat Application</h1>

<p>This project is a <strong>Real-Time Chat Application</strong> built with the <strong>MERN Stack and Socket.io</strong>. The system allows users to connect with friends, create group chats, and exchange messages instantly. It includes a robust Node.js/Express backend for data processing and real-time communication, and a React-based frontend for a beautiful, user-friendly experience.</p>

<hr>

<h2><b>📋 Features</b></h2>
<p>Based on the React frontend, Express backend, and Socket.io library, the system provides the following features:</p>
<ul>
  <li><strong>Real-Time Messaging:</strong> Instant message delivery and receipt without page reloads.</li>
  <li><strong>Direct & Group Chats:</strong> Create private 1-on-1 conversations or bring multiple friends together in group chats.</li>
  <li><strong>Friend System:</strong> Easily search for users, send/receive friend requests, and manage your friend list.</li>
  <li><strong>Beautiful UI:</strong> A clean, responsive, and modern interface with dark/light mode support.</li>
  <li><strong>Secure Authentication:</strong> Safe user sign-up, sign-in, and protected routes.</li>
</ul>

<hr>

<h2><b>💻 Technologies & Tools</b></h2>
<p>This project leverages a modern web development stack to ensure high performance, real-time capabilities, and a highly maintainable codebase. Here is a breakdown of the key technologies used:</p>
<ul>
  <li><strong>React & Vite:</strong> The frontend is built with React for building interactive UIs and bundled using Vite for lightning-fast Hot Module Replacement (HMR) and optimized production builds.</li>
  <li><strong>TypeScript:</strong> Used extensively in the frontend to provide strict static typing. This helps catch errors during development, improves code readability, and enhances IDE autocompletion.</li>
  <li><strong>Socket.io:</strong> The core engine for real-time features. It establishes a persistent, bidirectional WebSocket connection between the client and server, enabling instant messaging, live typing indicators, and real-time online status updates.</li>
  <li><strong>Zustand:</strong> A small, fast, and scalable state-management library. It is used to manage complex global frontend states—such as user authentication (<code>useAuthStore</code>), active chat sessions (<code>useChatStore</code>), friend lists (<code>useFriendStore</code>), and UI themes—without the heavy boilerplate of Redux.</li>
  <li><strong>Tailwind CSS & Shadcn UI:</strong> Tailwind provides utility-first CSS classes for rapid, custom styling. <strong>Shadcn UI</strong> is integrated to supply beautifully designed, accessible, and customizable pre-built components (like dialogs, avatars, tooltips, and badges) directly into the source code.</li>
  <li><strong>Node.js & Express:</strong> The backend is powered by Node.js and the Express framework, handling RESTful API routes, business logic, middleware configuration, and serving as the HTTP server for Socket.io.</li>
  <li><strong>MongoDB & Mongoose:</strong> A NoSQL database chosen for its flexibility with JSON-like documents. Mongoose is used as the Object Data Modeling (ODM) tool to define strict schemas for Users, Messages, Conversations, and Friend Requests.</li>
  <li><strong>JSON Web Tokens (JWT):</strong> Implemented for stateless, secure authentication. Upon successful login, the server issues a JWT which is used by the frontend to authorize protected API requests and secure Socket connections.</li>
</ul>

<hr>

<h2><b>🛠 Prerequisites</b></h2>
<ul>
  <li><strong>Node.js & npm:</strong> Ensure you have Node.js installed to run the server and client.</li>
  <li><strong>MongoDB:</strong> A running MongoDB instance (local or MongoDB Atlas) for database storage.</li>
</ul>

<hr>

<h2><b>⚙️ Environment Configuration</b></h2>
<p>Before running, you need to set up the environment variables for both the backend and frontend:</p>

<ol>
  <li><strong>Backend Configuration:</strong> Create a <code>.env</code> file in the <code>backend/</code> directory:</li>
</ol>

<pre><code>PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
</code></pre>

<ol start="2">
  <li><strong>Frontend Configuration:</strong> Create a <code>.env.development</code> file in the <code>frontend/</code> directory:</li>
</ol>

<pre><code>VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
</code></pre>

<p><strong>Important Note:</strong> Replace <code>your_mongodb_connection_string</code> and <code>your_super_secret_jwt_key</code> with your actual database URL and a secure random string.</p>

<hr>

<h2><b>🚀 Installation & Usage Guide</b></h2>

<h3>Step 1: Clone the Repository</h3>
<p>Open a terminal at the directory where you want to store the project and run:</p>
<pre><code>git clone https://github.com/your-username/talkify.git
cd talkify</code></pre>

<h3>Step 2: Run Backend Server</h3>
<p>Open a terminal window, navigate to the backend folder, install dependencies, and start the server (listening on port 5000):</p>
<pre><code>cd backend
npm install
npm run dev</code></pre>
<p><em>When you see the console log "Server running on port 5000" and "Connected to MongoDB", it is successful.</em></p>

<h3>Step 3: Run Frontend Client</h3>
<p>Open another terminal window, navigate to the frontend folder, install dependencies, and start the Vite development server:</p>
<pre><code>cd frontend
npm install
npm run dev</code></pre>

<hr>

<h2><b>📖 User Guide (Client Flow)</b></h2>
<p>Once the application is running, follow these steps to interact with the system:</p>
<ol>
  <li><strong>Authentication:</strong> Open your browser and go to <code>http://localhost:5173</code>. Sign up for a new account or log in with your existing credentials.</li>
  <li><strong>Find Friends:</strong>
    <ul>
      <li>Use the Add Friend or Search feature to look for other registered users.</li>
      <li>Send a friend request and wait for the other user to accept it.</li>
    </ul>
  </li>
  <li><strong>Start Chatting:</strong>
    <ul>
      <li>Select a friend from your Direct Message list to open a 1-on-1 chat window.</li>
      <li>Type your message and send it. The message will appear instantly on both screens via Socket.io.</li>
    </ul>
  </li>
  <li><strong>Group Chats:</strong>
    <ul>
      <li>Click on the button to create a new group chat, select multiple friends from your list, and assign a group name to start a shared conversation.</li>
    </ul>
  </li>
</ol>

<hr>

<h2><b>❓ Troubleshooting</b></h2>
<p>If you encounter connection issues or bugs, please check:</p>
<ul>
  <li>Is the MongoDB service running and is the <code>MONGODB_URI</code> correct?</li>
  <li>Are the frontend environment variables (<code>VITE_API_URL</code>, <code>VITE_SOCKET_URL</code>) pointing to the correct backend port (5000)?</li>
  <li>Are ports <code>5000</code> (backend) and <code>5173</code> (frontend) free and not blocked by other applications?</li>
  <li>Did you forget to run <code>npm install</code> in either the <code>backend</code> or <code>frontend</code> folder?</li>
</ul>
