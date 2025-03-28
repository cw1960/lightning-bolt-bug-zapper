import React from "react";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { AlertCircle, Code } from "lucide-react";

interface CapturedContentProps {
  errorMessage?: string;
  codeSchema?: string;
}

const CapturedContent = ({
  errorMessage = "TypeError: Cannot read properties of undefined (reading 'map')\nAt line 15 in UserList component",
  codeSchema = `const UserList = () => {\n  const [users, setUsers] = useState();\n\n  useEffect(() => {\n    fetchUsers().then(data => setUsers(data));\n  }, []);\n\n  return (\n    <div className="user-list">\n      <h2>User List</h2>\n      {users.map(user => (\n        <div key={user.id} className="user-item">\n          {user.name}\n        </div>\n      ))}\n    </div>\n  );\n};`,
}: CapturedContentProps) => {
  return (
    <div className="bg-background p-4 rounded-lg border border-border w-full space-y-4">
      <h3 className="text-lg font-medium">Captured Content</h3>
      <Separator />

      {/* Error Message Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <h4 className="text-sm font-medium">Error Message</h4>
        </div>
        <Card className="bg-destructive/10 border-destructive/20">
          <ScrollArea className="h-[80px] w-full p-3">
            <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">
              {errorMessage || "No error message captured yet"}
            </pre>
          </ScrollArea>
        </Card>
      </div>

      {/* Code Schema Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-medium">Code Schema</h4>
        </div>
        <Card className="bg-secondary/50 border-border">
          <ScrollArea className="h-[120px] w-full p-3">
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
              {codeSchema || "No code schema captured yet"}
            </pre>
          </ScrollArea>
        </Card>
      </div>

      {/* Status Message */}
      {!errorMessage && !codeSchema ? (
        <p className="text-sm text-muted-foreground italic text-center">
          Use the selection buttons above to capture error messages and code
        </p>
      ) : (
        <p className="text-sm text-green-500 text-center">
          {errorMessage && codeSchema
            ? "Both error and code captured successfully"
            : "Partially captured content - continue selection"}
        </p>
      )}
    </div>
  );
};

export default CapturedContent;
