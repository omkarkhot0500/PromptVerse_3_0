# Next.js App Router – Full Interview Revision Guide

This project is built using Next.js App Router. This document explains core architecture, routing, rendering, and backend behavior in a compact but complete format so it can be revised quickly before interviews.

## Client vs Server Components

Next.js uses Server Components by default. A Server Component runs only on the server, sends minimal JavaScript to the browser, improves performance, and is ideal for static UI and secure data fetching. Server Components cannot use React hooks, event handlers, or browser APIs because they never execute in the browser.

To force browser execution, add `"use client"` at the top of a file. This converts the file into a Client Component. Client Components behave like normal React components and support state, lifecycle hooks, interactivity, and browser features.

```js
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Use Client Components only when interactivity is required. Keep everything else as Server Components for performance.

## Routing System

The `app/` directory defines the routing system. Every folder inside `app/` automatically becomes a route segment, and each route must contain a `page.jsx` file. The folder structure equals the URL structure.

Example:

```
app/about/page.jsx → /about
app/blog/page.jsx → /blog
```

Dynamic routing is implemented using square bracket folders. This allows URLs based on IDs or slugs.

```
app/posts/[postId]/page.jsx → /posts/123
```

Dynamic parameters are accessed through `params`.

```js
export default function Page({ params }) {
  return <h1>Post ID: {params.postId}</h1>;
}
```

This mechanism replaces traditional React Router and is file-system based.

## Layout, Loading, and Error Files

Next.js introduces special system files that automatically control UI behavior.

`layout.jsx` wraps pages with shared UI like navigation or footers. A layout placed in `app/layout.jsx` becomes global. A layout inside a folder only applies to that route subtree.

```js
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <nav>Navbar</nav>
        {children}
      </body>
    </html>
  );
}
```

`loading.jsx` shows a fallback UI while async data loads.

```js
export default function Loading() {
  return <p>Loading...</p>;
}
```

`error.jsx` acts as an automatic error boundary.

```js
"use client";

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Retry</button>
    </div>
  );
}
```

These files require no manual routing or state management and improve UX automatically.

## Data Fetching Strategies

Next.js controls caching through the native `fetch` API. Rendering mode is determined by cache behavior.

### Server Side Rendering (SSR)

Fresh data is fetched on every request. No caching occurs.

```js
async function Page({ params }) {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${params.id}`,
    { cache: "no-store" },
  );
  const data = await res.json();
  return <pre>{JSON.stringify(data)}</pre>;
}
```

Use SSR for personalized dashboards or real-time content.

### Static Site Generation (SSG)

Default behavior. Data is fetched at build time and cached permanently.

```js
const res = await fetch(
  `https://jsonplaceholder.typicode.com/posts/${params.id}`,
);
const data = await res.json();
```

Best for blogs, landing pages, and documentation. Fastest performance.

### Incremental Static Regeneration (ISR)

Static pages that automatically refresh after a defined interval.

```js
const res = await fetch(
  `https://jsonplaceholder.typicode.com/posts/${params.id}`,
  { next: { revalidate: 10 } },
);
const data = await res.json();
```

Allows updating content without rebuilding the entire site.

## API Routes (Backend in Next.js)

Next.js includes a built-in backend system. Creating `app/api/.../route.js` generates an HTTP endpoint automatically.

```
app/api/users/route.js → /api/users
```

Supported HTTP methods:

GET → retrieve data  
POST → create resource  
PUT → replace resource  
PATCH → update resource  
DELETE → remove resource  
HEAD → headers only  
OPTIONS → allowed methods

Example GET route:

```js
export async function GET() {
  const users = [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
  ];
  return new Response(JSON.stringify(users));
}
```

API routes can connect to databases, authentication, or third-party services without needing a separate server.

## Metadata System (SEO)

Next.js has a built-in SEO metadata API.

Static metadata:

```js
export const metadata = {
  title: "Home",
};
```

Dynamic metadata:

```js
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return { title: product.title };
}
```

Metadata automatically updates the `<head>` tag and improves SEO and social sharing.

# Google OAuth Login Flow – NextAuth + MongoDB (Interview Revision Guide)

This project uses Google OAuth with NextAuth and MongoDB for authentication. This document explains the complete login architecture step-by-step in simple but interview-level detail. It is written as a fast revision sheet that explains not only what happens, but why it happens.

## Big Picture Architecture

The authentication pipeline looks like this:

User → Google → NextAuth → Database → Session → App

Each system has a responsibility:

Google → proves identity  
NextAuth → handles authentication flow  
MongoDB → stores app users  
Session → remembers login state  
App → uses authenticated user data

OAuth proves _who you are_.  
Database stores _who you are inside the app_.

## Step 1 – User clicks “Login with Google”

Frontend triggers:

```js
signIn("google");
```

NextAuth automatically redirects the user to Google’s OAuth login page. The user logs in and grants permission. Google returns profile information to NextAuth backend:

- email
- name
- profile picture
- OAuth token

Important interview point:  
Your app never sees the password. Google handles authentication security.

## Step 2 – NextAuth receives Google profile

NextAuth runs:

```js
callbacks.signIn();
```

This callback decides whether login should continue.

```js
async signIn({ account, profile })
```

`profile` contains:

- profile.email
- profile.name
- profile.picture

At this stage the app decides:

Should this user be allowed?  
Should we create a database record?

This is the gatekeeper step of authentication.

## Step 3 – Connect to database

```js
await connectToDB();
```

We connect to MongoDB inside the signIn callback before checking anything.

Interview explanation:  
We must connect to the database before login completes so we can verify or create user records atomically during authentication.

Authentication should never finish without database consistency.

## Step 4 – Check if user exists

```js
const userExists = await User.findOne({ email: profile.email });
```

We search MongoDB using the email.

Two possible outcomes:

### Case A – Existing user

User is found → allow login  
No new account is created

NextAuth continues authentication normally.

### Case B – New user

User not found → create a new account

But before creating the user, we generate a unique username.

This ensures app-level identity separate from Google.

## Step 5 – Generate unique username

```js
generateUniqueUsername(profile.name);
```

Purpose:

- convert Google name into safe username
- enforce formatting rules
- guarantee uniqueness in DB

Internally the function:

- removes spaces
- converts to lowercase
- strips special characters
- enforces 8–20 characters
- checks database uniqueness
- appends numbers if duplicate

Example:

"Omkar Khot" → omkarkhot  
if exists → omkarkhot1  
if exists → omkarkhot2

Loop continues until a unique username is found.

Interview insight:  
Username generation is deterministic but collision-safe.

## Step 6 – Create MongoDB user

```js
await User.create({
  email,
  username,
  image,
});
```

Now the app has an internal user record.

Important concept:

OAuth authenticates identity  
Database stores application identity

Google says: “This is Omkar”  
MongoDB says: “This is user #652839”

Your app always works with database identity.

## What is a Session?

A session is memory of who the user is after login.

Simple analogy:

Hotel check-in → you get a key card  
As long as you carry it → hotel remembers you

That remembered state = session

Without sessions, users would need to login on every request.

## What is a Cookie?

A cookie is a tiny piece of data stored in the browser.

It does NOT store passwords.  
It stores a session token or ID.

It’s a proof card that says:

“I am already logged in”

## How session + cookie work together

Full lifecycle:

1. User logs in
2. Server creates session ID → "abc123xyz"
3. Server sends cookie → session=abc123xyz
4. Browser stores cookie automatically
5. Every request sends cookie back
6. Server reads cookie → user recognized

This is how login persists across page reloads.

## Step 7 – Session callback

NextAuth runs:

```js
callbacks.session();
```

This callback customizes what data goes inside the session.

Google provides:

- email
- name
- image

But your app also needs:

- MongoDB user ID
- username

So the session callback fetches the database user:

```js
const sessionUser = await User.findOne(...)
```

Then attaches:

```js
session.user.id;
session.user.username;
```

Final session object:

```
session.user = {
  email,
  name,
  image,
  id,
  username
}
```

Frontend now receives both Google identity and app identity.

Interview insight:  
Session merges OAuth identity with internal database identity.

## Why fetch MongoDB user again?

Because Google only proves identity.

Your app requires internal identity.

Google → external authentication  
MongoDB → internal authorization

This separation allows:

- user permissions
- app data ownership
- profile customization
- database relations

## Step 8 – Session stored in cookie

After session is built:

NextAuth stores it securely in a cookie.

Browser automatically carries login proof.

Every request:

Browser → cookie → server → session restored

No re-login needed.

## Perfect Interview Summary Answer

If asked to explain login flow:

We use NextAuth with Google OAuth. When a user logs in, they are redirected to Google. After authentication, Google returns profile data to NextAuth. In the signIn callback we connect to MongoDB and check if the user exists. If not, we generate a unique username and create a new record. Then in the session callback we attach our database user ID and username to the session so the frontend has app-specific identity. OAuth verifies identity while MongoDB manages users. The session is stored in a secure cookie so login persists across requests.

This demonstrates understanding of authentication, sessions, cookies, and identity separation.

# MongoDB Atlas Search

"When I first built the prompt feed, I was doing what most people do—fetching all the data and filtering it on the frontend with a simple JavaScript. It worked fine with 10 prompts, but I knew that as soon as the platform grew, that approach would fall apart. It’s like downloading an entire library just to find one book—it’s a massive waste of bandwidth and would eventually crash the user's browser.

## So, I decided to move the 'heavy lifting' to the database by implementing Full-Text Search (FTS) using MongoDB Atlas Search.

If the interviewer leans in and asks, "Tell me more about the technical side," you can follow up with:

### The Inverted Index: "Conceptually, I set up an inverted index. Think of it like the index at the back of a textbook. Instead of reading the whole book front-to-back, the DB just looks at the word 'React' and immediately knows every page (or document) that contains it."

### Analyzers: "I used a 'standard analyzer' for the prompt text so it ignores 'stop words' like the, is, at. This ensures that searching for 'The best coding prompt' focuses on the words 'best', 'coding', and 'prompt' rather than the word 'the'."

### The Pipeline: "I moved the logic into a MongoDB Aggregation Pipeline. This allows me to combine the $search stage with things like $limit or $sort in one single, efficient trip to the database."

## Quick Interview Memory Map

Server Component → default, fast, no hooks  
Client Component → `"use client"` interactive  
app folder → routing system  
page.jsx → route entry  
[id] folder → dynamic routing  
layout.jsx → shared UI wrapper  
loading.jsx → async fallback  
error.jsx → error boundary  
SSR → fresh every request  
SSG → build-time static  
ISR → timed refresh  
app/api/.../route.js → backend endpoint  
metadata → SEO control

This architecture allows Next.js to unify frontend rendering, backend logic, routing, performance optimization, and SEO into one framework.

## Features

- To create prompts and share them .
- Google auth.
- Create , Update and delete prompts.
- Product Browsing: Users can view and search for products.
- Responsive Design: Optimized for both desktop and mobile devices.

## Tech Stack

Next, TailwindCSS

## Installation

Go to omkarkhot0500@gmail.com in google cloud console
--> change My First Project to PromptVerse
----> Credentials

Install my-project with npm

```bash
  git clone my-project
  cd my-project
