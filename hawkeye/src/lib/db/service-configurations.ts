import { db } from '../db';
import { serviceConfigurations } from '../../../drizzle-db/schema';
import { eq, and } from 'drizzle-orm';
import type { ServiceConfig } from '../../../drizzle-db/schema/app';

export interface CreateServiceConfigurationData {
  accountId: string;
  serviceType: 's3' | 'ec2' | 'ebs' | 'cloudformation' | 'iam' | 'lambda';
  isEnabled: boolean;
  configuration: ServiceConfig;
}

export interface ServiceConfigurationData {
  id: string;
  accountId: string;
  serviceType: string;
  isEnabled: boolean;
  configuration: ServiceConfig;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceConfigurationService {
  /**
   * Create a new service configuration
   */
  async createServiceConfiguration(data: CreateServiceConfigurationData) {
    const [config] = await db
      .insert(serviceConfigurations)
      .values({
        accountId: data.accountId,
        serviceType: data.serviceType,
        isEnabled: data.isEnabled,
        configuration: data.configuration,
      })
      .returning();

    return config;
  }

  /**
   * Get service configurations for an AWS account
   */
  async getServiceConfigurationsByAccountId(accountId: string): Promise<ServiceConfigurationData[]> {
    const configs = await db
      .select()
      .from(serviceConfigurations)
      .where(eq(serviceConfigurations.accountId, accountId));

    return configs.map(config => ({
      id: config.id,
      accountId: config.accountId,
      serviceType: config.serviceType,
      isEnabled: config.isEnabled,
      configuration: config.configuration as ServiceConfig,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  /**
   * Get a specific service configuration
   */
  async getServiceConfiguration(
    accountId: string, 
    serviceType: string
  ): Promise<ServiceConfigurationData | null> {
    const [config] = await db
      .select()
      .from(serviceConfigurations)
      .where(and(
        eq(serviceConfigurations.accountId, accountId),
        eq(serviceConfigurations.serviceType, serviceType)
      ));

    if (!config) return null;

    return {
      id: config.id,
      accountId: config.accountId,
      serviceType: config.serviceType,
      isEnabled: config.isEnabled,
      configuration: config.configuration as ServiceConfig,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update service configuration
   */
  async updateServiceConfiguration(
    accountId: string,
    serviceType: string,
    updates: Partial<CreateServiceConfigurationData>
  ) {
    const [config] = await db
      .update(serviceConfigurations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(serviceConfigurations.accountId, accountId),
        eq(serviceConfigurations.serviceType, serviceType)
      ))
      .returning();

    return config;
  }

  /**
   * Delete service configuration
   */
  async deleteServiceConfiguration(accountId: string, serviceType: string) {
    await db
      .delete(serviceConfigurations)
      .where(and(
        eq(serviceConfigurations.accountId, accountId),
        eq(serviceConfigurations.serviceType, serviceType)
      ));
  }

  /**
   * Get enabled services for an account
   */
  async getEnabledServices(accountId: string): Promise<string[]> {
    const configs = await db
      .select({ serviceType: serviceConfigurations.serviceType })
      .from(serviceConfigurations)
      .where(and(
        eq(serviceConfigurations.accountId, accountId),
        eq(serviceConfigurations.isEnabled, true)
      ));

    return configs.map(config => config.serviceType);
  }

  /**
   * Bulk create service configurations (for onboarding)
   */
  async createMultipleServiceConfigurations(configurations: CreateServiceConfigurationData[]) {
    if (configurations.length === 0) return [];

    const configs = await db
      .insert(serviceConfigurations)
      .values(configurations)
      .returning();

    return configs;
  }

  /**
   * Check if a service is enabled for an account
   */
  async isServiceEnabled(accountId: string, serviceType: string): Promise<boolean> {
    const [config] = await db
      .select({ isEnabled: serviceConfigurations.isEnabled })
      .from(serviceConfigurations)
      .where(and(
        eq(serviceConfigurations.accountId, accountId),
        eq(serviceConfigurations.serviceType, serviceType)
      ));

    return config?.isEnabled || false;
  }
}

export const serviceConfigurationService = new ServiceConfigurationService();