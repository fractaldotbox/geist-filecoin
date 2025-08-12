import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

@object()
export class GeistCi {
  /**
   * Node.js version to use
   */
  get nodeVersion(): string {
    return "23"
  }

  /**
   * pnpm version to use
   */
  get pnpmVersion(): string {
    return "10.13.1"
  }

  /**
   * Get a Node.js container with pnpm installed
   */
  @func()
  nodeContainer(): Container {
    return dag
      .container()
      .from(`node:${this.nodeVersion}-alpine`)
      .withExec(["corepack", "enable"])
      .withExec(["corepack", "prepare", `pnpm@${this.pnpmVersion}`, "--activate"])
      .withExec(["apk", "add", "--no-cache", "git"])
  }

  /**
   * Install dependencies with pnpm
   */
  @func()
  installDependencies(source: Directory): Container {
    return this.nodeContainer()
      .withDirectory("/app", source, {
        exclude: ["**/node_modules/**"]
      })
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withExec(["pnpm", "install", "--frozen-lockfile"])
  }

  /**
   * Run linting for a specific workspace
   */
  @func()
  async lint(source: Directory, workspace: string): Promise<string> {
    const container = this.installDependencies(source)
    
    const lintCommands: Record<string, string[]> = {
      webapp: ["pnpm", "--filter", "@geist-filecoin/webapp", "run", "lint"],
      auth: ["pnpm", "--filter", "@geist-filecoin/auth", "run", "lint"],
      domain: ["pnpm", "--filter", "@geist-filecoin/domain", "run", "lint"],
      storage: ["pnpm", "--filter", "@geist-filecoin/storage", "run", "lint"]
    }

    const command = lintCommands[workspace]
    if (!command) {
      throw new Error(`Unknown workspace: ${workspace}`)
    }

    return await container.withExec(command).stdout()
  }

  /**
   * Run tests for a specific workspace
   */
  @func()
  async test(source: Directory, workspace: string): Promise<string> {
    const container = this.installDependencies(source)
      .withEnvVariable("NODE_ENV", "test")
    
    const testCommands: Record<string, string[]> = {
      webapp: ["pnpm", "--filter", "@geist-filecoin/webapp", "test"],
      auth: ["pnpm", "--filter", "@geist-filecoin/auth", "test"],
      storage: ["pnpm", "--filter", "@geist-filecoin/storage", "test"]
    }

    const command = testCommands[workspace]
    if (!command) {
      throw new Error(`Unknown workspace: ${workspace}`)
    }

    return await container.withExec(command).withEnvVariable("CI", "true").stdout()
  }

  /**
   * Build packages
   */
  @func()
  async buildPackages(source: Directory): Promise<string> {
    const container = this.installDependencies(source)

    return await container
      .withExec(["pnpm", "--filter", "@geist-filecoin/auth", "run", "build"])
      .withExec(["pnpm", "--filter", "@geist-filecoin/domain", "run", "build"])
      .withExec(["pnpm", "--filter", "@geist-filecoin/storage", "run", "build"])
      .stdout()
  }

  /**
   * Build webapp
   */
  @func()
  async buildWebapp(source: Directory): Promise<Container> {
    const container = this.installDependencies(source)

    return container.withExec(["pnpm", "--filter", "@geist-filecoin/webapp", "run", "build"])
  }

  /**
   * Run type checking
   */
  @func()
  async typeCheck(source: Directory): Promise<string> {
    const container = this.installDependencies(source)

    return await container
      .withExec(["pnpm", "--filter", "@geist-filecoin/webapp", "exec", "tsc", "--noEmit"])
      .withExec(["pnpm", "--filter", "@geist-filecoin/auth", "exec", "tsc", "--noEmit"])
      .withExec(["pnpm", "--filter", "@geist-filecoin/domain", "exec", "tsc", "--noEmit"])
      .withExec(["pnpm", "--filter", "@geist-filecoin/storage", "exec", "tsc", "--noEmit"])
      .stdout()
  }

  /**
   * Run complete CI pipeline
   */
  @func()
  async pipeline(source: Directory): Promise<string> {
    // Run all checks in parallel where possible
    const lintPromises = [
      this.lint(source, "webapp"),
      this.lint(source, "auth"),
      this.lint(source, "domain"),
      this.lint(source, "storage")
    ]

    const testPromises = [
      this.test(source, "webapp"),
      this.test(source, "auth"),
      this.test(source, "storage")
    ]

    const buildPromises = [
      this.buildPackages(source),
      this.buildWebapp(source)
    ]

    try {
      // Wait for all linting to complete
      await Promise.all(lintPromises)
      console.log("✅ All linting passed")

      // Wait for all tests to complete
      await Promise.all(testPromises)
      console.log("✅ All tests passed")

      // Wait for all builds to complete
      await Promise.all(buildPromises)
      console.log("✅ All builds passed")

      // // Run type checking
      await this.typeCheck(source)
      console.log("✅ Type checking passed")

      return "🎉 CI pipeline completed successfully!"
    } catch (error) {
      throw new Error(`CI pipeline failed: ${error}`)
    }
  }

