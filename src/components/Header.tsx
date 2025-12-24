
import React from 'react';
// Fix: Ensure standard react-router-dom Link is correctly referenced
import { Link } from 'react-router-dom';

export const Header = () => {
    const logoSrc = "https://glx.globallogic.com/assets/glxLogo-DcUC270S.svg";

    return (
        <header className="bg-white/80 backdrop-blur-sm shadow-sm w-full p-4 z-10">
            <Link to="/">
                <img src={logoSrc} alt="GlobalLogic Logo" className="h-10" />
            </Link>
        </header>
    );
};
