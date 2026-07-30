import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Search,
  Users,
  FolderKanban,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useChatDirectory,
  useChatRooms,
  useCreateDirectRoom,
} from "@/features/chat/hooks/useChatRooms";
import { formatRoleLabel } from "@/features/community/lib/communityUtils";
import { cn } from "@/lib/utils";

function RoomButton({ room, isActive, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
        isActive
          ? "bg-[hsl(var(--chat-accent-line)/0.12)] text-text-primary shadow-sm"
          : "text-text-secondary hover:bg-white/70 hover:text-text-primary"
      )}
    >
      {isActive ? (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[hsl(var(--chat-accent-line))]"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-[hsl(var(--chat-accent-line)/0.15)] text-[hsl(var(--chat-accent-line))]"
            : "bg-white/80 text-text-muted shadow-sm ring-1 ring-border/40"
        )}
      >
        {room.otherUser ? (
          <UserAvatar user={room.otherUser} size="sm" className="h-9 w-9" />
        ) : (
          <Icon className="h-[18px] w-[18px]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {room.name}
        </p>
        <p className="truncate text-xs text-text-muted">
          {room.lastMessagePreview || room.subtitle || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">
      {children}
    </p>
  );
}

export function ChatRoomSidebar({ activeRoomId }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useChatRooms();
  const { data: directoryUsers = [], isFetching: directoryLoading } =
    useChatDirectory(search);
  const createDirect = useCreateDirectRoom();

  const community = data?.community;
  const projects = data?.projects ?? [];
  const direct = data?.direct ?? [];

  function selectRoom(roomId) {
    navigate(`/chat/${roomId}`);
  }

  async function startDirectChat(person) {
    const existing = direct.find(
      (room) => room.otherUser?.id === person.id
    );

    if (existing) {
      setSearch("");
      navigate(`/chat/${existing._id}`);
      return;
    }

    try {
      const result = await createDirect.mutateAsync(person.id);
      if (result?.room?._id) {
        setSearch("");
        navigate(`/chat/${result.room._id}`, { state: { room: result.room } });
      }
    } catch {
      // toast from mutation
    }
  }

  return (
    <aside className="flex h-full flex-col bg-[hsl(var(--chat-sidebar))]">
      <div className="border-b border-border/40 p-4 pb-3">
        <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary">
          Messages
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          Community, teams & direct
        </p>

        <div className="relative mt-4">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted/70"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl border border-border/50 bg-white py-2.5 pl-9 pr-3 text-sm text-text-primary shadow-sm placeholder:text-text-muted/80 focus-visible:border-[hsl(var(--chat-accent-line)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--chat-accent-line)/0.2)]"
          />
        </div>

        {search.trim().length > 0 ? (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-border/40 bg-white p-1 shadow-sm">
            {directoryLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ) : directoryUsers.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-text-muted">
                No people found
              </p>
            ) : (
              directoryUsers.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => startDirectChat(person)}
                  disabled={createDirect.isPending}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[hsl(var(--chat-accent-line)/0.08)]"
                >
                  <UserAvatar user={person} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {person.name}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {formatRoleLabel(person.role)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <SectionLabel>Community</SectionLabel>
            {community ? (
              <RoomButton
                room={community}
                isActive={activeRoomId === community._id}
                onClick={() => selectRoom(community._id)}
                icon={Users}
              />
            ) : null}

            {projects.length > 0 ? (
              <>
                <SectionLabel>Project teams</SectionLabel>
                <div className="space-y-0.5">
                  {projects.map((room) => (
                    <RoomButton
                      key={room._id}
                      room={room}
                      isActive={activeRoomId === room._id}
                      onClick={() => selectRoom(room._id)}
                      icon={FolderKanban}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {direct.length > 0 ? (
              <>
                <SectionLabel>Direct</SectionLabel>
                <div className="space-y-0.5">
                  {direct.map((room) => (
                    <RoomButton
                      key={room._id}
                      room={room}
                      isActive={activeRoomId === room._id}
                      onClick={() => selectRoom(room._id)}
                      icon={MessageCircle}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {!community && projects.length === 0 && direct.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-text-muted">
                Search for someone to start a conversation.
              </p>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
