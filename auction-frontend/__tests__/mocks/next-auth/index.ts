export * from './useMockSession';

export const mockNextAuth = (methods: any) => {
  return () => {
    // const originalModule = jest.requireActual('next-auth/react');

    return {
      __esModule: true,
      // ...originalModule,
      ...methods
    };
  }
}