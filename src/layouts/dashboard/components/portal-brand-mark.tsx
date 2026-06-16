import { ERG_ASSETS } from "@/config/seo";

type PortalBrandMarkProps = {
  title: string;
  subtitle?: string;
};

export function PortalBrandMark({ title }: PortalBrandMarkProps) {
  return (
    <div className="flex h-[64px] items-center border-b border-[rgba(145,158,171,0.12)] px-5">
      <img src={ERG_ASSETS.logo} alt={title} className="h-9 w-[110px] object-contain object-left" />
    </div>
  );
}
