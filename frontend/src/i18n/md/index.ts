import noticeEN from "./legal-notice.en.md?raw";
import noticeES from "./legal-notice.es.md?raw";
import privacyEN from "./privacy-policy.en.md?raw";
import privacyES from "./privacy-policy.es.md?raw";
import cookiesEN from "./cookies-policy.en.md?raw";
import cookiesES from "./cookies-policy.es.md?raw";

export const legalTranslations: Record<string, Record<string, string>> = {
    "legal-notice": { 
        en: noticeEN,
        es: noticeES   
    },
    "privacy-policy": { 
        en: privacyEN,
        es: privacyES 
    },
    "cookies-policy": { 
        en: cookiesEN ,
        es: cookiesES        
    }
};