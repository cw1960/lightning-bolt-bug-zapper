import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crosshair, X } from "lucide-react";
import { Button } from "./ui/button";

interface SelectionOverlayProps {
  isActive?: boolean;
  selectionType?: "error" | "code";
  onSelect?: (content: string, element: HTMLElement) => void;
  onCancel?: () => void;
}

const SelectionOverlay = ({
  isActive = false,
  selectionType = "error",
  onSelect = () => {},
  onCancel = () => {},
}: SelectionOverlayProps) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const [isSelecting, setIsSelecting] = useState(isActive);

  // Update internal state when prop changes
  useEffect(() => {
    setIsSelecting(isActive);
  }, [isActive]);

  // Handle mouse movement to highlight elements
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting) return;

      const target = e.target as HTMLElement;
      if (target !== hoveredElement) {
        // Remove highlight from previous element
        if (hoveredElement) {
          hoveredElement.style.outline = "";
          hoveredElement.style.backgroundColor = "";
        }

        // Add highlight to current element
        if (target && target !== document.body) {
          target.style.outline =
            selectionType === "error"
              ? "2px solid #ef4444"
              : "2px solid #3b82f6";
          target.style.backgroundColor =
            selectionType === "error"
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(59, 130, 246, 0.1)";
          setHoveredElement(target);
        } else {
          setHoveredElement(null);
        }
      }
    },
    [isSelecting, hoveredElement, selectionType],
  );

  // Handle click to select an element
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !hoveredElement) return;

      e.preventDefault();
      e.stopPropagation();

      // Get the text content of the selected element
      const content =
        hoveredElement.innerText || hoveredElement.textContent || "";

      // Call the onSelect callback with the content and element
      onSelect(content, hoveredElement);

      // Clean up
      if (hoveredElement) {
        hoveredElement.style.outline = "";
        hoveredElement.style.backgroundColor = "";
      }
      setHoveredElement(null);
      setIsSelecting(false);
    },
    [isSelecting, hoveredElement, onSelect],
  );

  // Handle escape key to cancel selection
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelecting) {
        if (hoveredElement) {
          hoveredElement.style.outline = "";
          hoveredElement.style.backgroundColor = "";
        }
        setHoveredElement(null);
        setIsSelecting(false);
        onCancel();
      }
    },
    [isSelecting, hoveredElement, onCancel],
  );

  // Add and remove event listeners
  useEffect(() => {
    if (isSelecting) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleKeyDown);

      // Prevent default behavior while selecting
      const preventDefault = (e: Event) => {
        if (isSelecting) e.preventDefault();
      };
      document.addEventListener("contextmenu", preventDefault);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("click", handleClick, true);
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", preventDefault);

        // Clean up any remaining highlights
        if (hoveredElement) {
          hoveredElement.style.outline = "";
          hoveredElement.style.backgroundColor = "";
        }
      };
    }
  }, [
    isSelecting,
    handleMouseMove,
    handleClick,
    handleKeyDown,
    hoveredElement,
  ]);

  if (!isSelecting) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      {/* Instruction banner */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 flex items-center gap-3"
      >
        <Crosshair
          className={
            selectionType === "error" ? "text-red-500" : "text-blue-500"
          }
        />
        <div>
          <h3 className="font-medium text-lg">
            Select {selectionType === "error" ? "Error Message" : "Code Block"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on the{" "}
            {selectionType === "error" ? "error message" : "code block"} you
            want to capture. Press ESC to cancel.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Simulated cursor indicator */}
      <motion.div
        className="fixed pointer-events-none z-50"
        style={{
          left: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
          top: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className={`h-12 w-12 rounded-full border-2 ${selectionType === "error" ? "border-red-500" : "border-blue-500"} flex items-center justify-center`}
        >
          <Crosshair
            className={`h-6 w-6 ${selectionType === "error" ? "text-red-500" : "text-blue-500"}`}
          />
        </div>
      </motion.div>

      {/* Cancel button */}
      <Button
        variant="destructive"
        className="fixed bottom-4 right-4 z-50"
        onClick={onCancel}
      >
        Cancel Selection
      </Button>
    </div>
  );
};

export default SelectionOverlay;
