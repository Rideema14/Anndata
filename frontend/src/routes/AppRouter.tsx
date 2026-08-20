import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Always-loaded
import HomePage from "@/pages/home/HomePage";
import ProfilePage from "@/pages/profile/ProfilePage";

// =====================================================
// LAZY-LOADED PAGES
// =====================================================

// Public landing page
const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));

// Authentication
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const OtpVerificationPage = lazy(
  () => import("@/pages/auth/OtpVerificationPage"),
);
const ForgotPasswordPage = lazy(
  () => import("@/pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

// Profile
const SettingsPage = lazy(() => import("@/pages/profile/SettingsPage"));
const EditProfilePage = lazy(() => import("@/pages/profile/EditProfilePage"));

// Marketplace
const MarketplacePage = lazy(
  () => import("@/pages/marketplace/MarketplacePage"),
);
const CategoryPage = lazy(() => import("@/pages/marketplace/CategoryPage"));
const ProductDetailsPage = lazy(
  () => import("@/pages/marketplace/ProductDetailsPage"),
);

// Cart
const CartPage = lazy(() => import("@/pages/cart/CartPage"));
const WishlistPage = lazy(() => import("@/pages/wishlist/WishlistPage"));
const CheckoutPage = lazy(() => import("@/pages/checkout/CheckoutPage"));

// Orders
const OrdersPage = lazy(() => import("@/pages/orders/OrdersPage"));
const OrderDetailsPage = lazy(() => import("@/pages/orders/OrderDetailsPage"));

// Notifications
const NotificationsPage = lazy(
  () => import("@/pages/notifications/NotificationsPage"),
);

// Mandi
const MandiPage = lazy(() => import("@/pages/mandi/MandiPage"));
const MandiHistoryPage = lazy(() => import("@/pages/mandi/MandiHistoryPage"));
const MandiFavoritesPage = lazy(
  () => import("@/pages/mandi/MandiFavoritesPage"),
);
const MandiAlertsPage = lazy(() => import("@/pages/mandi/MandiAlertsPage"));

// Weather
const WeatherPage = lazy(() => import("@/pages/weather/WeatherPage"));

// AI
const AiHomePage = lazy(() => import("@/pages/ai/AiHomePage"));
const CropAdvisorPage = lazy(() => import("@/pages/ai/CropAdvisorPage"));
const DiseaseDetectionPage = lazy(
  () => import("@/pages/ai/DiseaseDetectionPage"),
);
const SoilAnalysisPage = lazy(() => import("@/pages/ai/SoilAnalysisPage"));
const FertilizerAdvicePage = lazy(
  () => import("@/pages/ai/FertilizerAdvicePage"),
);
const IrrigationAdvicePage = lazy(
  () => import("@/pages/ai/IrrigationAdvicePage"),
);
const CropRotationPage = lazy(() => import("@/pages/ai/CropRotationPage"));
const AiChatPage = lazy(() => import("@/pages/ai/AiChatPage"));
const VoiceAssistantPage = lazy(() => import("@/pages/ai/VoiceAssistantPage"));
const AiHistoryPage = lazy(() => import("@/pages/ai/AiHistoryPage"));

// Seeds
const SeedStorePage = lazy(() => import("@/pages/seeds/SeedStorePage"));
const SeedDetailsPage = lazy(() => import("@/pages/seeds/SeedDetailsPage"));
const SeedCartPage = lazy(() => import("@/pages/seeds/SeedCartPage"));
const SeedOrdersPage = lazy(() => import("@/pages/seeds/SeedOrdersPage"));

// Land
const LandMarketplacePage = lazy(
  () => import("@/pages/land/LandMarketplacePage"),
);
const LandDetailsPage = lazy(() => import("@/pages/land/LandDetailsPage"));
const LandVisitRequestPage = lazy(
  () => import("@/pages/land/LandVisitRequestPage"),
);

// Machinery
const MachineryMarketplacePage = lazy(
  () => import("@/pages/machinery/MachineryMarketplacePage"),
);
const MachineryDetailsPage = lazy(
  () => import("@/pages/machinery/MachineryDetailsPage"),
);
const MachineryBookingsPage = lazy(
  () => import("@/pages/machinery/MachineryBookingsPage"),
);

// Seller
const SellerHomePage = lazy(() => import("@/pages/seller/SellerHomePage"));
const SellerOnboardingPage = lazy(
  () => import("@/pages/seller/SellerOnboardingPage"),
);
const SellerDashboardPage = lazy(
  () => import("@/pages/seller/SellerDashboardPage"),
);
const SellerListingsPage = lazy(
  () => import("@/pages/seller/SellerListingsPage"),
);
const AddProductPage = lazy(() => import("@/pages/seller/AddProductPage"));
const SellerOrdersPage = lazy(() => import("@/pages/seller/SellerOrdersPage"));
const SellerAnalyticsPage = lazy(
  () => import("@/pages/seller/SellerAnalyticsPage"),
);
const SellerFeedbackPage = lazy(
  () => import("@/pages/seller/SellerFeedbackPage"),
);
const AddLandListingPage = lazy(
  () => import("@/pages/seller/AddLandListingPage"),
);
const AddMachineryListingPage = lazy(
  () => import("@/pages/seller/AddMachineryListingPage"),
);

// Admin
const AdminDashboardPage = lazy(
  () => import("@/pages/admin/AdminDashboardPage"),
);
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminSellersPage = lazy(() => import("@/pages/admin/AdminSellersPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(
  () => import("@/pages/admin/AdminCategoriesPage"),
);
const AdminReviewsPage = lazy(() => import("@/pages/admin/AdminReviewsPage"));
const AdminSeedsPage = lazy(() => import("@/pages/admin/AdminSeedsPage"));
const AdminAnalyticsPage = lazy(
  () => import("@/pages/admin/AdminAnalyticsPage"),
);

// =====================================================
// ROUTER
// =====================================================

const router = createBrowserRouter([
  // ===================================================
  // PUBLIC LANDING PAGE
  // ===================================================
  {
    path: "/",
    element: <LandingPage />,
  },

  // ===================================================
  // AUTHENTICATION
  // ===================================================
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      {
        path: "/otp-verification",
        element: <OtpVerificationPage />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },

  // ===================================================
  // APPLICATION / LOGGED-IN AREA
  // ===================================================
  {
    element: <AppLayout />,
    children: [
      // Home
      {
        path: "/home",
        element: <HomePage />,
      },

      // Profile
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/edit",
        element: <EditProfilePage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },

      // Marketplace
      {
        path: "/market",
        element: <MarketplacePage />,
      },
      {
        path: "/market/:category",
        element: <CategoryPage />,
      },
      {
        path: "/product/:id",
        element: <ProductDetailsPage />,
      },

      // Cart
      {
        path: "/cart",
        element: <CartPage />,
      },
      {
        path: "/wishlist",
        element: <WishlistPage />,
      },
      {
        path: "/checkout",
        element: <CheckoutPage />,
      },

      // Orders
      {
        path: "/orders",
        element: <OrdersPage />,
      },
      {
        path: "/orders/:id",
        element: <OrderDetailsPage />,
      },

      // Notifications
      {
        path: "/notifications",
        element: <NotificationsPage />,
      },

      // Mandi
      {
        path: "/mandi",
        element: <MandiPage />,
      },
      {
        path: "/mandi/history",
        element: <MandiHistoryPage />,
      },
      {
        path: "/mandi/favorites",
        element: <MandiFavoritesPage />,
      },
      {
        path: "/mandi/alerts",
        element: <MandiAlertsPage />,
      },

      // Weather
      {
        path: "/weather",
        element: <WeatherPage />,
      },

      // AI
      {
        path: "/ai",
        element: <AiHomePage />,
      },
      {
        path: "/ai/crop-advisor",
        element: <CropAdvisorPage />,
      },
      {
        path: "/ai/disease",
        element: <DiseaseDetectionPage />,
      },
      {
        path: "/ai/soil",
        element: <SoilAnalysisPage />,
      },
      {
        path: "/ai/fertilizer",
        element: <FertilizerAdvicePage />,
      },
      {
        path: "/ai/irrigation",
        element: <IrrigationAdvicePage />,
      },
      {
        path: "/ai/crop-rotation",
        element: <CropRotationPage />,
      },
      {
        path: "/ai/chat",
        element: <AiChatPage />,
      },
      {
        path: "/ai/voice",
        element: <VoiceAssistantPage />,
      },
      {
        path: "/ai/history",
        element: <AiHistoryPage />,
      },

      // Seeds
      {
        path: "/seeds",
        element: <SeedStorePage />,
      },
      {
        path: "/seeds/:id",
        element: <SeedDetailsPage />,
      },
      {
        path: "/seeds/cart",
        element: <SeedCartPage />,
      },
      {
        path: "/seeds/orders",
        element: <SeedOrdersPage />,
      },

      // Land
      {
        path: "/land",
        element: <LandMarketplacePage />,
      },
      {
        path: "/land/:id",
        element: <LandDetailsPage />,
      },
      {
        path: "/land/:id/visit",
        element: <LandVisitRequestPage />,
      },

      // Machinery
      {
        path: "/machinery",
        element: <MachineryMarketplacePage />,
      },
      {
        path: "/machinery/:id",
        element: <MachineryDetailsPage />,
      },
      {
        path: "/machinery/bookings",
        element: <MachineryBookingsPage />,
      },

      // Seller
      {
        path: "/seller",
        element: <SellerHomePage />,
      },
      {
        path: "/seller/onboarding",
        element: <SellerOnboardingPage />,
      },
      {
        path: "/seller/dashboard",
        element: <SellerDashboardPage />,
      },
      {
        path: "/seller/listings",
        element: <SellerListingsPage />,
      },
      {
        path: "/seller/add-product",
        element: <AddProductPage />,
      },
      {
        path: "/seller/orders",
        element: <SellerOrdersPage />,
      },
      {
        path: "/seller/analytics",
        element: <SellerAnalyticsPage />,
      },
      {
        path: "/seller/feedback",
        element: <SellerFeedbackPage />,
      },
      {
        path: "/seller/add-land",
        element: <AddLandListingPage />,
      },
      {
        path: "/seller/add-machinery",
        element: <AddMachineryListingPage />,
      },

      // Admin
      {
        path: "/admin",
        element: <AdminDashboardPage />,
      },
      {
        path: "/admin/users",
        element: <AdminUsersPage />,
      },
      {
        path: "/admin/sellers",
        element: <AdminSellersPage />,
      },
      {
        path: "/admin/products",
        element: <AdminProductsPage />,
      },
      {
        path: "/admin/categories",
        element: <AdminCategoriesPage />,
      },
      {
        path: "/admin/reviews",
        element: <AdminReviewsPage />,
      },
      {
        path: "/admin/seeds",
        element: <AdminSeedsPage />,
      },
      {
        path: "/admin/analytics",
        element: <AdminAnalyticsPage />,
      },
      // Application fallback
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
<<<<<<< HEAD
}
=======
}
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
