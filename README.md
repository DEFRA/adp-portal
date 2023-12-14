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

### Running locally
Run the following commands from the `/app` directory:

```sh
yarn install
yarn dev
```