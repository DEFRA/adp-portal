# Azure Developer Portal
Welcome to the Azure Devoper Portal (ADP) repository. The portal is built using [Backstage](https://backstage.io/).

## Getting started

### Prerequisites

* Access to a UNIX based operating system. If on Windows it is recommended that you use [WSL](https://learn.microsoft.com/en-us/windows/wsl/)
* A GNU-like build environment available at the command line. For example, on Debian/Ubuntu you will want to have the `make` and `build-essential` packages installed
* `curl` or `wget` installed
* [Node.js Active LTS release](https://nodejs.org/en/blog/release)
* [Yarn](https://classic.yarnpkg.com/en/docs/install#windows-stable)
* [Docker](https://docs.docker.com/engine/install/)
* [Git](https://github.com/git-guides/install-git)

See the [Backstage Getting Started documentation](https://backstage.io/docs/getting-started/#prerequisites) for the full list of prerequisites.

### Integrations
The portal is integrated with various 3rd party services. Connections to these services are managed through the environment variables below:

* GitHub (via a GitHub app)
* Entra ID/Azure/ADO/Microsoft Graph (via an App Registration). ADO also uses a PAT token in some (very limited) scenarios.
* Azure Managed Grafana
* Azure Blob Storage (for TechDocs)
* AKS

### Environment Variables
The application requires the following environment variables to be set. We recommend creating an *env.sh* file in the root of your repo (this is ignored by Git) and pasting the variables in to this file. Before running the application, run `. ./env.sh` from the root of your repo.

```sh
export GITHUB_APP_ID=""
export GITHUB_CLIENT_ID=""
export GITHUB_CLIENT_SECRET=""
export GITHUB_PRIVATE_KEY=""

export AUTH_MICROSOFT_CLIENT_ID=""
export AUTH_MICROSOFT_CLIENT_SECRET=""
export AUTH_MICROSOFT_TENANT_ID=""

export BACKSTAGE_BACKEND_SECRET=""

export ADO_PAT=""
export ADO_ORGANIZATION=""

export GRAFANA_TOKEN=""
export GRAFANA_ENDPOINT=""

export TECHDOCS_AZURE_BLOB_STORAGE_ACCOUNT_NAME=""
export TECHDOCS_AZURE_BLOB_STORAGE_ACCOUNT_KEY=""

export ADP_PORTAL_PLATFORM_ADMINS_GROUP=""
export ADP_PORTAL_PROGRAMME_ADMINS_GROUP=""
export ADP_PORTAL_USERS_GROUP=""

export SND1_CLUSTER_NAME=""
export SND1_CLUSTER_API_SERVER_ADDRESS=""
export SND2_CLUSTER_NAME=""
export SND2_CLUSTER_API_SERVER_ADDRESS=""
export SND3_CLUSTER_NAME=""
export SND3_CLUSTER_API_SERVER_ADDRESS=""
```

To convert a GitHub private key into a format that can be used in the `GITHUB_PRIVATE_KEY` environment variable use one of the following scripts:

**Powershell**
```powershell
$rsaprivkey = (Get-Content "private-key.pem" | Out-String) -replace "`r`n", "\n"
```

**Shell**
```sh
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private-key.pem > rsaprivkey.txt
```

### Techdocs
A hybrid strategy is implemented for techdocs which means documentation can be generated on the fly by out of the box generator or using an external pipeline. 
All generated documenations are stored in Azure blob storage.

For more info please refer : [Ref](./app/packages/backend/src/plugins/techdocs/Techdocs.md)

### Running locally
Run the following commands from the `/app` directory:

```sh
yarn install
yarn dev
```

### Configuration
If you want to override any settings in `./app/app-config.yaml`, create a local configuration file named `app-config.local.yaml` and define your overrides here.

## Feature Requests

If you have an idea for a new feature or an improvement to an existing feature, please follow these steps:

1. Check if the feature has already been requested by searching the project's issue tracker.
2. If the feature hasn't been requested, create a new issue and provide a clear description of the proposed feature and why it would be beneficial.

## Pull Requests

If you're ready to submit your code changes, please follow these steps specified in the [pull_request_template](../.github/pull_request_template.md)

## Code Style Guidelines

To maintain a consistent code style throughout the project, please adhere to the following guidelines:

1. Use descriptive variable and function names.
2. Follow the existing code formatting and indentation style.
3. Write clear and concise comments to explain complex code logic.

## License

Include information about the project's license and any relevant copyright notices.
