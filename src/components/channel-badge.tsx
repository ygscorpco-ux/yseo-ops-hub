import { Badge } from "@/components/ui/badge";
import { channelLabels, type ChannelType } from "@/lib/yseo/types";

export function ChannelBadge({ channel }: { channel: ChannelType }) {
  return (
    <Badge className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-none">
      {channelLabels[channel]}
    </Badge>
  );
}