  /**
   * Deploy to Cloudflare Workers
   */
  @func()
  async deployWebapp(
    source: Directory,
    environment: string = "production",
    cloudflareApiToken: string,
    cloudflareAccountId: string,
    viteHost: string,
    viteLivestoreSyncUrl: string,
    viteLivestoreStoreId: string,
    lighthouseApiKey: string,
    geistJwtSecret: string
  ): Promise<string> {
    // First build the application
    const buildContainer = await this.buildWebapp(source)

    // Install wrangler and deploy
    const deployContainer = buildContainer
      .withExec(["npm", "install", "-g", "wrangler@latest"])
      .withEnvVariable("CI", "true")
      .withEnvVariable("CLOUDFLARE_API_TOKEN", cloudflareApiToken)
      .withEnvVariable("CLOUDFLARE_ACCOUNT_ID", cloudflareAccountId)
      .withWorkdir("/app/apps/webapp")

    // Handle environment-specific deployment
    if (environment === "staging") {
      return await deployContainer
        .withExec([
          "sh", "-c", 
          `cp wrangler.jsonc wrangler.staging.jsonc && ` +
          `sed -i 's/"name": "geist-web"/"name": "geist-web-staging"/' wrangler.staging.jsonc && ` +
          `sed -i 's/"pattern": "filecoin.geist.network"/"pattern": "staging.filecoin.geist.network"/' wrangler.staging.jsonc`
        ])
        .withExec([
          "wrangler", "deploy",
          "--config", "wrangler.staging.jsonc",
          "--compatibility-date", "2024-07-29",
          "--minify",
          "--var", `VITE_LIVESTORE_SYNC_URL:${viteLivestoreSyncUrl}`,
          "--var", `VITE_LIVESTORE_STORE_ID:${viteLivestoreStoreId}`,
          "--var", `VITE_HOST:${viteHost}`
        ])
        .stdout()
    } else {
      return await deployContainer
        .withExec([
          "wrangler", "deploy",
          "--compatibility-date", "2024-07-29",
          "--minify",
          "--var", `VITE_LIVESTORE_SYNC_URL:${viteLivestoreSyncUrl}`,
          "--var", `VITE_LIVESTORE_STORE_ID:${viteLivestoreStoreId}`,
          "--var", `VITE_HOST:${viteHost}`
        ])
        .stdout()
    }
  }

  /**
   * Deploy Api worker & LiveStore sync worker
   */
  @func()
  async deployCfWorker(
    source: Directory,
    cloudflareAccountId: string,
    cloudflareApiToken: string,
  ): Promise<string> {
    const container = this.nodeContainer()
      .withDirectory("/app", source)
      .withWorkdir("/app")
      .withExec(["npm", "install", "-g", "wrangler@latest"])
      .withEnvVariable("CI", "true")
      .withEnvVariable("CLOUDFLARE_API_TOKEN", cloudflareApiToken)
      .withEnvVariable("CLOUDFLARE_ACCOUNT_ID", cloudflareAccountId)
      .withWorkdir("/app/packages/cf-worker/livestore-sync")

    return await container
      .withExec(["pnpm", "run", "deploy"])
      .stdout()
  }
  


  /**
   * Build livestore-sidecar Docker image
   * 
   * Seems cloudflare registry can only be pushed via wrangler publish, which requires docker process
   * Dind creates extra complexity and we will run separately
   * currently, as workaround use separate script to build and push with wrangler
   */
  // @func()
  // async buildSidecarImage(source: Directory, tag = "latest"): Promise<string> {
  //   // Create a temporary directory to copy files with symlinks resolved
  //   const tempContainer = dag
  //     .container()
  //     .from("alpine:latest")
  //     .withDirectory("/source", source)
  //     .withWorkdir("/tmp")

  //   // Copy sidecar files to temp directory, resolving symlinks
  //   const copiedFiles = tempContainer
  //     .withExec([
  //       "cp", "-Lr",
  //       "/source/packages/cf-worker/livestore-sidecar/",
  //       "/tmp/sidecar/"
  //     ])
  //     .directory("/tmp/sidecar")

  //   const uuid = crypto.randomUUID()
  //   // Build and tag the Docker image with Cloudflare registry
  //   const imageRef = `ttl.sh/${uuid}:2h`
    

  //   const container = dag
  //     .container()
  //     .build(copiedFiles, {
  //       dockerfile: "Dockerfile"
  //     })
  //     .withLabel("org.opencontainers.image.title", imageRef)
  //     .withLabel("org.opencontainers.image.description", "LiveStore sidecar for Geist Filecoin")
  //     .publish(imageRef)

  //   return await container
  // }


  /**
   * Run health checks
   */
  @func()
  async healthCheck(baseUrl: string): Promise<string> {
    const container = dag
      .container()
      .from("curlimages/curl:latest")
      .withExec(["sh", "-c", "sleep 45"]) // Wait for propagation

    const endpoints = ["/client-metadata.json", "/", "/api/health"]
    let healthReport = `## 🏥 Health Check Report\n\n**Base URL**: ${baseUrl}\n**Timestamp**: ${new Date().toISOString()}\n\n`

    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`
      try {
        const response = await container
          .withExec(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--connect-timeout", "10", "--max-time", "30", url])
          .stdout()

        if (response.trim() === "200") {
          healthReport += `✅ ${endpoint} - Status: 200\n`
        } else {
          healthReport += `❌ ${endpoint} - Status: ${response.trim()}\n`
          throw new Error(`Health check failed for ${endpoint}`)
        }
      } catch (error) {
        healthReport += `❌ ${endpoint} - Error: ${error}\n`
        throw error
      }
    }

    healthReport += `\n✅ All health checks passed!`
    return healthReport
  }
}