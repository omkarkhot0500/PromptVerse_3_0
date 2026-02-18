"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Profile from "@components/Profile";
import DeleteConfirmModal from "@components/DeleteConfirmModal";

const MyProfile = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [myPosts, setMyPosts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, post: null });

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await fetch(`/api/users/${session?.user.id}/posts`);
      const data = await response.json();

      setMyPosts(data);
    };

    if (session?.user.id) fetchPosts();
  }, [session?.user.id]);

  const handleEdit = (post) => {
    router.push(`/update-prompt?id=${post._id}`);
  };

  const handleDelete = (post) => {
    setDeleteModal({ isOpen: true, post });
  };

  const confirmDelete = async () => {
    const post = deleteModal.post;
    try {
      await fetch(`/api/prompt/${post._id.toString()}`, {
        method: "DELETE",
      });

      const filteredPosts = myPosts.filter((item) => item._id !== post._id);
      setMyPosts(filteredPosts);
      setDeleteModal({ isOpen: false, post: null });
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteModal({ isOpen: false, post: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, post: null });
  };

  return (
    <>
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <Profile
        name={session?.user.name || "My"}
        desc={`Welcome to your personalized profile page, ${
          session?.user.name || "My"
        }. Share your exceptional prompts and inspire others with the power of your imagination`}
        data={myPosts}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </>
  );
};

export default MyProfile;
