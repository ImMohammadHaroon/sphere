import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getRoleSidebar } from "@/components/layout/roleSidebars";
import { ChatRoomSidebar } from "@/features/chat/components/ChatRoomSidebar";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { useChatRoom, useChatRooms } from "@/features/chat/hooks/useChatRooms";
import { useChatRoomsRealtime } from "@/features/chat/hooks/useChatRoomsRealtime";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";

export function ChatPage() {
  const { user } = useAuth();
  const { roomId } = useParams();
  const location = useLocation();
  const { data, isLoading: roomsLoading } = useChatRooms();
  useChatRoomsRealtime();

  const allRooms = useMemo(() => {
    if (!data) return [];
    return [
      data.community,
      ...(data.projects ?? []),
      ...(data.direct ?? []),
    ].filter(Boolean);
  }, [data]);

  const roomFromList = allRooms.find((room) => room._id === roomId);
  const needsFetch = Boolean(roomId && !roomFromList);
  const { data: fetchedRoom, isLoading: roomLoading } = useChatRoom(
    needsFetch ? roomId : undefined
  );

  const activeRoom =
    roomFromList ??
    fetchedRoom ??
    location.state?.room ??
    (roomId ? null : data?.community);

  const panelLoading =
    (roomsLoading && !activeRoom) || (needsFetch && roomLoading && !activeRoom);

  return (
    <DashboardShell
      sidebar={getRoleSidebar(user?.role)}
      dashboardRole={user?.role}
      showPageHeader={false}
    >
      <div
        className="chat-shell flex h-[calc(100dvh-7.5rem)] min-h-[540px] overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--chat-thread))] shadow-[0_8px_40px_-12px_rgba(15,45,30,0.18)]"
      >
        <div className="w-full max-w-[17rem] shrink-0 border-r border-border/50 lg:max-w-xs">
          <ChatRoomSidebar activeRoomId={activeRoom?._id ?? roomId} />
        </div>

        <div className="min-w-0 flex-1 bg-[hsl(var(--chat-thread))]">
          {panelLoading ? (
            <div className="flex h-full items-center justify-center p-8">
              <Skeleton className="h-32 w-full max-w-md rounded-2xl" />
            </div>
          ) : (
            <ChatPanel room={activeRoom} />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
