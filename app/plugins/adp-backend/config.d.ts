export interface Config {
  /**
   * Configuration options for the adp-backend plugin
   */
  adp: {
    /**
     * Configuration relating to Flux onboarding
     */
    fluxOnboarding: {
      /**
       * Base URL for the Flux Config API
       */
      apiBaseUrl: string;

      /**
       * Default configuration values applied to the project team
       */
      defaultConfigVariables?: Array<{
        key: string;
        value: string;
      }>;
    };
  };
}
