import { Blog, GeneratedFile } from './types';
declare const generator: (blog: Blog, basePath: string) => Promise<GeneratedFile[]>;
export = generator;
