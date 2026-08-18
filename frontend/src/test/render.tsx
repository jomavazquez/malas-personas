import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { AuthContext } from "../context/AuthContext";
import type { AuthContextValue } from "../context/AuthContext";

const defaultAuthValue: AuthContextValue = {
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
};

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Initial route(s) for the MemoryRouter. Defaults to "/". */
  route?: string;
  /** Overrides merged onto the default AuthContext value. */
  authValue?: Partial<AuthContextValue>;
}

export const renderWithProviders = (
  ui: ReactElement,
  { route = "/", authValue, ...renderOptions }: RenderWithProvidersOptions = {}
) => {
  const mergedAuthValue: AuthContextValue = { ...defaultAuthValue, ...authValue };

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <I18nextProvider i18n={i18n}>
        <AuthContext.Provider value={mergedAuthValue}>
          {children}
        </AuthContext.Provider>
      </I18nextProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// This file mixes a test helper with a re-export barrel, so it can't satisfy
// react-refresh's "only export components" constraint - it's test-only code
// and never part of the app's fast-refresh boundary.
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";