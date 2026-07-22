import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const DashboardPageMetaContext = createContext(null);

function pageMetaEquals(a, b) {
  return (
    a?.title === b?.title &&
    a?.description === b?.description &&
    a?.showPageHeader === b?.showPageHeader &&
    a?.showBack === b?.showBack &&
    a?.backLabel === b?.backLabel &&
    a?.backTo === b?.backTo
  );
}

export function DashboardPageMetaProvider({ children }) {
  const [pageMeta, setPageMetaState] = useState({});

  const setPageMeta = useCallback((next) => {
    setPageMetaState((prev) => (pageMetaEquals(prev, next) ? prev : next));
  }, []);

  const value = useMemo(
    () => ({ pageMeta, setPageMeta }),
    [pageMeta, setPageMeta]
  );

  return (
    <DashboardPageMetaContext.Provider value={value}>
      {children}
    </DashboardPageMetaContext.Provider>
  );
}

export function useDashboardPageMeta(meta = {}) {
  const setPageMeta = useContext(DashboardPageMetaContext)?.setPageMeta;

  useLayoutEffect(() => {
    if (!setPageMeta) return undefined;

    setPageMeta(meta);
    return () => {
      setPageMeta({});
    };
  }, [
    setPageMeta,
    meta.title,
    meta.description,
    meta.showPageHeader,
    meta.showBack,
    meta.backLabel,
    meta.backTo,
  ]);
}

export function useDashboardPageMetaState() {
  const context = useContext(DashboardPageMetaContext);
  return context?.pageMeta ?? {};
}
