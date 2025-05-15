import { Project, Product, Settings, AppState } from '../types';

export class StorageService {
  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  async getProjects(): Promise<Project[]> {
    const projects = await this.get<Project[]>('projects');
    return projects || [];
  }

  async getProjectProducts(): Promise<Record<string, Product[]>> {
    const products = await this.get<Record<string, Product[]>>('projectProducts');
    return products || {};
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.get<Settings>('settings');
    return settings || {
      notifyDeliveryReminders: true,
      daysBeforeDeliveryReminder: 7,
      autoDetectProductInfo: true
    };
  }

  async saveProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index !== -1) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    await this.set('projects', projects);
  }

  async saveProduct(projectId: string, product: Product): Promise<void> {
    const projectProducts = await this.getProjectProducts();
    
    if (!projectProducts[projectId]) {
      projectProducts[projectId] = [];
    }
    
    const index = projectProducts[projectId].findIndex(p => p.id === product.id);
    
    if (index !== -1) {
      projectProducts[projectId][index] = product;
    } else {
      projectProducts[projectId].push(product);
    }
    
    await this.set('projectProducts', projectProducts);
  }

  async deleteProject(projectId: string): Promise<void> {
    const projects = await this.getProjects();
    const projectProducts = await this.getProjectProducts();
    
    const filteredProjects = projects.filter(p => p.id !== projectId);
    delete projectProducts[projectId];
    
    await Promise.all([
      this.set('projects', filteredProjects),
      this.set('projectProducts', projectProducts)
    ]);
  }

  async deleteProduct(projectId: string, productId: string): Promise<void> {
    const projectProducts = await this.getProjectProducts();
    
    if (projectProducts[projectId]) {
      projectProducts[projectId] = projectProducts[projectId].filter(
        p => p.id !== productId
      );
      await this.set('projectProducts', projectProducts);
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.set('settings', settings);
  }
}

export const storageService = new StorageService();