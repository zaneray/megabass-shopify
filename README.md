# Borealis + Horizon

[Getting started](#getting-started) |
[Requirements](#requirements) |
[Staying up to date with Horizon changes](#staying-up-to-date-with-horizon-changes) |
[Developer tools](#developer-tools) |
[Local Development](#local-development) |
[Contributing](#contributing) |
[License](#license)

Horizon is the flagship of a new generation of first party Shopify themes. It incorporates the latest Liquid Storefronts features, including [theme blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/quick-start?framework=liquid).

- **Web-native in its purest form:** Themes run on the [evergreen web](https://www.w3.org/2001/tag/doc/evergreen-web/). We leverage the latest web browsers to their fullest, while maintaining support for the older ones through progressive enhancement—not polyfills.
- **Lean, fast, and reliable:** Functionality and design defaults to “no” until it meets this requirement. Code ships on quality. Themes must be built with purpose. They shouldn’t support each and every feature in Shopify.
- **Server-rendered:** HTML must be rendered by Shopify servers using Liquid. Business logic and platform primitives such as translations and money formatting don’t belong on the client. Async and on-demand rendering of parts of the page is OK, but we do it sparingly as a progressive enhancement.
- **Functional, not pixel-perfect:** The Web doesn’t require each page to be rendered pixel-perfect by each browser engine. Using semantic markup, progressive enhancement, and clever design, we ensure that themes remain functional regardless of the browser.

## Getting started

We recommend using the Skeleton Theme as a starting point for a theme development project. [Learn more on Shopify.dev](https://shopify.dev/themes/getting-started/create).

To create a new theme project based on Horizon:

```sh
git clone https://github.com/Shopify/horizon.git
```

Install the [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) to connect your local project to a Shopify store. Learn about the [theme developer tools](https://shopify.dev/docs/storefronts/themes/tools) available, and the suggested [developer tools](#developer-tools) below.

Please note that the `main` branch may include code for features not yet released. You may encounter Liquid API properties that are not publicly documented, but will be when the feature is officially rolled out.

## Requirements

- [Node.js](https://nodejs.org/en/download/): 20.10 or higher
- A Node.js package manager: [npm](https://www.npmjs.com/get-npm), [Yarn 1.x](https://classic.yarnpkg.com/lang/en/docs/install), or [pnpm](https://pnpm.io/installation).
- [Git](https://git-scm.com/downloads): 2.28.0 or higher

### Shopify Theme Store development

If you're building a theme for the Shopify Theme Store, then do not use Horizon as a starting point. Themes based on, derived from, or incorporating Horizon are not eligible for submission to to the Shopify Theme Store. Use the [Skeleton Theme](https://github.com/Shopify/skeleton-theme) instead.

## Staying up to date with Horizon changes

Say you're building a new theme off Horizon but you still want to be able to pull in the latest changes, you can add a remote `upstream` pointing to this Horizon repository.

1. Navigate to your local theme folder.
2. Verify the list of remotes and validate that you have both an `origin` and `upstream`:

```sh
git remote -v
```

3. If you don't see an `upstream`, you can add one that points to Shopify's Horizon repository:

```sh
git remote add upstream https://github.com/Shopify/horizon.git
```

4. Pull in the latest Horizon changes into your repository:

```sh
git fetch upstream
git pull upstream main
```

## Developer tools

There are a number of really useful tools that the Shopify Themes team uses during development. Horizon is already set up to work with these tools.

### Shopify CLI

[Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) helps you build Shopify themes faster and is used to automate and enhance your local development workflow. It comes bundled with a suite of commands for developing Shopify themes—everything from working with themes on a Shopify store (e.g. creating, publishing, deleting themes) or launching a development server for local theme development.

You can follow this [quick start guide for theme developers](https://shopify.dev/docs/themes/tools/cli) to get started.

## Commands

Shopify CLI groups commands into topics. The command syntax is: `shopify [topic] [command]`.
Refer to each topic section in the sidebar for a list of available commands.

Or, run the `help` command to get this information right in your terminal.

```bash
shopify help

```

# Local Development

1. Clone this repository
2. Navigate into the directory
3. Login command for shopify CLI has been deprercated. Pass a `--store` flag the first time you run a command that requires connection to a store.
   This store is used in subsequent commands. You will be prompted to login on initial build with `shopify theme dev --store=megabass-wholesale.myshopify.com`.\*\*
4. Ensure `settings_data.json` is present at `src/config/settings_data.json`. You can obtain a copy from the store you are working on.
5. Shopify switch command has been deprecated. Pass a `--store` flag with a new value when you want to run a command against a new store.
   Run `shopify theme info` to view which store you're currently using.
6. To view your theme served locally, visit [localhost:9292](http://127.0.0.1:9292)
   You can specify a different network interface and port using `--host` and `--port`.

### Theme Check

We recommend using [Theme Check](https://github.com/shopify/theme-check) as a way to validate and lint your Shopify themes.

We've added Theme Check to Horizon's [list of VS Code extensions](/.vscode/extensions.json) so if you're using Visual Studio Code as your code editor of choice, you'll be prompted to install the [Theme Check VS Code](https://marketplace.visualstudio.com/items?itemName=Shopify.theme-check-vscode) extension upon opening VS Code after you've forked and cloned Horizon.

You can also run it from a terminal with the following Shopify CLI command:

```bash
shopify theme check
```

You can follow the [theme check documentation](https://shopify.dev/docs/storefronts/themes/tools/theme-check) for more details.

#### Shopify/theme-check-action

Horizon runs [Theme Check](#Theme-Check) on every commit via [Shopify/theme-check-action](https://github.com/Shopify/theme-check-action).

## License

Copyright (c) 2025-present Shopify Inc. See [LICENSE](/LICENSE.md) for further details.

## CLI

```bash
shopify theme dev --store=megabass-wholesale.myshopify.com
```

## Design System Integration

### Figma to Shopify Color Mapping

This theme includes a streamlined workflow for mapping Figma design tokens to Shopify theme color schemes.

#### Quick Start

1. **Export Figma Variables**
   - Use the "Figma Variable Explorer for Devs" extension in Figma
   - Copy the exported CSS variables
   - Update [`.cursor/references/figma-variables.css`](.cursor/references/figma-variables.css)

2. **Run the Mapping Command**

````bash

	# Copy and paste this AI prompt in your preferred Agent:

      Goal: Sync Figma design tokens to Horizon theme (CSS variables + JSON settings)

      Prerequisites:
      - @.cursor/references/figma-variables.css contains latest Figma export
      - @.cursor/references/COLOR_VARIABLES_MAPPING.md maps Figma → Shopify keys

      ==== TASK 1: Sync CSS Variables ====
      Follow all steps in @.cursor/prompts/sync-figma-css-variables.md to:
      - Extract variables from @.cursor/references/figma-variables.css
      - Merge duplicate media query instances (Figma exports multiple blocks)
      - Update variable VALUES in @snippets/figma-horizon-mapped-variables.liquid
      - Add any NEW variables not in theme-styles-variables.liquid
      - Preserve structure, comments, organization

      ==== TASK 2: Sync Theme Color Schemes ====
      1. Read @.cursor/references/COLOR_VARIABLES_MAPPING.md to understand
         which Figma color tokens map to which Shopify theme color setting keys

      2. Extract hex values from @.cursor/references/figma-variables.css
         for all mapped tokens (resolve any CSS var() references to final values)

      3. Update @config/settings_data.json:
         - Preserve all existing JSON structure and non-color keysicon
         - Only update color hex values that have mappings
         - Update BOTH locations:
           * current.color_schemes.scheme-1 through scheme-4
           * presets.Default.color_schemes.scheme-1 through scheme-4

      4. Ensure ALL button states are updated for each scheme:
         - Primary: background, text, border, hover, disabled
         - Secondary: background, text, border, hover, disabled
         - Tertiary: background, text, border, hover, disabled

      TRANSPARENT COLORS: For fully transparent values, use hex with alpha:
      - #00000000 (transparent black) or #ffffff00 (transparent white)
      - Both produce rgb(r, g, b, 0) which renders as fully transparent
      - Shopify's .rgba property correctly outputs: "r, g, b, 0"
      - Example: #00000000 → rgb(0, 0, 0, 0) ✓ valid CSS

      NOTE: This sets STATIC transparency (always 0% opacity). For dynamic
      opacity that adapts to light/dark themes, the theme uses a different
      pattern with CSS variables (not controlled by settings_data.json):
      - rgb(var(--color-foreground-rgb) / var(--opacity-10))
      - See snippets/color-schemes.liquid for examples

      ==== TASK 3: Generate RGB Variables ====
      After syncing all Figma color variables in @snippets/figma-horizon-mapped-variables.liquid:

      1. Find the "Figma color system" block containing hex color values

      2. Create a new "Figma color system (RGB)" block immediately after it

      3. For each hex color variable, create a corresponding -rgb variable:
         - Append `-rgb` suffix to the variable name
         - Convert hex value to space-separated RGB values (no commas)
         - Example: `--color-black: #000000` → `--color-black-rgb: 0 0 0`
         - Example: `--color-primary-400: #00679b` → `--color-primary-400-rgb: 0 103 155`

      4. Include ALL Figma color variables:
         - --color-black, --color-white
         - --color-error-100 through --color-error-400
         - --color-neutral-100 through --color-neutral-900
         - --color-primary-100 through --color-primary-700
         - --color-secondary-100 through --color-secondary-500
         - --color-success-100 through --color-success-400
         - --opacity-dark, --opacity-light, --opacity-transparent

      SYNTAX: Use space-separated values (modern CSS syntax):
      - Correct: `--color-primary-rgb: 0 73 119`
      - Incorrect: `--color-primary-rgb: 0, 73, 119` (commas not needed)

      PURPOSE: RGB variables enable alpha channel usage:
      - Example: `rgb(var(--color-primary-500-rgb) / 0.5)`
      - Example: `background: rgb(var(--color-neutral-800-rgb) / var(--opacity-30))`

      ==== OUTPUT CONFIRMATION ====
      Report:
      - Files changed: @config/settings_data.json, @snippets/figma-horizon-mapped-variables.liquid
      - Count of variables updated vs added in liquid file
      - Count of color values updated in settings_data.json
      - Any mapping errors or missing tokens

	```

4. **Review Changes**
   - Check the updated color schemes in `config/settings_data.json`
   - Test in the Shopify theme editor

#### Full Documentation

For detailed instructions, troubleshooting, and maintenance guidelines, see:
[**Figma Variable Mapping Guide**](.cursor/prompts/figma-variable-mapping.md)

- [`.cursor/references/COLOR_VARIABLES_MAPPING.md`](.cursor/references/COLOR_VARIABLES_MAPPING.md)
- [`.cursor/references/figma-variables.css`](.cursor/references/figma-variables.css)
- [`config/settings_data.json`](config/settings_data.json)

# Bidirectional Git Mirroring: GitHub & Bitbucket

This guide explains how to properly configure a robust bidirectional mirroring pipeline between GitHub and Bitbucket.

## The Core Challenge: Infinite Loops

When two Git servers are set up to automatically push changes to each other, you risk creating an **infinite loop**.
For example:
1. You push a commit to GitHub.
2. GitHub triggers an Action to push it to Bitbucket.
3. Bitbucket receives the push and triggers its Pipeline.
4. Bitbucket pushes the exact same code back to GitHub.
5. GitHub receives the push and triggers its Action... repeating forever!

### The Solution: Native Safe Early-Exits (Hash Comparisons)

We natively ask the servers to **compare their exact commit hashes** *before* running any mirroring logic.

Both pipelines perform an isolated `check-mirror` phase right when they boot up:
```bash
# Fetch the tip of the target server (lightweight metadata)
git fetch "<target-repo-url>" "<branch-name>" --depth 1 || true

# Compare the Tree Hash (absolute file state)
LOCAL_TREE=$(git rev-parse HEAD^{tree})
REMOTE_TREE=$(git rev-parse FETCH_HEAD^{tree} 2>/dev/null || echo "none")

if [ "$LOCAL_TREE" = "$REMOTE_TREE" ]; then
    echo "Echo hook detected (Trees match). Stopping successfully."
    exit 0
fi
````

If the code is already identical, the script immediately prints "Echo hook detected." and safely exits. The pipeline succeeds securely without pushing anything or generating any garbage commits.

---

## Architecture Setup Guide

### Critical First Step: Initial Push

Before setting up these pipelines, **you must push your existing code to the GitHub repository first**. The Bitbucket repository should then be seeded from GitHub (or synchronized via the pipeline). If both repositories start with different initial commits, they will have unrelated histories, which will cause `non-fast-forward` push rejections during mirroring.

This hybrid architecture uses **Access Tokens (HTTPS)** to push from GitHub to Bitbucket (because pushing to Bitbucket via SSH Deploy Keys is not currently supported), and **Deploy Keys (SSH)** to push from Bitbucket to GitHub.

### 1. GitHub to Bitbucket Configuration (HTTPS)

GitHub Actions will authenticate to Bitbucket using a standard App Password/Bearer Token injected directly into the `https://` repository URL.

#### Bitbucket Setup (Generating the Token)

1. Go to your Bitbucket Account settings, or the Workspace settings.
2. Generate an **App Password** or **Access Token** with `repository:write` permissions.
3. Copy the token.

#### GitHub Setup (Saving the Secrets)

1. Go to your GitHub Repository > **Settings** > **Secrets and variables** > **Actions**
2. Create `BITBUCKET_BEARER_TOKEN`: Paste the raw token you copied from Bitbucket.
3. Create `BITBUCKET_REPO_URL`: Enter the HTTPS url for your Bitbucket repository:
   `https://bitbucket.org/<workspace>/<repo>.git`

#### GitHub Actions Workflow (`.github/workflows/push-to-bitbucket.yml`)

> This workflow uses a local Custom Action (`.github/actions/git-mirror-check`) to keep the pipeline logic clean and reusable.

```yaml
jobs:
  check-mirror:
    if: >
      !contains(github.event.head_commit.message, '[skip-ci]') &&
      !contains(github.event.head_commit.message, '[skip ci]') &&
      !contains(github.event.head_commit.message, '[ci skip]')
    runs-on: ubuntu-latest
    outputs:
      is_mirrored: ${{ steps.check.outputs.is-mirrored }}
    steps:
      - uses: actions/checkout@v4
      - name: Check if already mirrored
        id: check
        uses: ./.github/actions/git-mirror-check
        with:
          token: ${{ secrets.BITBUCKET_BEARER_TOKEN }}
          repo-url: ${{ secrets.BITBUCKET_REPO_URL }}
          branch: ${{ github.ref_name }}

  mirror-to-bitbucket:
    needs: check-mirror
    if: needs.check-mirror.outputs.is_mirrored != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Push to Bitbucket
        uses: ./.github/actions/git-mirror-push
        with:
          token: ${{ secrets.BITBUCKET_BEARER_TOKEN }}
          repo-url: ${{ secrets.BITBUCKET_REPO_URL }}
          branch: ${{ github.ref_name }}
```

````

---

### 2. Bitbucket to GitHub Configuration (SSH Deploy Keys)

Bitbucket to GitHub is established strictly over SSH mappings natively using the `git@github` prefix.

#### Bitbucket Setup (Generating SSH Keypair)
1. Go to your Bitbucket Repository > **Repository Settings** > **Pipelines** > **SSH Keys**.
2. Click **Generate keys**.
3. It will immediately show you the **Public Key** it generated for itself (leave this page open).
4. Add `github.com` into the **Known Hosts** input box below, and click **Fetch** and **Add** to register GitHub's fingerprint on the runner.

#### GitHub Setup (Registering the Deploy Key)
1. Go to your GitHub Repository > **Settings** > **Deploy keys**.
2. Click **Add deploy key**.
3. Name it `Bitbucket Pipeline Runner`.
4. Paste the **Public Key** you got from Bitbucket.
5. **CRITICAL:** Ensure you tick the box that says **Allow write access**. Save the key.

#### Bitbucket Repository Variables
1. Back in Bitbucket Repository Settings, navigate to **Repository Variables**.
2. Add a variable named `GITHUB_REPO_URL`.
3. Give it the standard SSH url for your GitHub repository (this prompts the pipeline to automatically use the SSH key you just generated without any extra coding).
   Example: `git@github.com:<workspace>/<repo>.git`

#### Bitbucket Pipelines Workflow (`bitbucket-pipelines.yml`)
> This file is split into two steps. The first step natively evaluates the hashes and places an artifact in the environment (`sync.env`), instructing step 2 to abort immediately. This ensures any tests/builds you add to the pipeline in between these steps will automatically skip cleanly.

```yaml
image: node:24

clone:
  depth: full

definitions:
  steps:
    - step: &check-mirror
        name: Check Mirror State
        script:
          - GITHUB_REPO_URL=${GITHUB_REPO_URL}
          - git remote add github "$GITHUB_REPO_URL" || git remote set-url github "$GITHUB_REPO_URL"
          - git fetch github "$BITBUCKET_BRANCH" --depth 1 || true
          - LOCAL_TREE=$(git rev-parse HEAD^{tree})
          - REMOTE_TREE=$(git rev-parse FETCH_HEAD^{tree} 2>/dev/null || echo "none")
          - |
            if [ "$LOCAL_TREE" = "$REMOTE_TREE" ]; then
              echo "SKIP_SYNC=true" > sync.env
              echo "Trees match. Skip sync step."
              exit 0
            fi
          - echo "SKIP_SYNC=false" > sync.env
        artifacts:
          - sync.env

    - step: &sync-to-github
        name: Sync to GitHub
        script:
          - source sync.env
          - |
            if [ "$SKIP_SYNC" = "true" ]; then
              echo "Skipping sync."
              exit 0
            fi
          - GITHUB_REPO_URL=${GITHUB_REPO_URL}
          - git config --global user.name "Bitbucket Pipelines"
          - git config --global user.email "pipelines@bitbucket.org"
          - git remote add github "$GITHUB_REPO_URL" || git remote set-url github "$GITHUB_REPO_URL"
          - git checkout $BITBUCKET_BRANCH
          - git fetch github $BITBUCKET_BRANCH || true
          - git pull --rebase github $BITBUCKET_BRANCH || { git rebase --abort 2>/dev/null || true; }
          - git push github $BITBUCKET_BRANCH

pipelines:
  branches:
    '**':
      - step: *check-mirror

      ## (Insert Build/Test Steps Here!) ##

      - step: *sync-to-github
````

## Adding Custom Build/Test Steps

If you add tests to Bitbucket between checking and syncing, you often want those tests to **not run** if it's just an automated echo-sync.

To do this, use the `sync.env` artifact we generated. Simply paste these two lines of code at the absolute top of any `script` block for steps that should be skipped during automated syncing:

```yaml
script:
  - source sync.env
  - if [ "$SKIP_SYNC" = "true" ]; then echo "Skipping tests during automated mirror."; exit 0; fi

  ## ... NPM INSTALL ...
  ## ... NPM TEST ...
```
