import PromoCodeManager from "@/components/admin/PromoCodeManager";
import SocialMediaManager from "@/components/admin/SocialMediaManager";
import PendingReviewsSection from "@/components/admin/PendingReviewsSection";

const MarketingPage = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold gold-text">Marketing</h1>
    <PromoCodeManager />
    <PendingReviewsSection />
    <SocialMediaManager />
  </div>
);

export default MarketingPage;
