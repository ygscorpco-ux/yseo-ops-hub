import { StateChip } from "@/components/state-chip";
import { channelLabels, type ChannelType } from "@/lib/yseo/types";

export function ChannelBadge({ channel }: { channel: ChannelType }) {
  const tone =
    channel === "naver-searchad"
      ? "amber"
      : channel === "search-console"
        ? "sky"
        : "violet";

  return <StateChip label={channelLabels[channel]} tone={tone} />;
}
