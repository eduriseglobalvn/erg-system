import { ERG_ASSETS } from "@/config/seo";

type PortalBrandMarkProps = {
  title: string;
  subtitle?: string;
};

export function PortalBrandMark({ title }: PortalBrandMarkProps) {
  return (
    <div className="flex h-[76px] items-center border-b border-slate-200 px-5">
      <img src={ERG_ASSETS.logo} alt={title} className="h-10 w-[122px] object-contain object-left" />
    </div>
  );
}
