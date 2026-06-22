import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Footer, Logo, TopMenu } from "../components";
import { F } from "../lib";
import styles from "./LegalPage.module.css";

interface LegalPageProps {
  doc: "legal-notice" | "privacy-policy" | "cookies-policy";
}

export const LegalPage = ({ doc }: LegalPageProps) => {
  const { i18n } = useTranslation();
  const [ content, setContent ] = useState("");

  const lang = i18n.language.startsWith("es") ? "es" : "en";

  useEffect(() => {
    const loadContent = async () => {
      try{
        const response = await fetch(`/html/${doc}.${lang}.html`);

        if( !response.ok ){
          throw new Error(`Failed to load ${doc}.${lang}.html`);
        }

        setContent(await response.text());
      }catch( error ){
        setContent("<p>Content not available.</p>");
      }
    };

    loadContent();
  }, [ doc, lang ]);

  return (
    <div style={{ background: "#fff", fontFamily: F.body, position: "relative" }}>
      <nav className="flex items-center justify-between px-4 md:px-14 h-16 relative pt-6 md:pt-10" style={{ zIndex: 2 }}>
        <div className="max-w-360 mx-auto w-full flex items-center justify-between">
          <Logo />
          <TopMenu />
        </div>
      </nav>
      <div className="flex-1 px-4 md:px-14 py-12">
        <div className="max-w-360 mx-auto">
          <div
            className={ styles.legal }
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};