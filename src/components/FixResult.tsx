import React from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Clipboard, Check } from "lucide-react";
import { motion } from "framer-motion";

interface FixResultProps {
  fixedCode?: string;
  isLoading?: boolean;
  onCopyFix?: () => void;
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
}: FixResultProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(fixedCode);
    setCopied(true);
    onCopyFix();

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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

      <ScrollArea className="h-[250px] w-full rounded-md border bg-secondary/50 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <pre className="text-sm font-mono">
            <code>{fixedCode}</code>
          </pre>
        </motion.div>
      </ScrollArea>

      <p className="mt-3 text-xs text-muted-foreground">
        Review the suggested fix before applying it to your code.
      </p>
    </Card>
  );
};

export default FixResult;
