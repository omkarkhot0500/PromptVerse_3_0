# Introduction (me)

Hi, my name is **Omkar Khot**. I’m currently pursuing my BTech in **Computer Science with a specialization in AI and Machine Learning** from Global Academy of Technology, Bengaluru, and I’m graduating in 2026.

I’m mainly interested in **full-stack development and AI-based applications**. I have worked with technologies like **Java, JavaScript, TypeScript, React, Next.js, Node.js, Express.js, Python, MongoDB, and Redis**.

I have completed **two internships**, where I focused on web development and backend development, gaining practical experience in building applications.

One of my main projects is **PromptVerse**, a full-stack AI prompt-sharing platform. I built it in three versions based on actual usage and feedback. It includes features like **Google authentication, private prompts, Redis caching, Token Bucket rate limiting, and a trending-prompt feature**.

I have also worked on an **Enterprise IT Support Agentic RAG Copilot** using **Python, LangGraph, FastAPI, Pinecone, Groq, and Tavily**. It retrieves information from private company documents, evaluates the evidence, and falls back to external web search when required. I also implemented query rewriting, retry logic, secure document ingestion, and audit logging.

Apart from technical skills, I consider **problem-solving, communication, teamwork, and continuous learning** to be my strengths. I enjoy understanding how things work internally and applying what I learn by building projects.

Currently, I’m looking for an opportunity where I can contribute as a software engineer, work on real-world problems, and continue growing technically.


# Project Intro

One of my best projects is **PromptVerse**, which is a full-stack AI prompt-sharing platform.

The problem I wanted to solve was that I often create useful prompts and later need to reuse them. Instead of writing the same prompt again or searching through old conversations, I wanted to build a platform where users could **create, save, organize, search, and share prompts**.

I built it using **Next.js, MongoDB, and Redis**. I used Next.js as the full-stack framework, MongoDB as the main database for storing users and prompts, and Redis for **rate limiting and caching**.

What makes this project interesting is that I didn't build it just once. **It has gone through three versions based on actual usage and feedback.**

In **Version 1**, I built the basic prompt-sharing functionality and used it myself with some of my friends. After using it for some time, I noticed that some of my friends were sharing prompts that they didn't want everyone to see.

So, in **Version 2**, I added **private prompts**, allowing users to control whether their prompts were public or private.

In **Version 3**, I focused on improving the security, performance, and user experience of the application. I added **Google authentication using NextAuth**, implemented **Redis-based rate limiting using the Token Bucket algorithm**, added **Redis caching for public prompts**, and added a **trending feature** that shows the most copied prompts at the top of the feed.

For the trending feature, whenever a user copies a prompt, I store the copy timestamp. When the feed loads, I count the recent copies for each prompt, sort the prompts based on that count, and display the top three at the beginning of the feed.

For Redis, I use it for two main purposes: **rate limiting and caching**.

For **rate limiting**, I use the Token Bucket algorithm. For each user and API route, I store the current token count and the last updated time in Redis. When a request comes in, I calculate how many tokens should have been refilled based on the time passed. If a token is available, I allow the request and decrease the token count. If there are no tokens available, I return a **429 Too Many Requests** response.

For **caching**, I cache the public prompts displayed on the homepage in Redis. When a user requests the prompts, I first check Redis. If the data is available, I return it directly from Redis. If there is a cache miss, I fetch the prompts from MongoDB, store them in Redis with a **10-minute TTL**, and return them to the user.

So in my architecture, **MongoDB is the main source of truth**, while **Redis is used as a fast temporary layer for caching and rate-limiting state**.

Overall, PromptVerse evolved through real usage, feedback, and new requirements. It helped me gain practical experience with **full-stack development, authentication, database design, caching, rate limiting, API security, and performance optimization**.


## Redis (Upstash)

# Redis concepts you used
1. Caching
Caching means storing frequently requested data temporarily so that the application can retrieve it faster.
Interview answer:
I used Redis to cache frequently accessed prompt feeds so that the application doesn't need to query MongoDB every time.

2. Cache hit and cache miss
- Cache hit: Data is available in Redis.
- Cache miss: Data is not available in Redis, so the application fetches it from MongoDB.
Interview answer:
When a user requests the homepage feed, my application checks Redis first. If the data exists, it returns the cached result. Otherwise, it fetches the data from MongoDB and stores it in Redis for future requests.

3. Cache-aside pattern
Your application handles checking Redis, fetching missing data from MongoDB, and storing the result in Redis. This is commonly called the cache-aside pattern.
Interview answer:
I used the cache-aside pattern to improve performance. Redis is checked first, and MongoDB is queried only when the required cached data is unavailable.

4. TTL (Time to Live)
TTL automatically expires data after a specified time.
Interview answer:
I set a TTL of 10 minutes for cached feed data and one hour for rate-limit keys. This prevents cached data and rate-limit records from remaining indefinitely.

5. Cache invalidation
When new data is written to MongoDB, your application deletes the relevant cache so that the next request can fetch fresh data.
Interview answer:
After creating or updating a prompt, I invalidate the relevant Redis cache. The next request fetches updated data from MongoDB and repopulates the cache.

6. Rate limiting using Redis
Rate limiting prevents users from sending too many requests within a given period. Your project uses the Token Bucket algorithm.
Interview answer:
I used Redis to maintain rate-limiting information and implemented the Token Bucket algorithm to control API requests. If a user exceeds the allowed limit, the application rejects the request.

7. Read-through caching ⚠️
Did you use it? Not strictly. Your implementation follows the cache-aside pattern, which is similar.
Interview answer:
My application checks Redis first. If the data is unavailable, it fetches the data from MongoDB and stores it in Redis for future requests. This is called the cache-aside pattern.

8. Write-through caching ❌
Did you use it? No.
Interview answer:
I don't use write-through caching. When a prompt is created or updated, I save it to MongoDB and invalidate the relevant Redis cache. The cache is refreshed when the next request arrives.

9. Write-back caching ❌
Did you use it? No.
Interview answer:
I don't use write-back caching. My application writes data directly to MongoDB rather than writing to Redis first and updating the database later.