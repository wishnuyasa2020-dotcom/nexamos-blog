/**
 * NexaMOS Publishing Provider Interface & Mock Implementation
 *
 * Sourced from NexaMOS Blog Master Reference & Phase 6 specifications.
 * Menjaga batas arsitektural (Vercel Adapter Boundary).
 * Domain tidak boleh tahu format API Vercel privat atau internal Git provider.
 */

import type { PublicationPackage } from './publication.ts';

export type DeploymentMode = 'PREVIEW' | 'PRODUCTION';

export interface BuildOutput {
  buildId: string;
  outputFiles: string[];
  renderedHtml?: string;
  builtAt: string;
}

export interface DeploymentOutput {
  deploymentId: string;
  deploymentUrl: string;
  mode: DeploymentMode;
  deployedAt: string;
}

export interface DeploymentStatus {
  state: 'READY' | 'BUILDING' | 'ERROR';
  url: string;
}

export interface ProductionApproval {
  approvedForProduction: boolean;
  approvedBy: string;
  approvedAt: string;
  notes?: string;
}

export interface PublishingProvider {
  build(pkg: PublicationPackage, mode: DeploymentMode): Promise<BuildOutput>;
  deploy(buildId: string, mode: DeploymentMode, approval?: ProductionApproval): Promise<DeploymentOutput>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>;
}

export class MockPublishingProvider implements PublishingProvider {
  private readonly deployments = new Map<string, DeploymentStatus>();

  public async build(pkg: PublicationPackage, mode: DeploymentMode): Promise<BuildOutput> {
    const buildId = `bld-mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      buildId,
      outputFiles: ['/index.html', `/${pkg.slug}/index.html`, '/sitemap.xml'],
      renderedHtml: `<html><body><article><h1>${pkg.title}</h1></article></body></html>`,
      builtAt: new Date().toISOString()
    };
  }

  public async deploy(
    buildId: string,
    mode: DeploymentMode,
    approval?: ProductionApproval
  ): Promise<DeploymentOutput> {
    if (mode === 'PRODUCTION') {
      if (!approval || !approval.approvedForProduction || !approval.approvedBy) {
        throw new Error(
          'Deployment ke mode PRODUCTION ditolak: Membutuhkan persetujuan eksplisit manusia (approvedForProduction = true dan approvedBy).'
        );
      }
    }

    const deploymentId = `dep-mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const deploymentUrl =
      mode === 'PRODUCTION'
        ? 'https://nexamos.cloud/blog'
        : `https://preview-blog-${deploymentId}.nexamos.cloud`;

    this.deployments.set(deploymentId, {
      state: 'READY',
      url: deploymentUrl
    });

    return {
      deploymentId,
      deploymentUrl,
      mode,
      deployedAt: new Date().toISOString()
    };
  }

  public async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    return (
      this.deployments.get(deploymentId) || {
        state: 'READY',
        url: `https://preview-blog-${deploymentId}.nexamos.cloud`
      }
    );
  }
}
