import { Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";

type ErgFooterProps = {
  className?: string;
};

export function ErgFooter({ className = "" }: ErgFooterProps) {
  return (
    <footer className={`relative bg-[#F5F7FA] pt-7 font-sans text-[var(--erg-blue)] ${className}`}>
      <div className="absolute left-0 top-0 h-1 w-full bg-[var(--erg-blue)]" />

      <div className="container mx-auto px-4 pb-11 md:px-6 md:pb-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr_1.1fr] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <img
                alt="Edurise Global Logo"
                className="h-auto w-[82px] object-contain"
                height={36}
                src="https://media.erg.edu.vn/logo/erg.png"
                width={82}
              />
              <span className="text-base font-semibold  text-[var(--erg-blue)]">Edurise Global</span>
            </div>
            <p className="mt-3 max-w-sm text-sm font-medium leading-5 text-slate-600">
              Giáo dục công nghệ cho học sinh và giáo viên ERG.
            </p>
          </div>

          <ContactColumn
            title="Trụ sở chính"
            address="83B Hoàng Sa, Phường Tân Định, TP. Hồ Chí Minh"
            mapHref="https://maps.app.goo.gl/nkpn1e1KZJ1ZvrYg8"
            phone="0766.144.888"
            phoneHref="tel:0766144888"
            email="info@erg.edu.vn"
            emailHref="mailto:info@erg.edu.vn"
          />

          <ContactColumn
            title="Chi nhánh"
            address="40-42 Bình Phú, Phường Bình Phú, TP. Hồ Chí Minh"
            mapHref="https://maps.app.goo.gl/A5izGLp4PALPgjX26"
            phone="0967.689.259"
            phoneHref="tel:0967689259"
            email="daotao@erg.edu.vn"
            emailHref="mailto:daotao@erg.edu.vn"
          />
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute left-0 top-0 z-10 w-full -translate-y-[99%] overflow-hidden leading-[0]">
          <svg
            className="relative block h-[24px] w-[calc(100%+1.3px)] md:h-[38px]"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="fill-[var(--erg-blue)]"
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            />
          </svg>
        </div>

        <div className="relative z-20 bg-[var(--erg-blue)] py-3">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-xs text-white/72 md:flex-row md:px-6">
            <p className="text-center md:text-left">© 2026 Edurise Global. All rights reserved.</p>

            <div className="flex items-center gap-5">
              <FooterPolicyLink href="#">Điều khoản sử dụng</FooterPolicyLink>
              <span className="text-white/35">|</span>
              <FooterPolicyLink href="#">Chính sách bảo mật</FooterPolicyLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ContactColumn({
  address,
  email,
  emailHref,
  mapHref,
  phone,
  phoneHref,
  title,
}: {
  address: string;
  email: string;
  emailHref: string;
  mapHref: string;
  phone: string;
  phoneHref: string;
  title: string;
}) {
  return (
    <div>
      <h3 className="relative mb-4 inline-block text-sm font-medium text-[var(--erg-blue)]">
        {title}
        <span className="absolute -bottom-2 left-0 h-0.5 w-9 rounded-full bg-[#cc0022]" />
      </h3>
      <div className="space-y-2.5 text-sm">
        <ContactLink href={mapHref} icon={<MapPin size={17} />} target="_blank">
          {address}
        </ContactLink>
        <ContactLink href={phoneHref} icon={<Phone size={17} />}>
          {phone}
        </ContactLink>
        <ContactLink href={emailHref} icon={<Mail size={17} />}>
          {email}
        </ContactLink>
      </div>
    </div>
  );
}

function ContactLink({
  children,
  href,
  icon,
  target,
}: {
  children: ReactNode;
  href: string;
  icon: ReactNode;
  target?: "_blank";
}) {
  return (
    <a
      className="group flex items-start gap-3 font-semibold leading-5 text-[var(--erg-blue)] transition-colors hover:text-[#cc0022]"
      href={href}
      rel={target ? "noopener noreferrer" : undefined}
      target={target}
    >
      <span className="mt-0.5 shrink-0 rounded-full bg-white p-1.5 text-[#cc0022] shadow-sm transition group-hover:bg-[#cc0022] group-hover:text-white">
        {icon}
      </span>
      <span>{children}</span>
    </a>
  );
}

function FooterPolicyLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a className="group relative transition hover:text-white" href={href}>
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#cc0022] transition group-hover:w-full" />
    </a>
  );
}
