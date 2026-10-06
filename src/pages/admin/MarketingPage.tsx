import SocialMediaManager from "@/components/admin/SocialMediaManager";
import PendingReviewsSection from "@/components/admin/PendingReviewsSection";

const MarketingPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Marketing</h1>
    <div className="space-y-8">
      <PendingReviewsSection />
      <SocialMediaManager />
    </div>
  </div>
);

export default MarketingPage;
