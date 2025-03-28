import React from "react";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Zap, Brain } from "lucide-react";

interface LLMSelectorProps {
  selectedLLM?: string;
  onLLMChange?: (llm: string) => void;
}

const LLMSelector = ({
  selectedLLM = "claude",
  onLLMChange = () => {},
}: LLMSelectorProps) => {
  const handleLLMChange = (value: string) => {
    onLLMChange(value);
  };

  return (
    <Card className="w-full p-4 bg-background border border-border rounded-lg">
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Select AI Model</h3>
        <RadioGroup
          value={selectedLLM}
          onValueChange={handleLLMChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2 rounded-md border p-2 hover:bg-secondary/50 transition-colors">
            <RadioGroupItem value="claude" id="claude" />
            <Label
              htmlFor="claude"
              className="flex items-center cursor-pointer w-full"
            >
              <Zap className="h-4 w-4 mr-2 text-purple-600" />
              <span>Claude 3.7</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2 rounded-md border p-2 hover:bg-secondary/50 transition-colors">
            <RadioGroupItem value="gemini" id="gemini" />
            <Label
              htmlFor="gemini"
              className="flex items-center cursor-pointer w-full"
            >
              <Brain className="h-4 w-4 mr-2 text-blue-600" />
              <span>Gemini 2.5</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
};

export default LLMSelector;
