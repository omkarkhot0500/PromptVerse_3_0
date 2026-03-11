"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Profile from "@components/Profile";

const UserProfile = ({ params }) => {
  const searchParams = useSearchParams();
  const userName = searchParams.get("name");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    // Prevent access to other users' profiles if not logged in
    if (status === "unauthenticated" && params?.id && session?.user?.id !== params?.id) {
      router.push("/");
      return;
    }

    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/users/${params?.id}/posts`);

        if (!response.ok) {
          throw new Error(`Failed to fetch user posts: ${response.status}`);
        }

        const data = await response.json();
        setUserPosts(data);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };

    if (params?.id && status !== "loading") fetchPosts();
  }, [params.id, session, status, router]);

  return (
    <Profile
      name={userName}
      desc={`Welcome to ${userName}'s personalized profile page. Explore ${userName}'s exceptional prompts and be inspired by the power of their imagination`}
      data={userPosts}
    />
  );
};

export default UserProfile;