```

npm install

npm run dev

## Deployment -- Render ( It need's 50s to start )

To deploy this project run

[https://prompt-verse-k.vercel.app/](https://prompt-verse-3-0.vercel.app/)

# 🐳 Docker Setup – PromptVerse (Next.js + NextAuth + MongoDB)

This project can be run using Docker in two ways:

1. Docker build + docker run
2. Docker Compose (Recommended)

---

## 📦 Prerequisites

Make sure you have:

- Docker installed
- Docker Compose installed (comes with Docker Desktop)

Check installation:

docker --version  
docker compose version

---

## 🚀 Method 1 – Using Docker Build & Run

### 1️⃣ Clone Repository

git clone https://github.com/your-username/promptverse.git  
cd promptverse

---

### 2️⃣ Create `.env` File

Create a file named `.env` in the root directory:

GOOGLE_ID=your_google_client_id  
GOOGLE_CLIENT_SECRET=your_google_client_secret  
MONGODB_URI=your_mongodb_connection_string  
NEXTAUTH_URL=http://localhost:3000  
NEXTAUTH_URL_INTERNAL=http://localhost:3000  
NEXTAUTH_SECRET=your_random_secret

---

### 3️⃣ Build Docker Image

docker build -t promptverse .

---

### 4️⃣ Run Container

docker run -p 3000:3000 --env-file .env promptverse

---

### ✅ Open in Browser

http://localhost:3000

---

## Method 2 – Using Docker Compose (Recommended)

This is the cleaner and preferred open-source method.

---

### 1️⃣ Create `.env` File

GOOGLE_ID=your_google_client_id  
GOOGLE_CLIENT_SECRET=your_google_client_secret  
MONGODB_URI=your_mongodb_connection_string  
NEXTAUTH_URL=http://localhost:3000  
NEXTAUTH_URL_INTERNAL=http://localhost:3000  
NEXTAUTH_SECRET=your_random_secret

---

### 2️⃣ Create `.env.example`

Create a file named `.env`:

GOOGLE_ID=  
GOOGLE_CLIENT_SECRET=  
MONGODB_URI=  
NEXTAUTH_URL=http://localhost:3000  
NEXTAUTH_URL_INTERNAL=http://localhost:3000  
NEXTAUTH_SECRET=

---

### 3️⃣ Run Docker Compose

Build and start:

docker compose up --build

Run in background:

docker compose up -d --build

---

### 4️⃣ Stop Containers

docker compose down

---

## Method 3 using pre-built image

# 🐳 Docker Hub

The project is available as a public Docker image:

docker pull omkarkhot0500/promptverseapp:latest

Run the container:

docker run -p 3000:3000 --env-file .env omkarkhot0500/promptverseapp:latest

Application will be available at:

http://localhost:3000

## 📂 Project Structure

promptverse/  
│── Dockerfile  
│── docker-compose.yml  
│── .dockerignore  
│── .env  
│── package.json  
│── next.config.js

---

## 🔐 Environment Variables

GOOGLE_ID → Google OAuth Client ID  
GOOGLE_CLIENT_SECRET → Google OAuth Secret  
MONGODB_URI → MongoDB Atlas connection string  
NEXTAUTH_URL → App URL  
NEXTAUTH_SECRET → Authentication secret

Generate secret:

openssl rand -base64 32

---

App runs at:

http://localhost:3000
