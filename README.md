# adp-portal
The Azure Development Platform Portal built using [Backstage](https://backstage.io/).

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
Backstage integrates with GitHub to import and create repository data, and Azure AD for authentication. To get these integrations working locally, you will need to create a GitHub app and an App Registration in Azure AD. Update and run the following script to set the credentials required to run the application:

```sh
export GITHUB_APP_ID=<REPLACE>
export GITHUB_CLIENT_ID=<REPLACE>
export GITHUB_CLIENT_SECRET=<REPLACE>

export AUTH_MICROSOFT_CLIENT_ID=<REPLACE>
export AUTH_MICROSOFT_CLIENT_SECRET=<REPLACE>
export AUTH_MICROSOFT_TENANT_ID=<REPLACE>
```

The GitHub integration also requires a private key. Generate and copy this from your GitHub app to the path specified in [github-app-configuration.yaml](app/github-app-configuration.yaml).
To use github private key as a string value, use the following script : 
``` 
#Powershell
$rsaprivkey = (Get-Content "private-key.pem" | Out-String) -replace "`r`n", "\n"

or

#Shell 
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private-key.pem > rsaprivkey.txt

```

The ADO dashboard plugin requires a Personal Access Token (PAT) with build permissions. Currently this cannot be configured to use a Managed Identity.

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
