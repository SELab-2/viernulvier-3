import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { getThemeBootstrapScript } from "./shared/utils/theme";
import Navbar from "~/shared/components/Navbar";
import { ThemeProvider } from "~/shared/components/ThemeContext";
import "./styles/app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" suppressHydrationWarning />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
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
    <div>
      <ThemeProvider>
        <Navbar />
        <main>
          <Outlet />
        </main>
      </ThemeProvider>
    </div>
  );
}
