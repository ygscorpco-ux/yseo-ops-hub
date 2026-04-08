import { Badge } from "@/components/ui/badge";
import { channelLabels, type ChannelType } from "@/lib/yseo/types";

export function ChannelBadge({ channel }: { channel: ChannelType }) {
  return (
    <Badge className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {channelLabels[channel]}
    </Badge>
  );
}
