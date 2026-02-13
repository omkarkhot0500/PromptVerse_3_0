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
    { cache: "no-store" }
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
  `https://jsonplaceholder.typicode.com/posts/${params.id}`
);
const data = await res.json();
```

Best for blogs, landing pages, and documentation. Fastest performance.

### Incremental Static Regeneration (ISR)

Static pages that automatically refresh after a defined interval.

```js
const res = await fetch(
  `https://jsonplaceholder.typicode.com/posts/${params.id}`,
  { next: { revalidate: 10 } }
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

  Go to  omkarkhot0500@gmail.com in google cloud console
  --> change My First Project to PromptVerse 
  ----> Credentials 

Install my-project with npm

```bash
  git clone my-project
  cd my-project
```
  npm install

  npm run dev 
## Deployment  --  Render      ( It need's 50s to start )

To deploy this project run


  [https://prompt-verse-k.vercel.app/](https://prompt-verse-3-0.vercel.app/)



## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`GOOGLE_ID =`
`GOOGLE_CLIENT_SECRET=`
`MONGODB_URI =`
`NEXTAUTH_URL =`   -- add the URL of deployed frontend
`NEXTAUTH_URL_INTERNAL =`  -- add the URL o f deployed frontend
`NEXTAUTH_SECRET =`
