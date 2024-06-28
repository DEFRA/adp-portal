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

    /**
     * Confguration relating to Entra ID groups
     */
    entraIdGroups: {
      /**
       * Base URL for the Entra ID Groups API
       */
      apiBaseUrl: string;
    };

    /**
     * Confguration relating to ADO Project
     */
    adoProject: {
      /**
       * Base URL for the ADO Project API
       */
      apiBaseUrl: string;
    };
  };
}
