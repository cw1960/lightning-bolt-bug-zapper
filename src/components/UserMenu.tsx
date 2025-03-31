import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../lib/authContext";

interface UserMenuProps {
  onOpenSettings?: () => void;
  onOpenSubscription?: () => void;
}

const UserMenu = ({
  onOpenSettings = () => {},
  onOpenSubscription = () => {},
}: UserMenuProps) => {
  const { user, signOut, isSubscribed } = useAuth();

  if (!user) return null;

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={user.email || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {isSubscribed && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            {isSubscribed && (
              <p className="text-xs text-muted-foreground">Pro Subscription</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenSubscription}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>{isSubscribed ? "Manage Subscription" : "Upgrade to Pro"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
