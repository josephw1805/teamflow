import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatar } from "@/lib/get-avatar";
import { cn } from "@/lib/utils";
import { organization_user } from "@kinde/management-api-js";
import Image from "next/image";

interface MemberItemProps {
  member: organization_user;
  isOnline?: boolean;
}

export function MemberItem({ member, isOnline }: MemberItemProps) {
  const isAdmin = member.roles?.includes("admin");
  return (
    <div className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="size-8">
            <Image
              src={getAvatar(member.picture ?? null, member.email ?? "")}
              alt="Member Avatar"
              fill
              className="object-cover"
            />
            <AvatarFallback>
              {member.full_name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background",
              isOnline ? "bg-green-500" : "bg-gray-400",
            )}
          />
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          {isAdmin && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{member.full_name}</p>
              <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10 dark:bg-orange-400/10 dark:text-orange-400 dark:ring-orange-400/30">
                Admin
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {member.email}
          </p>
        </div>
      </div>
    </div>
  );
}
