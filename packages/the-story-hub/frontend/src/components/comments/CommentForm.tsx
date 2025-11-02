"use client";

import { useState } from "react";
import { Button, Textarea } from "@nextui-org/react";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  initialValue = "",
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        minRows={3}
        maxRows={8}
        className="w-full"
        classNames={{
          input: "bg-gray-900 text-white",
          inputWrapper: "bg-gray-900 border border-gray-700",
        }}
        disabled={isSubmitting}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          color="primary"
          size="sm"
          isLoading={isSubmitting}
          isDisabled={!content.trim()}
        >
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="flat"
            size="sm"
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
