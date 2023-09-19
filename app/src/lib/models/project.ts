import type { Model } from './model';
import type { Upload } from './upload';

export interface Project {
    id: number;
    name: string;
    created: Date;
    updated: Date;
    uploads: Upload[];
    models: Model[];
}

export const updated = (project: Project): Project => {
    return { ...project, updated: new Date() };
}
