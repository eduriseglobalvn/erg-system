export type SocialReactionKey = "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";

export type SocialReactionSummary = Record<
  SocialReactionKey,
  {
    count: number;
    label: string;
  }
>;

export const socialReactionKeys: SocialReactionKey[] = ["like", "love", "care", "haha", "wow", "sad", "angry"];

export const viSocialReactionLabels: Record<SocialReactionKey, string> = {
  like: "Thích",
  love: "Yêu thích",
  care: "Thương thương",
  haha: "Haha",
  wow: "Wow",
  sad: "Buồn",
  angry: "Phẫn nộ",
};
