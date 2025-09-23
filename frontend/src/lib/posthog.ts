import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY || '', {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      loaded: (posthog) => {
        if (import.meta.env.NODE_ENV === 'development') console.log('PostHog loaded');
      }
    });
  }
};

export { posthog };