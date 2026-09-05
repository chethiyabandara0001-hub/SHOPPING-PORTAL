import { useEffect, useState } from "react";
import { parseHash, StoreProvider } from "./lib/store";
import type { Route } from "./lib/store";
import { CartDrawer, Footer, Header } from "./components/chrome";
import { ToastHost } from "./components/ui";
import Shop from "./pages/Shop";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import SellerPage from "./pages/SellerPage";
import AdminPage from "./pages/AdminPage";
import OnboardingPage from "./pages/OnboardingPage";
import { navigate } from "./lib/store";
import { IconArrowRight } from "./components/Icons";

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <p className="font-display text-[72px] font-extrabold leading-none text-pine">404</p>
      <h1 className="font-display mt-3 text-2xl font-extrabold">This aisle doesn't exist.</h1>
      <p className="mt-2 text-sm text-inksoft">The link is stale or the stall moved. The floor, though, is right where you left it.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-bold text-card transition hover:bg-pinedeep active:scale-95"
      >
        Back to the floor <IconArrowRight size={15} />
      </button>
    </div>
  );
}

function Shell() {
  const route = useRoute();
  const routeKey = `/${route.parts[0] ?? ""}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [routeKey]);

  let page: React.ReactNode;
  if (route.path === "/" || route.path === "") page = <Shop route={route} />;
  else if (route.parts[0] === "product" && route.parts[1]) page = <ProductPage id={route.parts[1]} />;
  else if (route.parts[0] === "checkout") page = <CheckoutPage />;
  else if (route.parts[0] === "auth") page = <AuthPage route={route} />;
  else if (route.parts[0] === "account") page = <AccountPage route={route} />;
  else if (route.parts[0] === "seller") page = <SellerPage />;
  else if (route.parts[0] === "admin") page = <AdminPage />;
  else if (route.parts[0] === "onboarding") page = <OnboardingPage />;
  else page = <NotFound />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header route={routeKey} />
      <main key={routeKey} className="anim-fade flex-1">{page}</main>
      <Footer />
      <CartDrawer />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
