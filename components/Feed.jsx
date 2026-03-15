"use client";

import { useState, useEffect, useMemo } from "react";

import PromptCard from "./PromptCard";
import PromptCardSkeleton from "./PromptCardSkeleton";

const SkeletonList = () => (
  <div className="mt-16 prompt_layout">
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <PromptCardSkeleton key={n} />
    ))}
  </div>
);

const PromptCardList = ({ data, handleTagClick }) => {
  return (
    <div className="mt-16 prompt_layout">
      {data.map((post) => (
        <PromptCard
          key={post._id}
          post={post}
          handleTagClick={handleTagClick}
        />
      ))}
    </div>
  );
};

const Feed = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchedResults, setSearchedResults] = useState([]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prompt");

      if (!response.ok) {
        throw new Error(`Failed to fetch prompts: ${response.status}`);
      }

      const data = await response.json();
      setAllPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Keep allPosts as [] on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filterPrompts = (searchtext) => {
    const regex = new RegExp(searchtext, "i"); // 'i' flag for case-insensitive search
    return allPosts.filter(
      (item) =>
        regex.test(item.creator.username) ||
        regex.test(item.tag) ||
        regex.test(item.prompt)
    );
  };

  const handleSearchChange = (e) => {
    clearTimeout(searchTimeout);
    setSearchText(e.target.value);

    // debounce method
    setSearchTimeout(
      setTimeout(() => {
        const searchResult = filterPrompts(e.target.value);
        setSearchedResults(searchResult);
      }, 500)
    );
  };

  const handleTagClick = (tagName) => {
    setSearchText(tagName);

    const searchResult = filterPrompts(tagName);
    setSearchedResults(searchResult);
  };

  const sortedPosts = useMemo(() => {
    const trending = [...allPosts]
      .filter((p) => p.recentCopyDates && p.recentCopyDates.length > 0)
      .sort((a, b) => b.recentCopyDates.length - a.recentCopyDates.length)
      .slice(0, 3);

    const trendingIds = new Set(trending.map((t) => t._id));
    const theRest = allPosts.filter((p) => !trendingIds.has(p._id));

    return [...trending, ...theRest];
  }, [allPosts]);

  const trendingTags = useMemo(() => {
    const tagCounts = {};
    allPosts.forEach((post) => {
      if (post.tag) {
        // Normalize tag string
        const cleanTag = post.tag.replace(/^#/, "").toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      }
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);
  }, [allPosts]);

  return (
    <section className="feed">
      <form className="relative w-full flex-center">
        <input
          type="text"
          placeholder="Search for a tag or a username"
          value={searchText}
          onChange={handleSearchChange}
          required
          className="search_input peer"
        />
      </form>



      {/* All Prompts */}
      {isLoading ? (
        <SkeletonList />
      ) : searchText ? (
        <PromptCardList
          data={searchedResults}
          handleTagClick={handleTagClick}
        />
      ) : (
        <PromptCardList data={sortedPosts} handleTagClick={handleTagClick} />
      )}
    </section>
  );
};

export default Feed;
