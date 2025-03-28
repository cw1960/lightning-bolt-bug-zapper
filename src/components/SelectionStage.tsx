import React from "react";
import { Button } from "@/components/ui/button";
import { Zap, Code } from "lucide-react";

interface SelectionStageProps {
  onSelectError?: () => void;
  onSelectCode?: () => void;
  isErrorSelected?: boolean;
  isCodeSelected?: boolean;
}

const SelectionStage = ({
  onSelectError = () => {},
  onSelectCode = () => {},
  isErrorSelected = false,
  isCodeSelected = false,
}: SelectionStageProps) => {
  return (
    <div className="p-4 bg-background rounded-lg border border-border">
      <h3 className="text-lg font-medium mb-4">Select Content to Fix</h3>
      <div className="space-y-4">
        <Button
          onClick={onSelectError}
          className="w-full justify-start gap-2 h-12"
          variant={isErrorSelected ? "secondary" : "outline"}
          disabled={isErrorSelected}
        >
          <Zap className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span>Select Error Message</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isErrorSelected
                ? "Error message captured"
                : "Click to select error on page"}
            </span>
          </div>
        </Button>

        <Button
          onClick={onSelectCode}
          className="w-full justify-start gap-2 h-12"
          variant={isCodeSelected ? "secondary" : "outline"}
          disabled={isCodeSelected || !isErrorSelected}
        >
          <Code className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span>Select Code Block</span>
            <span className="text-xs text-muted-foreground font-normal">
              {isCodeSelected
                ? "Code block captured"
                : isErrorSelected
                  ? "Click to select code on page"
                  : "Select error message first"}
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default SelectionStage;
