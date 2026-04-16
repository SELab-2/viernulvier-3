import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import Navbar from "~/shared/components/Navbar";
import { ThemeProvider } from "~/shared/components/ThemeContext";
import { AuthSessionProvider } from "./features/auth";
import { getThemeBootstrapScript } from "./shared/utils/theme";
import "./styles/app.css";
import "./i18n";
import { Footer } from "./shared/components/Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" suppressHydrationWarning />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
        <link rel="icon" href={`/favicon.ico?v=2`} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthSessionProvider>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </ThemeProvider>
      </AuthSessionProvider>
    </div>
  );
}
