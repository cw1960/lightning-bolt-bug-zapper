import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Clipboard, Check, Edit, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Textarea } from "./ui/textarea";

interface FixResultProps {
  fixedCode?: string;
  isLoading?: boolean;
  onCopyFix?: () => void;
  onUpdateFix?: (updatedCode: string) => void;
  onSaveFix?: (fixName: string, code: string) => void;
}

const FixResult = ({
  fixedCode = `// Example fixed code
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">Counter: {count}</h2>
      <button 
        className="px-4 py-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
    </div>
  );
}`,
  isLoading = false,
  onCopyFix = () => {},
  onUpdateFix = () => {},
  onSaveFix = () => {},
}: FixResultProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(fixedCode);
  const [isSaving, setIsSaving] = useState(false);
  const [fixName, setFixName] = useState("");

  // Update editedCode when fixedCode changes (e.g., when a new fix is generated)
  useEffect(() => {
    setEditedCode(fixedCode);
  }, [fixedCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedCode);
    setCopied(true);
    onCopyFix();

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdateFix(editedCode);
  };

  const handleSaveFix = () => {
    if (!fixName.trim()) {
      setFixName(`Fix-${new Date().toISOString().slice(0, 10)}`);
      return;
    }

    onSaveFix(fixName, editedCode);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full p-4 bg-background border border-border">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Generating fix...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full p-4 bg-background border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Suggested Fix</h3>
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1"
            >
              <Save className="w-4 h-4 text-green-500" />
              <span>Save</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSaving(!isSaving)}
                className="flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                <span>Save Fix</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" />
                <span>Copy Fix</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isSaving && (
        <div className="bg-secondary/50 p-3 rounded-md flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter a name for this fix"
            value={fixName}
            onChange={(e) => setFixName(e.target.value)}
            className="flex-1 bg-background border border-input rounded-md px-3 py-1 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleSaveFix}>
            Save
          </Button>
        </div>
      )}

      {isEditing ? (
        <Textarea
          className="h-[250px] w-full rounded-md border bg-secondary/50 p-4 font-mono text-sm resize-none"
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
        />
      ) : (
        <ScrollArea className="h-[250px] w-full rounded-md border bg-secondary/50 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <pre className="text-sm font-mono">
              <code>{editedCode}</code>
            </pre>
          </motion.div>
        </ScrollArea>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {isEditing
          ? "Edit the suggested fix before applying it to your code."
          : isSaving
            ? "Save this fix to your library for future reference."
            : "Review the suggested fix before applying it to your code."}
      </p>
    </Card>
  );
};

export default FixResult;
