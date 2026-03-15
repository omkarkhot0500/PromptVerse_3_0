"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const PromptCard = ({ post, handleEdit, handleDelete, handleTagClick }) => {
  const { data: session } = useSession();
  const pathName = usePathname();
  const router = useRouter();

  const [copied, setCopied] = useState("");

  const handleProfileClick = () => {
    console.log(post);

    if (post.creator._id === session?.user.id) return router.push("/profile");

    // Prevent navigation to other users' profiles if not logged in
    if (!session?.user.id) {
      return;
    }

    router.push(`/profile/${post.creator._id}?name=${post.creator.username}`);
  };

  const handleCopy = async () => {
    setCopied(post.prompt);
    navigator.clipboard.writeText(post.prompt);
    setTimeout(() => setCopied(false), 3000);

    // NEW: Track copy in background
    try {
      await fetch(`/api/prompt/${post._id}/copy`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Failed to track copy", error);
    }
  };

  // NEW: Calculate time until expiry
  const getTimeUntilExpiry = () => {
    if (post.isPrivate || !post.expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(post.expiresAt);
    
    if (expiry < now) return "Expired";
    
    const hoursLeft = Math.floor((expiry - now) / (1000 * 60 * 60));
    const minutesLeft = Math.floor(((expiry - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft === 0) {
      return `Expires in ${minutesLeft}m`;
    }
    if (hoursLeft < 1) return "Expires soon";
    if (hoursLeft < 24) return `Expires in ${hoursLeft}h`;
    
    return null;
  };

  const expiryInfo = getTimeUntilExpiry();

  return (
    <div className='prompt_card'>
      <div className='flex justify-between items-start gap-5'>
        <div
          className='flex-1 flex justify-start items-center gap-3 cursor-pointer'
          onClick={handleProfileClick}
        >
          <Image
            src={post.creator.image}      // Problem is here
            alt='user_image'
            width={40}
            height={40}
            className='rounded-full object-contain'
          />

          <div className='flex flex-col'>
            <h3 className='font-satoshi font-semibold text-gray-900'>
              {post.creator.username}
            </h3>
          </div>
        </div>

        <div className='copy_btn' onClick={handleCopy}>
          <Image
            src={
              copied === post.prompt
                ? "/assets/icons/tick.svg"
                : "/assets/icons/copy.svg"
            }
            alt={copied === post.prompt ? "tick_icon" : "copy_icon"}
            width={12}
            height={12}
          />
        </div>
      </div>

      <p className='my-4 font-satoshi text-sm text-gray-700'>{post.prompt}</p>
      <p
        className='font-inter text-sm blue_gradient cursor-pointer'
        onClick={() => handleTagClick && handleTagClick(post.tag)}
      >
        #{post.tag}
      </p>

      {/* NEW: Show expiry information for public prompts */}
      {expiryInfo && (
        <p className='font-inter text-xs mt-2 px-2 py-1 rounded bg-red-100 text-red-700 inline-block'>
          {expiryInfo}
        </p>
      )}

      {session?.user.id === post.creator._id && pathName === "/profile" && (
        <div className='mt-5 flex-center gap-4 border-t border-gray-100 pt-3'>
          <p
            className='font-inter text-sm green_gradient cursor-pointer'
            onClick={handleEdit}
          >
            Edit
          </p>
          <p
            className='font-inter text-sm orange_gradient cursor-pointer'
            onClick={handleDelete}
          >
            Delete
          </p>
        </div>
      )}
    </div>
  );
};

export default PromptCard;
