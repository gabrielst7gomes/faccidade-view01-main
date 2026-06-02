import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/routes/index";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FacCidade | Faculdade em Aparecida de Goiânia com 50% de Bolsa" },
      { name: "description", content: "Graduação e Pós-Graduação presenciais no centro de Aparecida de Goiânia. 50% de bolsa garantida, laboratórios completos e estágio desde o início. Inscreva-se já!" },
      { name: "author", content: "FacCidade" },
      { property: "og:title", content: "FacCidade | Faculdade em Aparecida de Goiânia com 50% de Bolsa" },
      { property: "og:description", content: "Graduação e Pós-Graduação presenciais no centro de Aparecida de Goiânia. 50% de bolsa garantida, laboratórios completos e estágio desde o início. Inscreva-se já!" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#1A3A6E" },
      { name: "twitter:title", content: "FacCidade | Faculdade em Aparecida de Goiânia com 50% de Bolsa" },
      { name: "twitter:description", content: "Graduação e Pós-Graduação presenciais no centro de Aparecida de Goiânia. 50% de bolsa garantida, laboratórios completos e estágio desde o início. Inscreva-se já!" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b37a44e6-2110-479a-b4b1-ce19b679c293/id-preview-4624bf10--fc59371d-9798-4c9a-85bd-91540df85e42.lovable.app-1778284005668.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b37a44e6-2110-479a-b4b1-ce19b679c293/id-preview-4624bf10--fc59371d-9798-4c9a-85bd-91540df85e42.lovable.app-1778284005668.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "FacCidade - Faculdade Cidade Aparecida de Goiânia",
          url: "https://faccidade.edu.br",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Aparecida de Goiânia",
            addressRegion: "GO",
            addressCountry: "BR",
          },
          telephone: "+55 62 98603-1010",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const isLandingPage = router.state.location.pathname === "/";
  const isAdminPage = router.state.location.pathname.startsWith("/adminincomy");
  const isEduPage = router.state.location.pathname.startsWith("/edu");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col isolate">
        {(!isLandingPage && !isAdminPage && !isEduPage) && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {(!isLandingPage && !isAdminPage && !isEduPage) && <Footer />}
        {(!isLandingPage && !isAdminPage && !isEduPage) && <WhatsAppButton />}
      </div>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
