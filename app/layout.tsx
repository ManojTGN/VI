import type { Metadata, Viewport } from "next";
import { Anton, Rubik } from "next/font/google";
import { MOTION_STORAGE_KEY } from "@/lib/motion";
import { BASE_PATH, SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const anton = Anton({
    variable: "--font-display",
    weight: "400",
    subsets: ["latin"],
});

const rubik = Rubik({
    variable: "--font-digit",
    weight: ["500", "800"],
    subsets: ["latin"],
});

const title = "Grand Theft Auto VI";
const description =
    "Live countdown to the release of Grand Theft Auto VI in your time zone. Unofficial fan site, not affiliated with Rockstar Games.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    applicationName: title,
    alternates: {
        canonical: BASE_PATH,
    },
    openGraph: {
        title,
        description,
        type: "website",
        url: BASE_PATH,
        siteName: title,
    },
    twitter: {
        card: "summary",
        title,
        description,
    },
};

export const viewport: Viewport = {
    viewportFit: "cover",
    themeColor: "#05060c",
};

// Stamps a saved choice onto <html> before the first paint, so the intro never
// animates for someone who turned animations off. The attribute is deliberately
// absent from the JSX below: React then never tracks it, so adding it here is
// not a hydration mismatch, and no attribute at all means full motion -- which
// is also what someone with JavaScript disabled gets.
const motionScript = `try{var m=localStorage.getItem(${JSON.stringify(
    MOTION_STORAGE_KEY,
)});if(m==="reduced"||m==="full")document.documentElement.dataset.motion=m}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" suppressHydrationWarning className={`${anton.variable} ${rubik.variable}`}>
            <body>
                <script dangerouslySetInnerHTML={{ __html: motionScript }} />
                {children}
            </body>
        </html>
    );
}
