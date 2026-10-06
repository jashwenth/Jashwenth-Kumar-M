// DEMO MODE: Supabase is bypassed to allow localhost testing without credentials.
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'auth') {
      return {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: {}, error: null }),
        signUp: async () => ({ data: {}, error: null }),
        signOut: async () => ({ error: null })
      };
    }
    if (prop === 'from') {
      return () => {
        const chain = {
          select: () => chain,
          insert: () => chain,
          update: () => chain,
          delete: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: () => chain,
          single: async () => ({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null })
        };
        return chain;
      };
    }
    if (prop === 'channel') {
      return () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {}
      });
    }
    return undefined;
  }
}) as any;
