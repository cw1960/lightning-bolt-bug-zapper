import React from "react";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { AlertCircle, Code } from "lucide-react";

interface CapturedContentProps {
  errorMessage?: string;
  codeSchema?: string;
}

const CapturedContent: React.FC<CapturedContentProps> = ({
  errorMessage = "TypeError: Cannot read properties of undefined (reading 'map')\nAt line 15 in UserList component",
  codeSchema = `const UserList = () => {\n  const [users, setUsers] = useState();\n\n  useEffect(() => {\n    fetchUsers().then(data => setUsers(data));\n  }, []);\n\n  return (\n    <div className="user-list">\n      <h2>User List</h2>\n      {users.map(user => (\n        <div key={user.id} className="user-item">\n          {user.name}\n        </div>\n      ))}\n    </div>\n  );\n};`,
}) => {
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
          <div className="h-[80px] w-full p-3 overflow-auto">
            <pre className="text-xs text-destructive font-mono whitespace-pre-wrap">
              {errorMessage || "No error message captured yet"}
            </pre>
          </div>
        </Card>
      </div>

      {/* Code Schema Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-blue-500" />
          <h4 className="text-sm font-medium">Code Schema</h4>
        </div>
        <Card className="bg-secondary/50 border-border">
          <div className="h-[120px] w-full p-3 overflow-auto">
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
              {codeSchema || "No code schema captured yet"}
            </pre>
          </div>
        </Card>
      </div>

      {/* Status Message */}
      {!errorMessage && !codeSchema ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground italic text-center">
            Use the selection buttons above to capture error messages and code
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
            <p className="text-sm text-blue-600 font-medium">
              Getting Started:
            </p>
            <ol className="text-xs text-blue-600 list-decimal pl-5 mt-1 space-y-1">
              <li>
                Click "Select Error Message" to capture the error from your page
              </li>
              <li>
                Then click "Select Code Block" to capture the problematic code
              </li>
              <li>Both selections are required to generate a fix</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-center">
            {errorMessage && codeSchema ? (
              <span className="text-green-500">
                Both error and code captured successfully
              </span>
            ) : (
              <span className="text-amber-500">
                Partially captured content - continue selection
              </span>
            )}
          </p>
          {errorMessage && !codeSchema && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <p className="text-xs text-amber-600">
                <span className="font-medium">Next step:</span> Click "Select
                Code Block" to capture the code that contains this error.
              </p>
            </div>
          )}
          {!errorMessage && codeSchema && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
              <p className="text-xs text-amber-600">
                <span className="font-medium">Next step:</span> Click "Select
                Error Message" to capture the error related to this code.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CapturedContent;
