import Link from "next/link";

const links = [
  { title: "Home", href: "/" },
  { title: "Features", href: "/#features" },
  { title: "Redact", href: "/redact" },
  { title: "Privacy", href: "/" },
  { title: "Terms", href: "/" },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white py-16 relative overflow-hidden">
      {/* Subtle gradient glow from bottom */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/"
            aria-label="go home"
            className="mx-auto block size-fit"
          >
            <span
              className="text-4xl md:text-5xl font-bold font-panchang hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300"
              style={{
                fontWeight: 670,
                textShadow: "0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.1)",
              }}
            >
              Zen Audit
            </span>
          </Link>

          <div className="my-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <div className="flex flex-wrap justify-center gap-4 sm:hidden">
              {links.slice(0, 3).map((link, index) => (
                <FooterLink key={index} href={link.href}>
                  {link.title}
                </FooterLink>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:hidden">
              {links.slice(3).map((link, index) => (
                <FooterLink key={index + 3} href={link.href}>
                  {link.title}
                </FooterLink>
              ))}
            </div>
            <div className="hidden sm:flex sm:gap-6">
              {links.map((link, index) => (
                <FooterLink key={index} href={link.href}>
                  {link.title}
                </FooterLink>
              ))}
            </div>
          </div>

          <span className="text-white/60 block text-center text-sm font-geist">
            © {new Date().getFullYear()} Zen Audit, All rights reserved
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-block overflow-hidden h-5 flex items-center text-white/60 hover:text-white duration-150 font-geist"
    >
      <div className="flex flex-col transition-transform duration-200 ease-out transform group-hover:-translate-y-1/2">
        <span className="text-white/60">{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </Link>
  );
}
