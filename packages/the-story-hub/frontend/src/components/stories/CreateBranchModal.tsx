"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
} from "@nextui-org/react";
import { useState } from "react";
import { createBranchAPI } from "@/lib/api/chapters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateBranchInput, AgeRating } from "@/types/gqlTypes";
import { useSetGlobalMessage } from "@/components/common/GlobalMessage";

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  parentNodeId: string;
  onBranchCreated?: (nodeId: string) => void;
}

const AGE_RATING_OPTIONS = [
  { value: "G", label: "G - General Audiences" },
  { value: "PG", label: "PG - Parental Guidance" },
  { value: "PG_13", label: "PG-13 - Parents Strongly Cautioned" },
  { value: "M", label: "M - Mature (16+)" },
  { value: "ADULT_18_PLUS", label: "18+ - Adults Only" },
];

const CONTENT_WARNING_OPTIONS = [
  "violence",
  "sexual_content",
  "strong_language",
  "drug_use",
  "gore",
  "horror",
  "suicide",
  "abuse",
  "discrimination",
];

// Constants for class names
const BG_GRAY_800 = "bg-gray-800";
const BORDER_GRAY_700 = "border-gray-700";
const TEXT_GRAY_300 = "text-gray-300";

export function CreateBranchModal({
  isOpen,
  onClose,
  storyId,
  parentNodeId,
  onBranchCreated,
}: CreateBranchModalProps) {
  const [branchDescription, setBranchDescription] = useState("");
  const [content, setContent] = useState("");
  const [ageRating, setAgeRating] = useState<string>("");
  const [selectedWarnings, setSelectedWarnings] = useState<Set<string>>(
    new Set(),
  );

  const queryClient = useQueryClient();
  const setGlobalMessage = useSetGlobalMessage();

  const createBranchMutation = useMutation({
    mutationFn: async (input: CreateBranchInput) => {
      return createBranchAPI(input);
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh the branch list
      queryClient.invalidateQueries({
        queryKey: ["branches", storyId, parentNodeId],
      });
      setGlobalMessage({
        color: "success",
        content: "Branch created successfully!",
      });
      handleClose();
      // Notify parent component
      if (onBranchCreated) {
        onBranchCreated(data.nodeId);
      }
    },
    onError: (error) => {
      console.error("Failed to create branch:", error);
      setGlobalMessage({
        color: "error",
        content:
          error instanceof Error
            ? error.message
            : "Failed to create branch. Please try again.",
      });
    },
  });

  const handleClose = () => {
    setBranchDescription("");
    setContent("");
    setAgeRating("");
    setSelectedWarnings(new Set());
    onClose();
  };

  const handleSubmit = () => {
    if (!branchDescription.trim()) {
      setGlobalMessage({
        color: "error",
        content: "Please provide a branch description",
      });
      return;
    }
    if (!content.trim()) {
      setGlobalMessage({
        color: "error",
        content: "Please write some content for your branch",
      });
      return;
    }

    const input: CreateBranchInput = {
      storyId,
      parentNodeId,
      branchDescription: branchDescription.trim(),
      content: content.trim(),
      ageRating: ageRating ? (ageRating as AgeRating) : undefined,
      contentWarnings:
        selectedWarnings.size > 0 ? Array.from(selectedWarnings) : undefined,
    };

    createBranchMutation.mutate(input);
  };

  const toggleWarning = (warning: string) => {
    const newWarnings = new Set(selectedWarnings);
    if (newWarnings.has(warning)) {
      newWarnings.delete(warning);
    } else {
      newWarnings.add(warning);
    }
    setSelectedWarnings(newWarnings);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-gray-900 border border-gray-700",
        header: "border-b border-gray-700",
        body: "py-6",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white">Create a New Branch</h2>
          <p className="text-sm text-gray-400 font-normal">
            Add your own continuation to this story
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Branch Description */}
            <Input
              label="Branch Title"
              placeholder="e.g., 'The Hero Takes the Mountain Path'"
              value={branchDescription}
              onValueChange={setBranchDescription}
              isRequired
              classNames={{
                input: `${BG_GRAY_800} text-white`,
                inputWrapper: `${BG_GRAY_800} ${BORDER_GRAY_700}`,
                label: TEXT_GRAY_300,
              }}
              description="A short, descriptive title for your branch"
            />

            {/* Content */}
            <Textarea
              label="Your Story Content"
              placeholder="Write your continuation of the story here..."
              value={content}
              onValueChange={setContent}
              isRequired
              minRows={8}
              classNames={{
                input: `${BG_GRAY_800} text-white`,
                inputWrapper: `${BG_GRAY_800} ${BORDER_GRAY_700}`,
                label: TEXT_GRAY_300,
              }}
              description="Continue the story from where the parent chapter left off"
            />

            {/* Age Rating */}
            <Select
              label="Age Rating (Optional)"
              placeholder="Select age rating"
              selectedKeys={ageRating ? [ageRating] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setAgeRating(selected ? String(selected) : "");
              }}
              classNames={{
                trigger: `${BG_GRAY_800} ${BORDER_GRAY_700}`,
                value: "text-white",
                label: TEXT_GRAY_300,
                listbox: BG_GRAY_800,
              }}
              description="If your branch has different content than the parent"
            >
              {AGE_RATING_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  classNames={{
                    base: `${BG_GRAY_800} text-white data-[hover=true]:bg-gray-700`,
                  }}
                >
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            {/* Content Warnings */}
            <div>
              <span
                className={`block text-sm font-medium ${TEXT_GRAY_300} mb-2`}
              >
                Content Warnings (Optional)
              </span>
              <div className="flex flex-wrap gap-2">
                {CONTENT_WARNING_OPTIONS.map((warning) => (
                  <Chip
                    key={warning}
                    onClick={() => toggleWarning(warning)}
                    className={`cursor-pointer ${
                      selectedWarnings.has(warning)
                        ? "bg-orange-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {selectedWarnings.has(warning) && "✓ "}
                    {warning.replace(/_/g, " ")}
                  </Chip>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click to select/deselect content warnings that apply to your
                branch
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            variant="flat"
            onPress={handleClose}
            isDisabled={createBranchMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={createBranchMutation.isPending}
            isDisabled={
              !branchDescription.trim() ||
              !content.trim() ||
              createBranchMutation.isPending
            }
          >
            {createBranchMutation.isPending ? "Creating..." : "Create Branch"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
