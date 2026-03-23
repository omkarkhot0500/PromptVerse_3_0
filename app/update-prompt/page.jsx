"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Form from "@components/Form";

const UpdatePrompt = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get("id");
  const [post, setPost] = useState({ prompt: "", tag: "", isPrivate: false, isPermanent: false });
  const [submitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getPromptDetails = async () => {
      try {
        const response = await fetch(`/api/prompt/${promptId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch prompt details: ${response.status}`);
        }

        const data = await response.json();
        setPost({
          prompt: data.prompt,
          tag: data.tag,
          isPrivate: data.isPrivate || false,
          isPermanent: data.expiresAt === null || data.expiresAt === undefined,
        });
      } catch (error) {
        console.error("Error fetching prompt details:", error);
      }
    };
    if (promptId) getPromptDetails();
  }, [promptId]);

  const updatePrompt = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!promptId) return alert("Missing PromptId!");
    try {
      const response = await fetch(`/api/prompt/${promptId}`, {
        method: "PATCH",
        body: JSON.stringify({
          prompt: post.prompt,
          tag: post.tag,
          isPrivate: post.isPrivate,
          isPermanent: post.isPermanent,
        }),
      });
      if (response.ok) {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      type='Edit'
      post={post}
      setPost={setPost}
      submitting={submitting}
      handleSubmit={updatePrompt}
    />
  );
};

export default UpdatePrompt;