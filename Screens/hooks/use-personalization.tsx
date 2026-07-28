import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type PersonalizationDraft = {
  activities: string[];
  categories: string[];
  topics: string[];
  phone: string;
};

type PersonalizationContextValue = {
  draft: PersonalizationDraft;
  setActivities: (values: string[]) => void;
  setCategories: (values: string[]) => void;
  setTopics: (values: string[]) => void;
  setPhone: (value: string) => void;
  reset: () => void;
};

const initialDraft: PersonalizationDraft = {
  activities: [],
  categories: [],
  topics: [],
  phone: '',
};

const PersonalizationContext = createContext<PersonalizationContextValue | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PersonalizationDraft>(initialDraft);

  const setActivities = useCallback((activities: string[]) => {
    setDraft((current) => ({ ...current, activities }));
  }, []);

  const setCategories = useCallback((categories: string[]) => {
    setDraft((current) => ({ ...current, categories }));
  }, []);

  const setTopics = useCallback((topics: string[]) => {
    setDraft((current) => ({ ...current, topics }));
  }, []);

  const setPhone = useCallback((phone: string) => {
    setDraft((current) => ({ ...current, phone }));
  }, []);

  const reset = useCallback(() => setDraft(initialDraft), []);

  const value = useMemo(
    () => ({
      draft,
      setActivities,
      setCategories,
      setTopics,
      setPhone,
      reset,
    }),
    [draft, reset, setActivities, setCategories, setPhone, setTopics],
  );

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const value = useContext(PersonalizationContext);
  if (!value) {
    throw new Error('usePersonalization must be used inside PersonalizationProvider');
  }
  return value;
}
