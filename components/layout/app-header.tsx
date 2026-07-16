"use client"

import { ChevronDownIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { mockUsers } from "@/lib/mock/data"
import { useAuthStore } from "@/stores/auth-store"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function AppHeader() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <span className="font-heading text-sm font-semibold tracking-tight">ShipIt</span>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar size="sm">
                <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{currentUser.name}</span>
              <div className="hidden gap-1 sm:flex">
                {currentUser.roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-[10px]">
                    {role}
                  </Badge>
                ))}
              </div>
              <ChevronDownIcon className="text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Viewing as (mock session)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockUsers.map((user) => (
              <DropdownMenuItem key={user.id} onClick={() => setCurrentUser(user)}>
                <Avatar size="sm">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.roles.join(" + ")}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
