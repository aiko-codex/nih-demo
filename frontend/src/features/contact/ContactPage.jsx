import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import ContactForm from "@/features/contact/ContactForm";
import { homeCopy } from "@/features/home/homeCopy";

function DetailItem({ label, children }) {
  return (
    <div className="border-t border-white/10 pt-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 text-[15px] text-white/85">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="dark min-h-screen bg-[#05060b] text-white">
      <SiteNav />
      <PageHero eyebrow="Contact us" title="Let's talk.">
        Questions about a window, a sponsorship or a program at the Hub? Send a note and we will reply.
      </PageHero>
      <main className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1.4fr_1fr]">
          <ContactForm />
          <aside className="space-y-6">
            <DetailItem label="Email">
              <a href={`mailto:${homeCopy.email}`} className="hover:text-primary">{homeCopy.email}</a>
            </DetailItem>
            <DetailItem label="Visit">{homeCopy.address}</DetailItem>
            <DetailItem label="Sponsorships">
              Pick a window on the building and sponsor it online in USD or INR.
            </DetailItem>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
