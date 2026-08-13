import { getCurrentWindow, Theme } from "@tauri-apps/api/window";
import { createContext, ReactNode, useEffect, useState } from "react";

export const ThemeContext = createContext<Theme>('light');

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        getCurrentWindow().theme().then((theme) => { if (theme !== null) { setTheme(theme) } });

        const unlistenPromise = getCurrentWindow().onThemeChanged(({ payload }) => {
            setTheme(payload);
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    console.log("THEME: ", theme);

    return (
        <ThemeContext value={theme} >
            {children}
        </ThemeContext>
    );
};
