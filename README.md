# Next.js App Router – Interview Revision Guide

This project is built using Next.js App Router. This file is written as a fast revision sheet so all core concepts can be understood in one read before an interview.

## Client vs Server Components

Next.js uses Server Components by default. A Server Component runs on the server, loads faster, reduces browser JavaScript, and is mainly used for static UI and secure data fetching. Server Components cannot use React hooks, event handlers, or browser APIs.

To run a component in the browser, add `"use client"` at the top of the file. This converts it into a Client Component. Client Components support useState, useEffect, click handlers, browser APIs like window/localStorage, and interactive UI. Use Client Components only when interactivity is required.

## Routing System

The `app/` folder controls routing. Every folder inside `app/` automatically becomes a route, and each route must contain a `page.jsx` file. Example: `app/about/page.jsx` creates `/about`. Dynamic routing is created using square brackets like `app/posts/[postId]/page.jsx`, which creates routes like `/posts/123`. Dynamic values are accessed using `params.postId` inside the page component.

## Layout, Loading and Error Files

Next.js supports special system files for UI structure. `layout.jsx` is used to wrap pages with shared UI like navbar and footer. A layout in `app/layout.jsx` applies globally, while a layout inside a folder applies only to that route. `loading.jsx` shows a loading screen while data is being fetched. `error.jsx` acts as an automatic error boundary and displays fallback UI when a page crashes. These files improve UX without extra configuration.

## Data Fetching Methods

Next.js provides three main data strategies. Server Side Rendering (SSR) fetches fresh data on every request using `fetch(url, { cache: "no-store" })` and is best for dashboards or real-time content. Static Site Generation (SSG) is the default behavior and fetches data once at build time using normal `fetch(url)`; it is fastest and ideal for blogs or marketing pages. Incremental Static Regeneration (ISR) refreshes static content automatically using `fetch(url, { next: { revalidate: 10 } })`, allowing updates without rebuilding the site and is useful for semi-dynamic content like product listings.

## API Routes (Backend Inside Next.js)

Next.js allows backend routes inside the same project using special route files. Creating `app/api/users/route.js` automatically exposes `/api/users`. Supported HTTP methods include GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS. Example:

```js
export async function GET() {
  return new Response(JSON.stringify({ message: "Hello" }));
}
```

API routes can connect to databases, authentication systems, or external services without needing a separate backend server.

## Metadata System

Next.js includes built-in metadata support for SEO. Static metadata is defined using `export const metadata = { title: "Home" }` and does not change at runtime. Dynamic metadata is created using `generateMetadata()` and is useful for product pages or dynamic routes where the title depends on fetched data. Metadata automatically updates the `<head>` section of the page.

## Summary (Quick Memory Map)

Server Component = default, fast, no hooks  
Client Component = `"use client"`, interactive  
app folder = routing system  
page.jsx = route entry  
[id] folder = dynamic route  
layout.jsx = shared UI wrapper  
loading.jsx = loading state  
error.jsx = error boundary  
SSR = fresh data per request  
SSG = build-time static  
ISR = timed refresh static  
app/api/.../route.js = backend endpoint  
metadata = SEO control

This structure allows Next.js to combine frontend, backend, routing, data fetching, and SEO into a single framework optimized for performance and developer productivity.




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
